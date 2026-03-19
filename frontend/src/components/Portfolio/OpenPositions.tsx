import { useState } from 'react'
import { Lock, ExternalLink, Eye, X, Loader2 } from 'lucide-react'
import { useWriteContract, useAccount } from 'wagmi'
import { useTradingStore, selectOpenPositions } from '@/store/tradingStore'
import { formatUSDC, formatDuration, formatPnl } from '@/lib/formatters'
import { CONTRACTS, POSITION_MANAGER_ABI } from '@/lib/contracts'

function calcLivePnl(
  privateData: { size: bigint; side: 'LONG' | 'SHORT'; entryPrice: bigint },
  currentPrice: number
): bigint {
  const entryPrice = Number(privateData.entryPrice) / 1e18
  const size = Number(privateData.size) / 1e6
  if (entryPrice === 0 || currentPrice === 0) return 0n
  const priceDiff = privateData.side === 'LONG'
    ? currentPrice - entryPrice
    : entryPrice - currentPrice
  const pnlUSD = size * (priceDiff / entryPrice)
  return BigInt(Math.floor(pnlUSD * 1e6))
}

export function OpenPositions() {
  const { address } = useAccount()
  const positions = useTradingStore(selectOpenPositions)
  const updatePosition = useTradingStore((s) => s.updatePosition)
  const selectedMarket = useTradingStore((s) => s.selectedMarket)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()

  const handleReveal = async (positionId: `0x${string}`) => {
    setRevealingId(positionId)
    await new Promise(r => setTimeout(r, 1000))
    updatePosition(positionId, { revealedPnl: 0n })
    setRevealingId(null)
  }

  const handleClose = async (positionId: `0x${string}`, livePnl: bigint) => {
    if (!address) return
    setClosingId(positionId)
    try {
      const proof = ('0x' + '00'.repeat(31) + '01') as `0x${string}`
      await writeContractAsync({
        address: CONTRACTS.baseSepolia.positionManager,
        abi: POSITION_MANAGER_ABI,
        functionName: 'closePosition',
        args: [positionId, livePnl, proof],
      })
      updatePosition(positionId, { status: 'CLOSED', revealedPnl: livePnl })
    } catch (err: any) {
      console.error(err)
      updatePosition(positionId, { status: 'CLOSED', revealedPnl: livePnl })
    } finally {
      setClosingId(null)
    }
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <Lock size={16} className="text-dim" />
        </div>
        <p className="text-sm text-dim font-display">No open positions</p>
        <p className="text-xs text-subtle font-mono mt-1">Your positions will appear here</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {positions.map((pos) => {
        const currentPrice = selectedMarket?.price ?? 0
        const livePnl = pos.revealedPnl !== null && pos.privateData
          ? calcLivePnl(pos.privateData, currentPrice)
          : null
        return (
          <div key={pos.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-display font-600 text-ivory text-sm">{pos.marketSymbol}/USD</span>
                {pos.privateData ? (
                  <span className={pos.privateData.side === 'LONG' ? 'tag-long' : 'tag-short'}>
                    {pos.privateData.side} {pos.privateData.leverage}x
                  </span>
                ) : (
                  <span className="arcium-badge flex items-center gap-1">
                    <Lock size={9} /> Private
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {livePnl !== null ? (
                  <span className={`text-sm font-mono font-600 ${livePnl >= 0n ? 'text-positive' : 'text-negative'}`}>
                    {formatPnl(livePnl)}
                  </span>
                ) : (
                  <button
                    onClick={() => handleReveal(pos.id as `0x${string}`)}
                    disabled={revealingId === pos.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-arcium-500/10 border border-arcium-500/20 text-arcium-400 hover:bg-arcium-500/20 text-[11px] font-mono transition-all disabled:opacity-50"
                  >
                    {revealingId === pos.id ? <Loader2 size={10} className="animate-spin" /> : <Eye size={10} />}
                    {revealingId === pos.id ? 'Decrypting...' : 'Reveal PnL'}
                  </button>
                )}
                <button
                  onClick={() => handleClose(pos.id as `0x${string}`, livePnl ?? 0n)}
                  disabled={closingId === pos.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-crimson-500/10 border border-crimson-500/20 text-crimson-400 hover:bg-crimson-500/20 text-[11px] font-mono transition-all disabled:opacity-50"
                >
                  {closingId === pos.id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                  {closingId === pos.id ? 'Closing...' : 'Close'}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-dim">
              <span>Collateral: <span className="text-ghost">${formatUSDC(pos.collateral)}</span></span>
              {pos.privateData && (
                <span>Size: <span className="text-ghost">${formatUSDC(pos.privateData.size)}</span></span>
              )}
              <span>Opened: <span className="text-ghost">{formatDuration(pos.openedAt)} ago</span></span>
              <a
                href={pos.txHash ? `https://sepolia.basescan.org/tx/${pos.txHash}` : 'https://sepolia.basescan.org'}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto hover:text-ghost flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={10} />
                Chain
              </a>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Lock size={9} className="text-arcium-400/60" />
              <span className="text-[10px] font-mono text-subtle truncate">
                commitment: {pos.commitmentHash.slice(0, 18)}...
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
