import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Lock } from "lucide-react";
import { useTradingStore } from "@/store/tradingStore";
import { useMarketTickers } from "@/hooks/usePriceData";
import { formatPrice } from "@/lib/formatters";

const MARKETS_META = [
  {
    symbol: "ETH",
    name: "Ethereum",
    id: "0xeth" as `0x${string}`,
    token: "0x4200000000000000000000000000000000000006" as `0x${string}`,
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    id: "0xbtc" as `0x${string}`,
    token: "0x0000000000000000000000000000000000000001" as `0x${string}`,
  },
];

export function MarketsPage() {
  const navigate = useNavigate();
  const setSelectedMarket = useTradingStore((s) => s.setSelectedMarket);
  const tickers = useMarketTickers();

  const handleTrade = (index: number) => {
    const m = MARKETS_META[index];
    const ticker = tickers[index];
    setSelectedMarket({
      ...m,
      price: ticker?.price ?? 0,
      priceChange24h: ticker?.changePercent24h ?? 0,
      fundingRate: 0.0001,
      openInterestLong: 0,
      openInterestShort: 0,
      maxLeverage: 50,
    });
    navigate("/trade");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in space-y-4">
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
              <th className="text-left px-4 py-3 text-xs text-dim font-display font-500">
                Market
              </th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">
                Price
              </th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">
                24h Change
              </th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">
                24h Volume
              </th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">
                Max Leverage
              </th>
              <th className="text-right px-4 py-3 text-xs text-dim font-display font-500">
                Funding
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MARKETS_META.map((m, i) => {
              const ticker = tickers[i];
              const isPositive = (ticker?.changePercent24h ?? 0) >= 0;

              return (
                <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                        <span className="text-xs font-display font-600 text-ivory">
                          {m.symbol[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-display font-600 text-ivory text-sm">
                          {m.symbol}/USD
                        </p>
                        <p className="text-xs text-dim font-mono">
                          {m.name} Perpetual
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-ivory">
                    {ticker ? `$${formatPrice(ticker.price)}` : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span
                      className={`flex items-center justify-end gap-1 font-mono text-xs ${isPositive ? "text-positive" : "text-negative"}`}
                    >
                      {isPositive ? (
                        <TrendingUp size={11} />
                      ) : (
                        <TrendingDown size={11} />
                      )}
                      {isPositive ? "+" : ""}
                      {ticker?.changePercent24h.toFixed(2) ?? "—"}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-ghost text-xs">
                    ${ticker ? (ticker.volume24h / 1e6).toFixed(1) + "M" : "—"}
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-ghost text-xs">
                    50×
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-xs text-positive">
                    +0.0100%
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => handleTrade(i)}
                      className="px-3 py-1.5 rounded-md bg-arcium-500/15 text-arcium-400 border border-arcium-500/25 hover:bg-arcium-500/25 text-xs font-display font-600 transition-all duration-150"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Privacy callout */}
      <div className="panel p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-arcium-500/10 border border-arcium-500/20 flex items-center justify-center flex-shrink-0">
          <Lock size={16} className="text-arcium-400" />
        </div>
        <div>
          <h3 className="font-display font-600 text-ivory text-sm mb-1">
            Trade privately with Arcium MXE
          </h3>
          <p className="text-xs text-dim font-mono leading-relaxed">
            Every position on VEIL is encrypted inside Arcium's Multi-party
            Execution Environment. Your size, direction, and entry price are
            invisible to other traders, validators, and liquidation bots —
            eliminating front-running and copy-trading. Only your final PnL is
            revealed when you close.
          </p>
        </div>
      </div>
    </div>
  );
}
