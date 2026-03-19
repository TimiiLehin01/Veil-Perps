import { useEffect } from "react";
import { PriceChart } from "@/components/Chart/PriceChart";
import { FundingRateBar } from "@/components/Chart/FundingRateBar";
import { OrderForm } from "@/components/TradingPanel/OrderForm";
import { OpenPositions } from "@/components/Portfolio/OpenPositions";
import { ProofStatus } from "@/components/Privacy/ProofStatus";
import { useTradingStore } from "@/store/tradingStore";
import { useMarketTickers } from "@/hooks/usePriceData";

const MARKETS = [
  {
    symbol: "ETH",
    id: "0xeth" as `0x${string}`,
    token: "0x4200000000000000000000000000000000000006" as `0x${string}`,
  },
  {
    symbol: "BTC",
    id: "0xbtc" as `0x${string}`,
    token: "0x0000000000000000000000000000000000000001" as `0x${string}`,
  },
];

export function TradePage() {
  const { setMarkets, setSelectedMarket, selectedMarket } = useTradingStore(
    (s) => ({
      setMarkets: s.setMarkets,
      setSelectedMarket: s.setSelectedMarket,
      selectedMarket: s.selectedMarket,
    }),
  );

  const tickers = useMarketTickers();

  useEffect(() => {
    if (tickers.length === 0) return;
    const markets = MARKETS.map((m, i) => ({
      ...m,
      price: tickers[i]?.price ?? 0,
      priceChange24h: tickers[i]?.changePercent24h ?? 0,
      fundingRate: 0.0001,
      openInterestLong: 0,
      openInterestShort: 0,
      maxLeverage: 50,
    }));
    setMarkets(markets);
    if (!selectedMarket) setSelectedMarket(markets[0]);
  }, [tickers]);

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden animate-fade-in">
      {/* Market selector strip */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-surface flex-shrink-0">
        {MARKETS.map((m, i) => {
          const ticker = tickers[i];
          const isSelected = selectedMarket?.symbol === m.symbol;
          const isPositive = (ticker?.changePercent24h ?? 0) >= 0;

          return (
            <button
              key={m.symbol}
              onClick={() => {
                const full = {
                  ...m,
                  price: ticker?.price ?? 0,
                  priceChange24h: ticker?.changePercent24h ?? 0,
                  fundingRate: 0.0001,
                  openInterestLong: 0,
                  openInterestShort: 0,
                  maxLeverage: 50,
                };
                setSelectedMarket(full);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-150
                ${isSelected ? "bg-muted border border-border" : "hover:bg-muted/50 border border-transparent"}`}
            >
              <span className="text-xs font-display font-600 text-ivory">
                {m.symbol}/USD
              </span>
              {ticker && (
                <>
                  <span className="text-xs font-mono text-ghost">
                    ${ticker.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-[11px] font-mono ${isPositive ? "text-positive" : "text-negative"}`}
                  >
                    {isPositive ? "+" : ""}
                    {ticker.changePercent24h.toFixed(2)}%
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Chart + Positions */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Chart */}
          <div className="flex-1 min-h-0">
            <PriceChart />
          </div>

          {/* Funding bar */}
          <FundingRateBar rate={selectedMarket?.fundingRate ?? 0.0001} />

          {/* Open positions */}
          <div className="h-48 border-t border-border flex-shrink-0 overflow-y-auto">
            <div className="px-4 py-2 border-b border-border">
              <span className="text-xs font-display font-600 text-ghost uppercase tracking-wider">
                Open Positions
              </span>
            </div>
            <OpenPositions />
          </div>
        </div>

        {/* Right: Order panel */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-panel">
          {/* Panel header */}
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <span className="text-xs font-display font-600 text-ghost uppercase tracking-wider">
              Place Order
            </span>
          </div>

          {/* Order form */}
          <div className="flex-1 overflow-y-auto">
            <OrderForm />
          </div>

          {/* Privacy panel at bottom */}
          <div className="p-3 border-t border-border flex-shrink-0">
            <ProofStatus />
          </div>
        </div>
      </div>
    </div>
  );
}
