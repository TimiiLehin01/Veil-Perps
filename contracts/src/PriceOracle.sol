// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/// @title PriceOracle
/// @notice Wraps Chainlink price feeds for Base network
/// @dev Base Sepolia Chainlink feeds:
///      ETH/USD: 0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
///      BTC/USD: 0x0FB99723Aee6f420beAD13e6bBB79b7E6F034298
contract PriceOracle is IPriceOracle, Ownable {
    uint256 public constant STALENESS_THRESHOLD = 1 hours;

    mapping(address => address) public priceFeeds;
    mapping(address => string) public tokenSymbols;

    event PriceFeedSet(address indexed token, address indexed feed, string symbol);

    constructor() Ownable(msg.sender) {}

    function setPriceFeed(
        address token,
        address feed,
        string calldata symbol
    ) external onlyOwner {
        require(token != address(0), "PriceOracle: zero token");
        require(feed != address(0), "PriceOracle: zero feed");
        priceFeeds[token] = feed;
        tokenSymbols[token] = symbol;
        emit PriceFeedSet(token, feed, symbol);
    }

    function getPrice(address token)
        external
        view
        override
        returns (uint256 price, uint256 timestamp)
    {
        address feed = priceFeeds[token];
        require(feed != address(0), "PriceOracle: no feed for token");

        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = AggregatorV3Interface(feed).latestRoundData();

        require(answer > 0, "PriceOracle: invalid price");
        require(answeredInRound >= roundId, "PriceOracle: stale round");
        require(updatedAt > 0, "PriceOracle: round not complete");

        price = uint256(answer);
        timestamp = updatedAt;
    }

    function getPriceUSD(address token) external view override returns (uint256) {
        (uint256 price, uint256 updatedAt) = this.getPrice(token);
        require(
            block.timestamp - updatedAt <= STALENESS_THRESHOLD,
            "PriceOracle: price stale"
        );
        return price * 1e10;
    }

    function isStale(address token) external view override returns (bool) {
        address feed = priceFeeds[token];
        if (feed == address(0)) return true;
        (, , , uint256 updatedAt, ) = AggregatorV3Interface(feed).latestRoundData();
        return block.timestamp - updatedAt > STALENESS_THRESHOLD;
    }
}
