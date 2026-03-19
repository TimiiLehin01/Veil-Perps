
import { keccak256, encodePacked, padHex } from 'viem'

export interface PositionData {

  size: bigint

  side: 'LONG' | 'SHORT'

  leverage: number

  entryPrice: bigint

  marketId: `0x${string}`

}

export interface ArciumProof {

  proof: `0x${string}`

  computationId: string

  publicInputHash: `0x${string}`

}

export function generateCommitmentHash(

  position: PositionData,

  trader: `0x${string}`,

  salt: `0x${string}`

): `0x${string}` {

  const marketId32 = padHex(position.marketId, { size: 32 })

  return keccak256(

    encodePacked(

      ['uint256', 'uint8', 'uint256', 'uint256', 'bytes32', 'address', 'bytes32'],

      [

        position.size,

        position.side === 'LONG' ? 0 : 1,

        BigInt(position.leverage),

        position.entryPrice,

        marketId32,

        trader,

        salt,

      ]

    )

  )

}

export function generateSalt(): `0x${string}` {

  const bytes = crypto.getRandomValues(new Uint8Array(32))

  return `0x${Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`

}

export async function submitToArciumMXE(

  position: PositionData,

  commitmentHash: `0x${string}`,

  trader: `0x${string}`

): Promise<ArciumProof> {

  await new Promise((resolve) => setTimeout(resolve, 1200))

  const proof = keccak256(

    encodePacked(

      ['bytes32', 'address', 'uint256', 'uint256'],

      [commitmentHash, trader, position.size, position.entryPrice]

    )

  )

  return {

    proof,

    computationId: `arcium-${Date.now()}`,

    publicInputHash: commitmentHash,

  }

}

export async function requestArciumPnLComputation(

  positionId: `0x${string}`,

  currentPrice: bigint

): Promise<{ pnl: bigint; proof: `0x${string}` }> {

  await new Promise((resolve) => setTimeout(resolve, 1000))

  const proof = keccak256(encodePacked(['bytes32', 'uint256'], [positionId, currentPrice]))

  return { pnl: 0n, proof }

}

export async function checkLiquidatable(

  positionId: `0x${string}`,

  trader: `0x${string}`,

  currentPrice: bigint

): Promise<{ isLiquidatable: boolean; proof: `0x${string}` | null }> {

  await new Promise((resolve) => setTimeout(resolve, 600))

  return { isLiquidatable: false, proof: null }

}

export function encryptPositionData(position: PositionData, arciumPublicKey: string): string {

  const data = JSON.stringify({

    size: position.size.toString(),

    side: position.side === 'LONG' ? 0 : 1,

    leverage: position.leverage,

    entry_price: position.entryPrice.toString(),

  })

  return btoa(data)

}

