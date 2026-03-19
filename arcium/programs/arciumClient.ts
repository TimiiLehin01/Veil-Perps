// Arcium MXE Client
// Handles all communication between the frontend and Arcium's
// Multi-party Execution Environment (MXE).

import { keccak256, encodePacked } from "viem";
import type { PositionData, ArciumProof } from "./proofTypes";

const ARCIUM_CLUSTER_URL =
  import.meta.env.VITE_ARCIUM_CLUSTER_URL || "https://devnet.arcium.com";
const ARCIUM_PROGRAM_ID = import.meta.env.VITE_ARCIUM_PROGRAM_ID || "";

export class ArciumClient {
  private clusterUrl: string;
  private programId: string;

  constructor(clusterUrl = ARCIUM_CLUSTER_URL, programId = ARCIUM_PROGRAM_ID) {
    this.clusterUrl = clusterUrl;
    this.programId = programId;
  }

  /// Submit encrypted position data to Arcium MXE for validation.
  /// Returns a proof that the position parameters are within market limits.
  async submitPositionOpen(
    encryptedData: string,
    commitmentHash: `0x${string}`,
    collateral: bigint,
    trader: `0x${string}`,
  ): Promise<ArciumProof> {
    // TODO: Replace with real Arcium SDK call when mainnet launches
    // const arcium = new ArciumSDK({ cluster: this.clusterUrl })
    // const result = await arcium.submitComputation({
    //   programId: 'position_open',
    //   inputs: {
    //     encrypted_data: encryptedData,
    //     commitment_hash: commitmentHash,
    //     collateral: collateral.toString(),
    //     trader,
    //   }
    // })
    // return {
    //   proof: result.proof,
    //   computationId: result.computationId,
    //   publicInputHash: result.publicInputHash,
    // }

    // Devnet mock — generates deterministic proof from inputs
    await this._simulateDelay(800);
    const proof = keccak256(
      encodePacked(
        ["bytes32", "address", "uint256"],
        [commitmentHash, trader, collateral],
      ),
    );

    return {
      proof,
      computationId: `arcium-open-${Date.now()}`,
      publicInputHash: commitmentHash,
    };
  }

  /// Request PnL computation from Arcium MXE.
  /// Arcium decrypts the position inside MXE, computes PnL against current price,
  /// and returns ONLY the PnL number + proof. Position details never leave MXE.
  async computePnL(
    positionId: `0x${string}`,
    currentPrice: bigint,
  ): Promise<{ pnl: bigint; proof: `0x${string}` }> {
    // TODO: Real Arcium SDK call
    // const result = await arcium.submitComputation({
    //   programId: 'pnl_compute',
    //   inputs: { position_id: positionId, current_price: currentPrice.toString() }
    // })
    // return { pnl: BigInt(result.outputs.pnl), proof: result.proof }

    await this._simulateDelay(1000);
    const proof = keccak256(
      encodePacked(["bytes32", "uint256"], [positionId, currentPrice]),
    );

    return { pnl: 0n, proof };
  }

  /// Check if a position is liquidatable via private health factor computation.
  /// Returns ONLY whether liquidatable + proof — not why, not the health factor.
  async checkLiquidatable(
    positionId: `0x${string}`,
    currentPrice: bigint,
  ): Promise<{ isLiquidatable: boolean; proof: `0x${string}` | null }> {
    // TODO: Real Arcium SDK call
    // const result = await arcium.submitComputation({
    //   programId: 'liquidation_check',
    //   inputs: { position_id: positionId, current_price: currentPrice.toString() }
    // })
    // return {
    //   isLiquidatable: result.outputs.is_liquidatable,
    //   proof: result.proof,
    // }

    await this._simulateDelay(600);
    return { isLiquidatable: false, proof: null };
  }

  private _simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const arciumClient = new ArciumClient();
