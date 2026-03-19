// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IPrivatePerps.sol";
import "./interfaces/IPriceOracle.sol";
import "./Vault.sol";
import "./FundingRate.sol";

/// @title PositionManager
/// @notice Core perps engine. Position data is committed as a hash and never
///         stored on-chain in plaintext. Arcium MXE computes liquidation checks
///         and PnL privately, submitting a proof the contract verifies.
contract PositionManager is IPrivatePerps, Ownable, ReentrancyGuard, Pausable {
    uint256 public constant MIN_COLLATERAL = 10e6;
    uint256 public constant MAX_LEVERAGE_BPS = 50 * 1e4;
    uint256 public constant LIQUIDATION_FEE_BPS = 50;
    uint256 public constant PROTOCOL_FEE_BPS = 10;
    uint256 public constant BPS = 10_000;

    Vault public immutable vault;
    IPriceOracle public immutable oracle;
    FundingRate public immutable fundingRate;
    address public arciumVerifier;

    mapping(bytes32 => Market) public markets;
    bytes32[] public marketIds;
    mapping(bytes32 => PositionCommitment) public positions;
    mapping(address => bytes32[]) public traderPositions;
    uint256 public protocolFees;

    event MarketCreated(bytes32 indexed marketId, address token, uint256 maxLeverage);
    event ArciumVerifierSet(address indexed verifier);
    event ProtocolFeesWithdrawn(address indexed to, uint256 amount);

    modifier onlyArcium() {
        require(msg.sender == arciumVerifier, "PositionManager: not Arcium verifier");
        _;
    }

    modifier marketExists(bytes32 marketId) {
        require(markets[marketId].isActive, "PositionManager: market inactive");
        _;
    }

    constructor(
        address _vault,
        address _oracle,
        address _fundingRate,
        address _arciumVerifier
    ) Ownable(msg.sender) {
        require(_vault != address(0), "PM: zero vault");
        require(_oracle != address(0), "PM: zero oracle");
        require(_fundingRate != address(0), "PM: zero funding");
        require(_arciumVerifier != address(0), "PM: zero arcium");

        vault = Vault(_vault);
        oracle = IPriceOracle(_oracle);
        fundingRate = FundingRate(_fundingRate);
        arciumVerifier = _arciumVerifier;
    }

    function createMarket(
        address token,
        uint256 maxLeverage,
        uint256 maintenanceMarginBps
    ) external onlyOwner returns (bytes32 marketId) {
        require(token != address(0), "PM: zero token");
        require(maxLeverage <= MAX_LEVERAGE_BPS, "PM: leverage too high");
        require(maintenanceMarginBps >= 50, "PM: margin too low");

        marketId = keccak256(abi.encodePacked(token, block.chainid));
        require(!markets[marketId].isActive, "PM: market exists");

        markets[marketId] = Market({
            token: token,
            maxLeverage: maxLeverage,
            maintenanceMargin: maintenanceMarginBps,
            openInterestLong: 0,
            openInterestShort: 0,
            isActive: true
        });

        marketIds.push(marketId);
        emit MarketCreated(marketId, token, maxLeverage);
    }

    function setArciumVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "PM: zero verifier");
        arciumVerifier = _verifier;
        emit ArciumVerifierSet(_verifier);
    }

    /// @notice Open a private position.
    /// @param commitmentHash keccak256 of encrypted(size, side, leverage, entryPrice, salt)
    /// @param arciumProof    Proof from Arcium MXE that position parameters are valid
    function openPosition(
        bytes32 marketId,
        uint256 collateral,
        bytes32 commitmentHash,
        bytes calldata arciumProof
    )
        external
        nonReentrant
        whenNotPaused
        marketExists(marketId)
        returns (bytes32 positionId)
    {
        require(collateral >= MIN_COLLATERAL, "PM: collateral too low");
        require(commitmentHash != bytes32(0), "PM: empty commitment");
        require(arciumProof.length > 0, "PM: empty proof");

        require(
            _verifyOpenProof(marketId, msg.sender, collateral, commitmentHash, arciumProof),
            "PM: invalid Arcium proof"
        );

        positionId = keccak256(
            abi.encodePacked(msg.sender, marketId, commitmentHash, block.timestamp)
        );
        require(positions[positionId].openedAt == 0, "PM: position ID collision");

        vault.lockCollateral(msg.sender, collateral);

        uint256 fee = (collateral * PROTOCOL_FEE_BPS) / BPS;
        protocolFees += fee;

        positions[positionId] = PositionCommitment({
            commitmentHash: commitmentHash,
            arciumProof: arciumProof,
            collateral: collateral - fee,
            openedAt: block.timestamp,
            status: PositionStatus.OPEN,
            revealedPnl: 0
        });

        traderPositions[msg.sender].push(positionId);
        fundingRate.updateFunding(marketId);

        emit PositionOpened(msg.sender, positionId, commitmentHash, collateral, block.timestamp);
    }

    /// @notice Close a position. Only final PnL is revealed — position details stay private.
    function closePosition(
        bytes32 positionId,
        int256 revealedPnl,
        bytes calldata arciumProof
    ) external nonReentrant whenNotPaused {
        PositionCommitment storage pos = positions[positionId];
        require(pos.status == PositionStatus.OPEN, "PM: position not open");
        require(pos.openedAt > 0, "PM: position not found");

        bool isTrader = _isPositionOwner(msg.sender, positionId);
        bool isArcium = msg.sender == arciumVerifier;
        require(isTrader || isArcium, "PM: not authorized to close");

        require(
            _verifyCloseProof(positionId, revealedPnl, arciumProof),
            "PM: invalid close proof"
        );

        pos.status = PositionStatus.CLOSED;
        pos.revealedPnl = revealedPnl;
        pos.arciumProof = arciumProof;

        vault.unlockCollateral(msg.sender, pos.collateral, revealedPnl);

        emit PositionClosed(msg.sender, positionId, revealedPnl, block.timestamp);
        emit ArciumProofVerified(positionId, keccak256(arciumProof));
    }

    /// @notice Liquidate an undercollateralized position privately.
    ///         Liquidators never see position details — only that it's liquidatable.
    function liquidatePosition(
        address trader,
        bytes32 positionId,
        bytes calldata arciumLiquidationProof
    ) external nonReentrant whenNotPaused {
        PositionCommitment storage pos = positions[positionId];
        require(pos.status == PositionStatus.OPEN, "PM: position not open");

        require(
            _verifyLiquidationProof(trader, positionId, arciumLiquidationProof),
            "PM: invalid liquidation proof"
        );

        pos.status = PositionStatus.LIQUIDATED;
        uint256 liquidatorFee = (pos.collateral * LIQUIDATION_FEE_BPS) / BPS;
        vault.slashCollateral(trader, pos.collateral, msg.sender, liquidatorFee);

        emit PositionLiquidated(trader, positionId, msg.sender, block.timestamp);
        emit ArciumProofVerified(positionId, keccak256(arciumLiquidationProof));
    }

    // ─── Proof Verification ──────────────────────────────────────────────────
    // TODO: Replace with real Arcium on-chain verifier calls on mainnet

    function _verifyOpenProof(
        bytes32 marketId,
        address trader,
        uint256 collateral,
        bytes32 commitmentHash,
        bytes calldata proof
    ) internal pure returns (bool) {
        return proof.length >= 32 &&
               commitmentHash != bytes32(0) &&
               collateral >= MIN_COLLATERAL &&
               marketId != bytes32(0) &&
               trader != address(0);
    }

    function _verifyCloseProof(
        bytes32 positionId,
        int256 revealedPnl,
        bytes calldata proof
    ) internal pure returns (bool) {
        return proof.length >= 32 &&
               positionId != bytes32(0) &&
               revealedPnl >= -1_000_000e6 &&
               revealedPnl <= 1_000_000e6;
    }

    function _verifyLiquidationProof(
        address trader,
        bytes32 positionId,
        bytes calldata proof
    ) internal pure returns (bool) {
        return proof.length >= 32 &&
               trader != address(0) &&
               positionId != bytes32(0);
    }

    // ─── Views ───────────────────────────────────────────────────────────────

    function getPosition(bytes32 positionId) external view returns (PositionCommitment memory) {
        return positions[positionId];
    }

    function getTraderPositions(address trader) external view returns (bytes32[] memory) {
        return traderPositions[trader];
    }

    function getMarket(bytes32 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getAllMarketIds() external view returns (bytes32[] memory) {
        return marketIds;
    }

    function _isPositionOwner(address trader, bytes32 positionId) internal view returns (bool) {
        bytes32[] memory ids = traderPositions[trader];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == positionId) return true;
        }
        return false;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
