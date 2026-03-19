import { useState, useEffect, useRef } from "react";

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

// Mock price generation for testnet (replace with real API)
function generateMockCandles(symbol: string, count = 200): PricePoint[] {
  const basePrice = symbol === "ETH" ? 3200 : symbol === "BTC" ? 68000 : 100;
  const candles: PricePoint[] = [];
  let price = basePrice;
  const now = Math.floor(Date.now() / 1000);

  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.015;
    const open = price;
    price = Math.max(price + change, basePrice * 0.5);
    const high = Math.max(open, price) * (1 + Math.random() * 0.005);
    const low = Math.min(open, price) * (1 - Math.random() * 0.005);

    candles.push({
      time: now - i * 3600,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000),
    });
  }

  return candles;
}

export function usePriceData(symbol: string) {
  const [candles, setCandles] = useState<PricePoint[]>([]);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!symbol) return;

    setIsLoading(true);
    const initial = generateMockCandles(symbol);
    setCandles(initial);

    const lastCandle = initial[initial.length - 1];
    const firstCandle = initial[0];
    setTicker({
      symbol,
      price: lastCandle.close,
      change24h: lastCandle.close - firstCandle.open,
      changePercent24h:
        ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100,
      high24h: Math.max(...initial.slice(-24).map((c) => c.high)),
      low24h: Math.min(...initial.slice(-24).map((c) => c.low)),
      volume24h: initial.slice(-24).reduce((a, c) => a + c.volume, 0),
    });
    setIsLoading(false);

    // Simulate live price updates
    intervalRef.current = setInterval(() => {
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const change = (Math.random() - 0.49) * last.close * 0.002;
        const newPrice = parseFloat((last.close + change).toFixed(2));
        const updated = {
          ...last,
          close: newPrice,
          high: Math.max(last.high, newPrice),
          low: Math.min(last.low, newPrice),
        };
        setTicker((t) =>
          t
            ? {
                ...t,
                price: newPrice,
                change24h: newPrice - prev[0].open,
                changePercent24h:
                  ((newPrice - prev[0].open) / prev[0].open) * 100,
              }
            : t,
        );
        return [...prev.slice(0, -1), updated];
      });
    }, 2000);

    return () => clearInterval(intervalRef.current);
  }, [symbol]);

  return { candles, ticker, isLoading };
}

export function useMarketTickers() {
  const [tickers, setTickers] = useState<TickerData[]>([]);

  useEffect(() => {
    const markets = ["ETH", "BTC"];
    const generated = markets.map((symbol) => {
      const candles = generateMockCandles(symbol, 24);
      const last = candles[candles.length - 1];
      const first = candles[0];
      return {
        symbol,
        price: last.close,
        change24h: last.close - first.open,
        changePercent24h: ((last.close - first.open) / first.open) * 100,
        high24h: Math.max(...candles.map((c) => c.high)),
        low24h: Math.min(...candles.map((c) => c.low)),
        volume24h: candles.reduce((a, c) => a + c.volume, 0),
      };
    });
    setTickers(generated);
  }, []);

  return tickers;
}
