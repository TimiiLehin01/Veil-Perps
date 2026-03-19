import { keccak256, encodePacked } from "viem";

export interface PositionData {
  size: bigint; // Position size in USDC (1e6)
  side: "LONG" | "SHORT";
  leverage: number; // e.g. 10 = 10x
  entryPrice: bigint; // Price in 1e18 (from oracle)
  marketId: `0x${string}`;
}

export interface ArciumProof {
  proof: `0x${string}`;
  computationId: string;
  publicInputHash: `0x${string}`;
}

/// Generate a commitment hash for a position
/// This hash is stored on-chain. The actual position data goes to Arcium MXE.
export function generateCommitmentHash(
  position: PositionData,
  trader: `0x${string}`,
  salt: `0x${string}`,
): `0x${string}` {
  return keccak256(
    encodePacked(
      [
        "uint256",
        "uint8",
        "uint256",
        "uint256",
        "bytes32",
        "address",
        "bytes32",
      ],
      [
        position.size,
        position.side === "LONG" ? 0 : 1,
        BigInt(position.leverage),
        position.entryPrice,
        position.marketId,
        trader,
        salt,
      ],
    ),
  );
}

/// Generate a random salt for commitment
export function generateSalt(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

/// Submit position data to Arcium MXE for encrypted storage
/// Returns a proof that the position is valid and within market limits
export async function submitToArciumMXE(
  position: PositionData,
  commitmentHash: `0x${string}`,
  trader: `0x${string}`,
): Promise<ArciumProof> {
  // TODO: Replace with real Arcium MXE client SDK call
  // const arciumClient = new ArciumClient({ cluster: ARCIUM_CLUSTER_URL })
  // const result = await arciumClient.submitComputation({
  //   programId: ARCIUM_PROGRAM_ID,
  //   inputs: encryptPositionData(position),
  //   commitment: commitmentHash,
  // })
  // return result.proof

  // Testnet placeholder: generate deterministic mock proof
  const mockProof = keccak256(
    encodePacked(
      ["bytes32", "address", "uint256"],
      [commitmentHash, trader, BigInt(Date.now())],
    ),
  );

  return {
    proof: mockProof,
    computationId: `arcium-${Date.now()}`,
    publicInputHash: commitmentHash,
  };
}

/// Request PnL computation from Arcium MXE
/// Arcium computes profit/loss from encrypted position data + current oracle price
/// Returns proof + revealed PnL (only the number, not position details)
export async function requestArciumPnLComputation(
  positionId: `0x${string}`,
  currentPrice: bigint,
): Promise<{ pnl: bigint; proof: `0x${string}` }> {
  // TODO: Real Arcium MXE call
  // const result = await arciumClient.computePnL({ positionId, currentPrice })

  // Mock: return 0 PnL for testnet
  const mockProof = keccak256(
    encodePacked(["bytes32", "uint256"], [positionId, currentPrice]),
  );

  return {
    pnl: 0n,
    proof: mockProof,
  };
}

/// Check if a position is liquidatable via Arcium
/// Returns proof that health factor < 1 WITHOUT revealing position details
export async function checkLiquidatable(
  positionId: `0x${string}`,
  trader: `0x${string}`,
  currentPrice: bigint,
): Promise<{ isLiquidatable: boolean; proof: `0x${string}` | null }> {
  // TODO: Real Arcium MXE liquidation check
  // Privacy guarantee: Arcium computes health factor inside MXE
  // The liquidator learns ONLY whether position is liquidatable — not size or entry

  return {
    isLiquidatable: false,
    proof: null,
  };
}

/// Encrypt position data for Arcium MXE (client-side encryption)
export function encryptPositionData(
  position: PositionData,
  arciumPublicKey: string,
): string {
  // TODO: Use Arcium's encryption scheme (NaCl/Chacha20-Poly1305 with MXE public key)
  // For now, base64 encode as placeholder
  const data = JSON.stringify({
    size: position.size.toString(),
    side: position.side,
    leverage: position.leverage,
    entryPrice: position.entryPrice.toString(),
  });
  return btoa(data);
}
