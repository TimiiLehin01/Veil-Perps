import { useState, useEffect, useRef } from "react"

export interface PricePoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerData {
  symbol: string
  price: number
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
}

const BASE_PRICES: Record<string, number> = {
  ETH: 3200, BTC: 68000, ARB: 1.2, LINK: 15, OP: 2.5, AAVE: 180,
}

function generateFallbackCandles(symbol: string, count = 200): PricePoint[] {
  const basePrice = BASE_PRICES[symbol] ?? 100
  const candles: PricePoint[] = []
  let price = basePrice
  const now = Math.floor(Date.now() / 1000)
  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.015
    const open = price
    price = Math.max(price + change, basePrice * 0.3)
    const high = Math.max(open, price) * (1 + Math.random() * 0.005)
    const low = Math.min(open, price) * (1 - Math.random() * 0.005)
    candles.push({
      time: now - i * 3600,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(price.toFixed(4)),
      volume: Math.floor(Math.random() * 1000000),
    })
  }
  return candles
}

function generateFallbackTicker(symbol: string): TickerData {
  const basePrice = BASE_PRICES[symbol] ?? 100
  const change = (Math.random() - 0.5) * basePrice * 0.02
  return {
    symbol,
    price: parseFloat((basePrice + change).toFixed(4)),
    change24h: change,
    changePercent24h: (change / basePrice) * 100,
    high24h: basePrice * 1.02,
    low24h: basePrice * 0.98,
    volume24h: Math.random() * 1e9,
  }
}

async function fetchCandles(symbol: string): Promise<PricePoint[]> {
  const res = await fetch(
    "https://min-api.cryptocompare.com/data/v2/histohour?fsym=" + symbol + "&tsym=USD&limit=200",
    { signal: AbortSignal.timeout(8000) }
  )
  const data = await res.json()
  if (data.Response !== "Success") throw new Error("failed")
  return data.Data.Data.map((k: any) => ({
    time: k.time,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volumeto,
  }))
}

async function fetchTicker(symbol: string): Promise<TickerData> {
  const res = await fetch(
    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" + symbol + "&tsyms=USD",
    { signal: AbortSignal.timeout(8000) }
  )
  const data = await res.json()
  const d = data.RAW?.[symbol]?.USD
  return {
    symbol,
    price: d.PRICE,
    change24h: d.CHANGE24HOUR,
    changePercent24h: d.CHANGEPCT24HOUR,
    high24h: d.HIGH24HOUR,
    low24h: d.LOW24HOUR,
    volume24h: d.VOLUME24HOURTO,
  }
}

export function usePriceData(symbol: string) {
  const [candles, setCandles] = useState<PricePoint[]>([])
  const [ticker, setTicker] = useState<TickerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pollingRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    setIsLoading(true)
    setCandles([])
    setTicker(null)
    clearInterval(pollingRef.current)

    fetchCandles(symbol)
      .then((data) => { setCandles(data); setIsLoading(false) })
      .catch(() => { setCandles(generateFallbackCandles(symbol)); setIsLoading(false) })

    fetchTicker(symbol)
      .then(setTicker)
      .catch(() => setTicker(generateFallbackTicker(symbol)))

    pollingRef.current = setInterval(() => {
      fetchTicker(symbol)
        .then((t) => {
          setTicker(t)
          setCandles((prev) => {
            if (prev.length === 0) return prev
            const last = prev[prev.length - 1]
            return [...prev.slice(0, -1), {
              ...last,
              close: t.price,
              high: Math.max(last.high, t.price),
              low: Math.min(last.low, t.price),
            }]
          })
        })
        .catch(() => {
          setTicker((prev) => {
            if (!prev) return generateFallbackTicker(symbol)
            const change = (Math.random() - 0.49) * prev.price * 0.001
            const newPrice = parseFloat((prev.price + change).toFixed(4))
            setCandles((c) => {
              if (c.length === 0) return c
              const last = c[c.length - 1]
              return [...c.slice(0, -1), {
                ...last, close: newPrice,
                high: Math.max(last.high, newPrice),
                low: Math.min(last.low, newPrice),
              }]
            })
            return { ...prev, price: newPrice }
          })
        })
    }, 10_000)

    return () => clearInterval(pollingRef.current)
  }, [symbol])

  return { candles, ticker, isLoading }
}

export function useMarketTickers() {
  const symbols = ["ETH", "BTC", "ARB", "LINK", "OP", "AAVE"]
  const [tickers, setTickers] = useState<TickerData[]>(symbols.map(generateFallbackTicker))

  useEffect(() => {
    const load = async () => {
      try {
        const fsyms = symbols.join(",")
        const res = await fetch(
          "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=" + fsyms + "&tsyms=USD",
          { signal: AbortSignal.timeout(8000) }
        )
        const data = await res.json()
        const result = symbols.map(s => {
          const d = data.RAW?.[s]?.USD
          return {
            symbol: s,
            price: d.PRICE,
            change24h: d.CHANGE24HOUR,
            changePercent24h: d.CHANGEPCT24HOUR,
            high24h: d.HIGH24HOUR,
            low24h: d.LOW24HOUR,
            volume24h: d.VOLUME24HOURTO,
          }
        })
        setTickers(result)
      } catch {
        setTickers(symbols.map(generateFallbackTicker))
      }
    }
    load()
    const interval = setInterval(load, 15_000)
    return () => clearInterval(interval)
  }, [])

  return tickers
}
