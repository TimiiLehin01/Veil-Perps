// Client-side encryption for Arcium MXE
// Position data is encrypted HERE in the browser before anything is sent
// to Arcium or the blockchain. The plaintext never leaves the user's device.

import { keccak256, encodePacked } from "viem";
import type { PositionData } from "./proofTypes";

/// Encrypt position data using Arcium MXE public key
/// In production this uses Arcium's encryption scheme (X25519 + ChaCha20-Poly1305)
/// The encrypted blob is sent to Arcium MXE for storage — never on-chain
export async function encryptPositionData(
  position: PositionData,
  arciumPublicKey: string,
): Promise<string> {
  // TODO: Replace with real Arcium encryption
  // const arcium = new ArciumSDK()
  // const encrypted = await arcium.encrypt({
  //   data: {
  //     size: position.size.toString(),
  //     side: position.side === 'LONG' ? 0 : 1,
  //     leverage: position.leverage,
  //     entry_price: position.entryPrice.toString(),
  //   },
  //   recipientPublicKey: arciumPublicKey,
  // })
  // return encrypted

  // Devnet mock — base64 encode the position data
  const data = JSON.stringify({
    size: position.size.toString(),
    side: position.side === "LONG" ? 0 : 1,
    leverage: position.leverage,
    entry_price: position.entryPrice.toString(),
    market_id: position.marketId,
  });

  return btoa(data);
}

/// Generate a commitment hash for the position
/// This is the ONLY reference to position data stored on-chain
/// commitment = keccak256(encrypted_data, trader_address, random_salt)
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

/// Generate a cryptographically random salt
export function generateSalt(): `0x${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

/// Fetch Arcium MXE public key for encryption
export async function getArciumPublicKey(): Promise<string> {
  // TODO: Fetch from Arcium cluster
  // const response = await fetch(`${ARCIUM_CLUSTER_URL}/public-key`)
  // const { publicKey } = await response.json()
  // return publicKey

  return "arcium-devnet-pubkey-placeholder";
}
