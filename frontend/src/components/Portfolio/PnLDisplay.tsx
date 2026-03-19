import { Lock } from 'lucide-react'
import { useTradingStore, selectOpenPositions, selectClosedPositions } from '@/store/tradingStore'
import { formatPnl, formatUSDC } from '@/lib/formatters'

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

export function PnLDisplay() {
  const openPositions = useTradingStore(selectOpenPositions)
  const closedPositions = useTradingStore(selectClosedPositions)
  const selectedMarket = useTradingStore((s) => s.selectedMarket)
  const currentPrice = selectedMarket?.price ?? 0

  const realizedPnl = closedPositions.reduce(
    (acc, p) => acc + (p.revealedPnl ?? 0n), 0n
  )

  const revealedPositions = openPositions.filter(p => p.revealedPnl !== null)
  const hasUnrevealed = openPositions.some(p => p.revealedPnl === null)

  // Use live price-based PnL for revealed positions
  const unrealizedPnl = revealedPositions.reduce((acc, p) => {
    if (!p.privateData) return acc
    return acc + calcLivePnl(p.privateData, currentPrice)
  }, 0n)

  const totalCollateral = openPositions.reduce((acc, p) => acc + p.collateral, 0n)

  return (
    <div className="grid grid-cols-3 gap-2 p-3 md:p-4">
      <div className="panel p-3 space-y-1">
        <p className="text-[10px] text-dim font-display uppercase tracking-wider">Realized PnL</p>
        <p className={`text-sm md:text-lg font-mono font-600 ${realizedPnl >= 0n ? 'text-positive' : 'text-negative'}`}>
          {formatPnl(realizedPnl)}
        </p>
        <p className="text-[10px] text-subtle font-mono">{closedPositions.length} closed</p>
      </div>

      <div className="panel p-3 space-y-1">
        <p className="text-[10px] text-dim font-display uppercase tracking-wider flex items-center gap-1">
          <Lock size={9} className="text-arcium-400" />
          Unrealized PnL
        </p>
        {revealedPositions.length > 0 ? (
          <>
            <p className={`text-sm md:text-lg font-mono font-600 ${unrealizedPnl >= 0n ? 'text-positive' : 'text-negative'}`}>
              {formatPnl(unrealizedPnl)}
              {hasUnrevealed && <span className="text-xs text-dim ml-1">+?</span>}
            </p>
            <p className="text-[10px] text-subtle font-mono">
              {revealedPositions.length} revealed{hasUnrevealed ? ', some encrypted' : ''}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm md:text-lg font-mono font-600 text-arcium-400 flex items-center gap-1.5">
              <Lock size={12} />
              Encrypted
            </p>
            <p className="text-[10px] text-subtle font-mono">Click Reveal PnL</p>
          </>
        )}
      </div>

      <div className="panel p-3 space-y-1">
        <p className="text-[10px] text-dim font-display uppercase tracking-wider">Open Collateral</p>
        <p className="text-sm md:text-lg font-mono font-600 text-ivory">${formatUSDC(totalCollateral)}</p>
        <p className="text-[10px] text-subtle font-mono">
          {openPositions.length} position{openPositions.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
