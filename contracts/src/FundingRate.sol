// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FundingRate
/// @notice Computes and applies 8-hour funding rates between longs and shorts.
contract FundingRate is Ownable {
    uint256 public constant FUNDING_INTERVAL = 8 hours;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_FUNDING_RATE = 1e15;

    struct MarketFunding {
        int256 cumulativeFundingLong;
        int256 cumulativeFundingShort;
        uint256 lastFundingTime;
        uint256 openInterestLong;
        uint256 openInterestShort;
    }

    mapping(bytes32 => MarketFunding) public markets;
    address public positionManager;

    event FundingUpdated(
        bytes32 indexed marketId,
        int256 fundingRate,
        int256 cumulativeLong,
        int256 cumulativeShort
    );

    modifier onlyPositionManager() {
        require(msg.sender == positionManager, "FundingRate: not PositionManager");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setPositionManager(address _pm) external onlyOwner {
        positionManager = _pm;
    }

    function updateFunding(bytes32 marketId) external onlyPositionManager {
        MarketFunding storage mf = markets[marketId];

        if (mf.lastFundingTime == 0) {
            mf.lastFundingTime = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - mf.lastFundingTime;
        if (elapsed < FUNDING_INTERVAL) return;

        uint256 intervals = elapsed / FUNDING_INTERVAL;
        int256 fundingRate = _computeFundingRate(mf.openInterestLong, mf.openInterestShort);

        mf.cumulativeFundingLong += fundingRate * int256(intervals);
        mf.cumulativeFundingShort -= fundingRate * int256(intervals);
        mf.lastFundingTime = block.timestamp;

        emit FundingUpdated(marketId, fundingRate, mf.cumulativeFundingLong, mf.cumulativeFundingShort);
    }

    function updateOpenInterest(
        bytes32 marketId,
        uint256 oiLong,
        uint256 oiShort
    ) external onlyPositionManager {
        markets[marketId].openInterestLong = oiLong;
        markets[marketId].openInterestShort = oiShort;
    }

    function getCurrentFundingRate(bytes32 marketId) external view returns (int256) {
        MarketFunding storage mf = markets[marketId];
        return _computeFundingRate(mf.openInterestLong, mf.openInterestShort);
    }

    function getCumulativeFunding(bytes32 marketId)
        external
        view
        returns (int256 long, int256 short)
    {
        MarketFunding storage mf = markets[marketId];
        return (mf.cumulativeFundingLong, mf.cumulativeFundingShort);
    }

    function _computeFundingRate(uint256 oiLong, uint256 oiShort)
        internal
        pure
        returns (int256)
    {
        uint256 totalOI = oiLong + oiShort;
        if (totalOI == 0) return 0;

        int256 skew = (int256(oiLong) - int256(oiShort)) * int256(PRECISION) / int256(totalOI);
        int256 rate = skew * int256(MAX_FUNDING_RATE) / int256(PRECISION);

        if (rate > int256(MAX_FUNDING_RATE)) return int256(MAX_FUNDING_RATE);
        if (rate < -int256(MAX_FUNDING_RATE)) return -int256(MAX_FUNDING_RATE);
        return rate;
    }
}
