// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IPrivatePerps {
    enum Side { LONG, SHORT }
    enum PositionStatus { OPEN, CLOSED, LIQUIDATED }

    struct Market {
        address token;
        uint256 maxLeverage;
        uint256 maintenanceMargin;
        uint256 openInterestLong;
        uint256 openInterestShort;
        bool isActive;
    }

    struct PositionCommitment {
        bytes32 commitmentHash;
        bytes arciumProof;
        uint256 collateral;
        uint256 openedAt;
        PositionStatus status;
        int256 revealedPnl;
    }

    event PositionOpened(
        address indexed trader,
        bytes32 indexed positionId,
        bytes32 commitmentHash,
        uint256 collateral,
        uint256 timestamp
    );

    event PositionClosed(
        address indexed trader,
        bytes32 indexed positionId,
        int256 pnl,
        uint256 timestamp
    );

    event PositionLiquidated(
        address indexed trader,
        bytes32 indexed positionId,
        address indexed liquidator,
        uint256 timestamp
    );

    event ArciumProofVerified(
        bytes32 indexed positionId,
        bytes32 computationHash
    );
}
