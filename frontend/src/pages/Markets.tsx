import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Lock } from 'lucide-react'
import { useTradingStore } from '@/store/tradingStore'
import { useMarketTickers } from '@/hooks/usePriceData'
import { formatPrice } from '@/lib/formatters'

export const ALL_MARKETS = [
  { symbol: 'ETH', name: 'Ethereum', id: '0xe9eaba687f937ecb0e54f954f2ae4b5a2922be59b6ac3218d62a6f29998155d6' as `0x${string}`, token: '0x4200000000000000000000000000000000000006' as `0x${string}` },
  { symbol: 'BTC', name: 'Bitcoin', id: '0x94dd1f4c50807a16ca48109894c2bfa40d73e1a5d5971faf66f0521001c8007a' as `0x${string}`, token: '0x0000000000000000000000000000000000000002' as `0x${string}` },
  { symbol: 'ARB', name: 'Arbitrum', id: '0xa781bfde73683b35e073056541adfe117436a0d0aafa71586bb27654e784b4e5' as `0x${string}`, token: '0x0000000000000000000000000000000000000003' as `0x${string}` },
  { symbol: 'LINK', name: 'Chainlink', id: '0x2da77664e320b51c9a0f3f93185d43b8f153f8b55929c75e434282b3883ccaca' as `0x${string}`, token: '0x0000000000000000000000000000000000000004' as `0x${string}` },
  { symbol: 'OP', name: 'Optimism', id: '0xb16632335106d19135a90c8f7cceb44d41283240243cbf42b0978a2dbc98d07e' as `0x${string}`, token: '0x0000000000000000000000000000000000000005' as `0x${string}` },
  { symbol: 'AAVE', name: 'Aave', id: '0x769565e64c1e7b833c8deb21292f170c32fa99e86053913f990bb4bbb3f36a23' as `0x${string}`, token: '0x0000000000000000000000000000000000000006' as `0x${string}` },
]

export function MarketsPage() {
  const navigate = useNavigate()
  const setSelectedMarket = useTradingStore((s) => s.setSelectedMarket)
  const tickers = useMarketTickers()

  const handleTrade = (index: number) => {
    const m = ALL_MARKETS[index]
    const ticker = tickers[index]
    setSelectedMarket({
      ...m,
      price: ticker?.price ?? 0,
      priceChange24h: ticker?.changePercent24h ?? 0,
      fundingRate: 0.0001,
      openInterestLong: 0,
      openInterestShort: 0,
      maxLeverage: 50,
    })
    navigate("/trade")
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-600 text-ivory">Markets</h1>
        <div className="flex items-center gap-1.5 arcium-badge">
          <Lock size={10} />
          Private trading via Arcium MXE
        </div>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-xs text-dim font-display font-500">Market</th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">Price</th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">24h Change</th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">24h Volume</th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">Max Leverage</th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">Funding</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ALL_MARKETS.map((m, i) => {
              const ticker = tickers[i]
              const isPositive = (ticker?.changePercent24h ?? 0) >= 0
              return (
                <tr key={m.symbol} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                        <span className="text-xs font-display font-600 text-ivory">{m.symbol[0]}</span>
                      </div>
                      <div>
                        <p className="font-display font-600 text-ivory text-sm">{m.symbol}/USD</p>
                        <p className="text-xs text-dim font-mono">{m.name} Perpetual</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-ivory">
                    {ticker ? `$${ticker.price < 10 ? ticker.price.toFixed(4) : formatPrice(ticker.price)}` : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`flex items-center justify-end gap-1 font-mono text-xs ${isPositive ? "text-positive" : "text-negative"}`}>
                      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isPositive ? "+" : ""}{ticker?.changePercent24h.toFixed(2) ?? "—"}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-ghost text-xs">
                    {ticker ? `$${(ticker.volume24h / 1e6).toFixed(1)}M` : "—"}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-ghost text-xs">50x</td>
                  <td className="px-4 py-4 text-right font-mono text-xs text-positive">+0.0100%</td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleTrade(i)}
                      className="px-3 py-1.5 rounded-md bg-arcium-500/15 text-arcium-400 border border-arcium-500/25 hover:bg-arcium-500/25 text-xs font-display font-600 transition-all duration-150"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="panel p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-arcium-500/10 border border-arcium-500/20 flex items-center justify-center flex-shrink-0">
          <Lock size={16} className="text-arcium-400" />
        </div>
        <div>
          <h3 className="font-display font-600 text-ivory text-sm mb-1">Trade privately with Arcium MXE</h3>
          <p className="text-xs text-dim font-mono leading-relaxed">
            Every position on VEIL is encrypted inside Arcium Multi-party Execution Environment.
            Your size, direction, and entry price are invisible to other traders, validators,
            and liquidation bots — eliminating front-running and copy-trading.
            Only your final PnL is revealed when you close.
          </p>
        </div>
      </div>
    </div>
  )
}
