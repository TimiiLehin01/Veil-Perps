
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MockUSDC.sol";
import "../src/Vault.sol";
import "../src/FundingRate.sol";
import "../src/PositionManager.sol";
import "../src/PriceOracle.sol";

contract PrivatePerpsTest is Test {
    MockUSDC usdc;
    Vault vault;
    FundingRate fundingRate;
    PositionManager positionManager;

    address deployer = makeAddr("deployer");
    address trader = makeAddr("trader");
    address arciumVerifier = makeAddr("arciumVerifier");
    address weth = makeAddr("weth");

    uint256 constant INITIAL_USDC = 100_000e6;

    function setUp() public {
        vm.startPrank(deployer);

        usdc = new MockUSDC();
        vault = new Vault(address(usdc));
        fundingRate = new FundingRate();

        PriceOracle oracle = new PriceOracle();

        positionManager = new PositionManager(
            address(vault),
            address(oracle),
            address(fundingRate),
            arciumVerifier
        );

        vault.setPositionManager(address(positionManager));
        fundingRate.setPositionManager(address(positionManager));
        positionManager.createMarket(weth, 50 * 1e4, 50);
        usdc.mint(trader, INITIAL_USDC);

        vm.stopPrank();
    }

    function test_deposit_and_withdraw() public {
        uint256 amount = 1000e6;

        vm.startPrank(trader);
        usdc.approve(address(vault), amount);
        vault.deposit(amount);

        assertEq(vault.balances(trader), amount);
        assertEq(vault.freeBalance(trader), amount);

        vault.withdraw(amount);
        assertEq(vault.balances(trader), 0);
        vm.stopPrank();
    }

    function test_open_position_with_arcium_proof() public {
        uint256 collateral = 1000e6;

        vm.startPrank(trader);
        usdc.approve(address(vault), collateral);
        vault.deposit(collateral);

        bytes32 marketId = keccak256(abi.encodePacked(weth, block.chainid));
        bytes32 commitmentHash = keccak256(abi.encodePacked("encrypted_position_data"));
        bytes memory proof = abi.encodePacked(bytes32(uint256(0xDEADBEEF)));

        bytes32 positionId = positionManager.openPosition(
            marketId,
            collateral,
            commitmentHash,
            proof
        );

        IPrivatePerps.PositionCommitment memory pos = positionManager.getPosition(positionId);
        assertEq(pos.commitmentHash, commitmentHash);
        assertEq(uint8(pos.status), uint8(IPrivatePerps.PositionStatus.OPEN));
        assertTrue(pos.collateral > 0);
        assertGt(vault.lockedBalances(trader), 0);

        vm.stopPrank();
    }

    function test_close_position_reveals_only_pnl() public {
        uint256 collateral = 1000e6;

        vm.startPrank(trader);
        usdc.approve(address(vault), collateral);
        vault.deposit(collateral);

        bytes32 marketId = keccak256(abi.encodePacked(weth, block.chainid));
        bytes memory openProof = abi.encodePacked(bytes32(uint256(1)));
        bytes32 positionId = positionManager.openPosition(
            marketId, collateral, keccak256("position_data"), openProof
        );
        vm.stopPrank();

        vm.startPrank(arciumVerifier);
        int256 pnl = 50e6;
        bytes memory closeProof = abi.encodePacked(bytes32(uint256(2)));
        positionManager.closePosition(positionId, pnl, closeProof);

        IPrivatePerps.PositionCommitment memory pos = positionManager.getPosition(positionId);
        assertEq(uint8(pos.status), uint8(IPrivatePerps.PositionStatus.CLOSED));
        assertEq(pos.revealedPnl, pnl);
        vm.stopPrank();
    }

    function test_cannot_withdraw_locked_collateral() public {
        uint256 collateral = 1000e6;

        vm.startPrank(trader);
        usdc.approve(address(vault), collateral);
        vault.deposit(collateral);

        bytes32 marketId = keccak256(abi.encodePacked(weth, block.chainid));
        bytes memory proof = abi.encodePacked(bytes32(uint256(1)));
        positionManager.openPosition(marketId, collateral, keccak256("pos"), proof);

        vm.expectRevert("Vault: insufficient free balance");
        vault.withdraw(collateral);
        vm.stopPrank();
    }

    function test_faucet_cooldown() public {
        vm.startPrank(trader);
        usdc.faucet();
        assertEq(usdc.balanceOf(trader), INITIAL_USDC + 10_000e6);

        vm.expectRevert("MockUSDC: Faucet cooldown not elapsed");
        usdc.faucet();

        vm.warp(block.timestamp + 25 hours);
        usdc.faucet();
        vm.stopPrank();
    }
}
