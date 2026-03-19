// Contract addresses — update after deployment
export const CONTRACTS = {
  baseSepolia: {
    mockUSDC: (import.meta.env.VITE_MOCK_USDC_ADDRESS ||
      "0x0000000000000000000000000000000000000001") as `0x${string}`,
    vault: (import.meta.env.VITE_VAULT_ADDRESS ||
      "0x0000000000000000000000000000000000000002") as `0x${string}`,
    positionManager: (import.meta.env.VITE_POSITION_MANAGER_ADDRESS ||
      "0x0000000000000000000000000000000000000003") as `0x${string}`,
    priceOracle: (import.meta.env.VITE_PRICE_ORACLE_ADDRESS ||
      "0x0000000000000000000000000000000000000004") as `0x${string}`,
    liquidationEngine: (import.meta.env.VITE_LIQUIDATION_ENGINE_ADDRESS ||
      "0x0000000000000000000000000000000000000005") as `0x${string}`,
  },
};

export const VAULT_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "balances",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "trader", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "lockedBalances",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "trader", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "freeBalance",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "trader", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export const MOCK_USDC_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "faucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

export const POSITION_MANAGER_ABI = [
  {
    name: "openPosition",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "marketId", type: "bytes32" },
      { name: "collateral", type: "uint256" },
      { name: "commitmentHash", type: "bytes32" },
      { name: "arciumProof", type: "bytes" },
    ],
    outputs: [{ name: "positionId", type: "bytes32" }],
  },
  {
    name: "closePosition",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "positionId", type: "bytes32" },
      { name: "revealedPnl", type: "int256" },
      { name: "arciumProof", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "getPosition",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "positionId", type: "bytes32" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "commitmentHash", type: "bytes32" },
          { name: "arciumProof", type: "bytes" },
          { name: "collateral", type: "uint256" },
          { name: "openedAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "revealedPnl", type: "int256" },
        ],
      },
    ],
  },
  {
    name: "getTraderPositions",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "trader", type: "address" }],
    outputs: [{ type: "bytes32[]" }],
  },
  {
    name: "getAllMarketIds",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bytes32[]" }],
  },
  {
    name: "PositionOpened",
    type: "event",
    inputs: [
      { name: "trader", type: "address", indexed: true },
      { name: "positionId", type: "bytes32", indexed: true },
      { name: "commitmentHash", type: "bytes32", indexed: false },
      { name: "collateral", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    name: "PositionClosed",
    type: "event",
    inputs: [
      { name: "trader", type: "address", indexed: true },
      { name: "positionId", type: "bytes32", indexed: true },
      { name: "pnl", type: "int256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
