// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPriceOracle {
    function getPrice(address token) external view returns (uint256 price, uint256 timestamp);
    function getPriceUSD(address token) external view returns (uint256);
    function isStale(address token) external view returns (bool);
}
