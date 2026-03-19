// Arcium proof types and interfaces

export interface PositionData {
  size: bigint;
  side: "LONG" | "SHORT";
  leverage: number;
  entryPrice: bigint;
  marketId: `0x${string}`;
}

export interface ArciumProof {
  /// The actual proof bytes — submitted on-chain for verification
  proof: `0x${string}`;
  /// Arcium computation ID — used to look up computation in MXE
  computationId: string;
  /// Hash of public inputs — used for on-chain verification
  publicInputHash: `0x${string}`;
}

export interface ArciumComputationResult<T> {
  /// Public outputs from the MXE computation
  outputs: T;
  /// Proof of correct computation
  proof: `0x${string}`;
  /// Computation ID
  computationId: string;
}

export interface PositionOpenOutputs {
  isValid: boolean;
  commitmentHash: `0x${string}`;
  computationId: string;
}

export interface PnLComputeOutputs {
  /// Signed PnL in USDC (1e6). This is the ONLY position detail revealed.
  pnl: bigint;
  positionId: `0x${string}`;
  computationId: string;
}

export interface LiquidationCheckOutputs {
  /// Whether the position should be liquidated.
  /// This is ALL the liquidator learns — not why, not the health factor.
  isLiquidatable: boolean;
  positionId: `0x${string}`;
  computationId: string;
}

export type ArciumStatus =
  | "idle"
  | "encrypting"
  | "proving"
  | "ready"
  | "error";
