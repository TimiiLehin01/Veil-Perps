// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PositionManager.sol";
import "./interfaces/IPriceOracle.sol";

/// @title LiquidationEngine
/// @notice Coordinates liquidation bots with Arcium private health checks.
///         Liquidators submit Arcium proofs proving a position is underwater
///         WITHOUT revealing position details.
contract LiquidationEngine is Ownable {
    PositionManager public immutable positionManager;
    IPriceOracle public immutable oracle;

    mapping(address => bool) public approvedLiquidators;
    bool public permissionlessLiquidation = false;

    uint256 public totalLiquidations;
    mapping(address => uint256) public liquidatorCount;

    event LiquidatorApproved(address indexed liquidator);
    event LiquidatorRevoked(address indexed liquidator);
    event LiquidationExecuted(
        address indexed liquidator,
        address indexed trader,
        bytes32 indexed positionId
    );
    event PermissionlessEnabled();

    modifier onlyLiquidator() {
        require(
            permissionlessLiquidation || approvedLiquidators[msg.sender],
            "LiquidationEngine: not approved liquidator"
        );
        _;
    }

    constructor(address _positionManager, address _oracle) Ownable(msg.sender) {
        positionManager = PositionManager(_positionManager);
        oracle = IPriceOracle(_oracle);
    }

    function executeLiquidation(
        address trader,
        bytes32 positionId,
        bytes calldata arciumProof
    ) external onlyLiquidator {
        positionManager.liquidatePosition(trader, positionId, arciumProof);
        totalLiquidations++;
        liquidatorCount[msg.sender]++;
        emit LiquidationExecuted(msg.sender, trader, positionId);
    }

    function batchLiquidate(
        address[] calldata traders,
        bytes32[] calldata positionIds,
        bytes[] calldata arciumProofs
    ) external onlyLiquidator {
        require(
            traders.length == positionIds.length &&
            positionIds.length == arciumProofs.length,
            "LiquidationEngine: length mismatch"
        );

        for (uint256 i = 0; i < traders.length; i++) {
            try positionManager.liquidatePosition(
                traders[i],
                positionIds[i],
                arciumProofs[i]
            ) {
                totalLiquidations++;
                liquidatorCount[msg.sender]++;
                emit LiquidationExecuted(msg.sender, traders[i], positionIds[i]);
            } catch {
                continue;
            }
        }
    }

    function approveLiquidator(address liquidator) external onlyOwner {
        approvedLiquidators[liquidator] = true;
        emit LiquidatorApproved(liquidator);
    }

    function revokeLiquidator(address liquidator) external onlyOwner {
        approvedLiquidators[liquidator] = false;
        emit LiquidatorRevoked(liquidator);
    }

    function enablePermissionlessLiquidation() external onlyOwner {
        permissionlessLiquidation = true;
        emit PermissionlessEnabled();
    }
}
