// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MockUSDC.sol";
import "../src/PriceOracle.sol";
import "../src/Vault.sol";
import "../src/FundingRate.sol";
import "../src/PositionManager.sol";
import "../src/LiquidationEngine.sol";

contract DeployTestnet is Script {
    address constant ETH_USD_FEED = 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1;
    address constant WETH = 0x4200000000000000000000000000000000000006;
    address constant ARCIUM_VERIFIER = 0x0000000000000000000000000000000000000001;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        console.log("=== VEIL Perps Testnet Deployment ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerKey);

        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        PriceOracle priceOracle = new PriceOracle();
        priceOracle.setPriceFeed(WETH, ETH_USD_FEED, "ETH");
        console.log("PriceOracle:", address(priceOracle));

        Vault vault = new Vault(address(usdc));
        console.log("Vault:", address(vault));

        FundingRate fundingRate = new FundingRate();
        console.log("FundingRate:", address(fundingRate));

        PositionManager positionManager = new PositionManager(
            address(vault),
            address(priceOracle),
            address(fundingRate),
            ARCIUM_VERIFIER
        );
        console.log("PositionManager:", address(positionManager));

        LiquidationEngine liquidationEngine = new LiquidationEngine(
            address(positionManager),
            address(priceOracle)
        );
        console.log("LiquidationEngine:", address(liquidationEngine));

        vault.setPositionManager(address(positionManager));
        fundingRate.setPositionManager(address(positionManager));

        bytes32 ethMarketId = positionManager.createMarket(WETH, 50 * 1e4, 50);
        console.log("ETH Market created");

        liquidationEngine.approveLiquidator(deployer);

        vm.stopBroadcast();

        console.log("\n=== Copy these to your frontend .env ===");
        console.log("VITE_MOCK_USDC_ADDRESS=", address(usdc));
        console.log("VITE_VAULT_ADDRESS=", address(vault));
        console.log("VITE_POSITION_MANAGER_ADDRESS=", address(positionManager));
        console.log("VITE_PRICE_ORACLE_ADDRESS=", address(priceOracle));
        console.log("VITE_LIQUIDATION_ENGINE_ADDRESS=", address(liquidationEngine));
    }
}
