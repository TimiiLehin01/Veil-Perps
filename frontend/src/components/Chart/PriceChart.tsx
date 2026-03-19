import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";
import { usePriceData } from "@/hooks/usePriceData";
import { useTradingStore } from "@/store/tradingStore";
import { formatPrice } from "@/lib/formatters";

export function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const selectedMarket = useTradingStore((s) => s.selectedMarket);
  const symbol = selectedMarket?.symbol ?? "ETH";

  const { candles, ticker } = usePriceData(symbol);

  // Init chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0E1012" },
        textColor: "#6B7280",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1E2328", style: 1 },
        horzLines: { color: "#1E2328", style: 1 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#3D444D",
          labelBackgroundColor: "#13161A",
        },
        horzLine: {
          color: "#3D444D",
          labelBackgroundColor: "#13161A",
        },
      },
      rightPriceScale: {
        borderColor: "#1E2328",
        textColor: "#6B7280",
      },
      timeScale: {
        borderColor: "#1E2328",
        timeVisible: true,
        secondsVisible: false,
      },
      autoSize: false,
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10B981",
      downColor: "#EF4444",
      borderUpColor: "#10B981",
      borderDownColor: "#EF4444",
      wickUpColor: "#059669",
      wickDownColor: "#DC2626",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update candles
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;
    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as any,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent()
    candleSeriesRef.current?.applyOptions({ priceFormat: { type: 'price', precision: 4, minMove: 0.0001 } });
  }, [candles]);

  const isPositive = (ticker?.changePercent24h ?? 0) >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Chart header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-600 text-ivory text-sm">
            {symbol}/USD
          </span>
          <span className="text-dim text-xs font-mono">Perpetual</span>
        </div>

        {ticker && (
          <>
            <span className="font-mono text-ivory text-sm font-500">
              ${formatPrice(ticker.price)}
            </span>
            <span
              className={`text-xs font-mono ${isPositive ? "text-positive" : "text-negative"}`}
            >
              {isPositive ? "+" : ""}
              {ticker.changePercent24h.toFixed(2)}%
            </span>

            <div className="hidden md:flex items-center gap-4 ml-auto text-xs font-mono text-dim">
              <span>
                H:{" "}
                <span className="text-ghost">
                  ${formatPrice(ticker.high24h)}
                </span>
              </span>
              <span>
                L:{" "}
                <span className="text-ghost">
                  ${formatPrice(ticker.low24h)}
                </span>
              </span>
              <span>
                Vol:{" "}
                <span className="text-ghost">
                  ${(ticker.volume24h / 1e6).toFixed(1)}M
                </span>
              </span>
            </div>
          </>
        )}
      </div>

      {/* Chart canvas */}
      <div ref={chartContainerRef} className="w-full h-full" style={{ overflow: "hidden" }} />
    </div>
  );
}
