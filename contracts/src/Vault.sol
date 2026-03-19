// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Vault
/// @notice Holds trader collateral (USDC). Only PositionManager can lock/unlock/slash.
contract Vault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public positionManager;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public lockedBalances;

    event Deposited(address indexed trader, uint256 amount);
    event Withdrawn(address indexed trader, uint256 amount);
    event CollateralLocked(address indexed trader, uint256 amount);
    event CollateralUnlocked(address indexed trader, uint256 amount, int256 pnl);
    event CollateralSlashed(address indexed trader, uint256 amount, address liquidator);
    event PositionManagerSet(address indexed manager);

    modifier onlyPositionManager() {
        require(msg.sender == positionManager, "Vault: caller not PositionManager");
        _;
    }

    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "Vault: zero USDC address");
        usdc = IERC20(_usdc);
    }

    function setPositionManager(address _positionManager) external onlyOwner {
        require(_positionManager != address(0), "Vault: zero address");
        positionManager = _positionManager;
        emit PositionManagerSet(_positionManager);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Vault: zero deposit");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        balances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        uint256 free = freeBalance(msg.sender);
        require(amount <= free, "Vault: insufficient free balance");
        balances[msg.sender] -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function lockCollateral(address trader, uint256 amount) external onlyPositionManager {
        require(freeBalance(trader) >= amount, "Vault: insufficient free balance");
        lockedBalances[trader] += amount;
        emit CollateralLocked(trader, amount);
    }

    function unlockCollateral(address trader, uint256 lockedAmount, int256 pnl)
        external
        onlyPositionManager
    {
        require(lockedBalances[trader] >= lockedAmount, "Vault: unlock exceeds locked");
        lockedBalances[trader] -= lockedAmount;

        if (pnl >= 0) {
            balances[trader] += lockedAmount + uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            if (loss >= lockedAmount) {
                balances[trader] -= lockedAmount;
            } else {
                balances[trader] -= loss;
                balances[trader] += (lockedAmount - loss);
            }
        }

        emit CollateralUnlocked(trader, lockedAmount, pnl);
    }

    function slashCollateral(
        address trader,
        uint256 amount,
        address liquidator,
        uint256 liquidatorFee
    ) external onlyPositionManager {
        require(lockedBalances[trader] >= amount, "Vault: insufficient locked");
        lockedBalances[trader] -= amount;
        balances[trader] = balances[trader] > amount ? balances[trader] - amount : 0;

        if (liquidatorFee > 0 && liquidator != address(0)) {
            usdc.safeTransfer(liquidator, liquidatorFee);
        }

        emit CollateralSlashed(trader, amount, liquidator);
    }

    function freeBalance(address trader) public view returns (uint256) {
        return balances[trader] > lockedBalances[trader]
            ? balances[trader] - lockedBalances[trader]
            : 0;
    }

    function totalBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
