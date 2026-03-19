import { useEffect, useRef, useState } from 'react'
import { PriceChart } from '@/components/Chart/PriceChart'
import { FundingRateBar } from '@/components/Chart/FundingRateBar'
import { OrderForm } from '@/components/TradingPanel/OrderForm'
import { OpenPositions } from '@/components/Portfolio/OpenPositions'
import { ProofStatus } from '@/components/Privacy/ProofStatus'
import { useTradingStore } from '@/store/tradingStore'
import { useMarketTickers } from '@/hooks/usePriceData'
import { useLoadPositions } from '@/hooks/usePosition'
import { ALL_MARKETS } from '@/pages/Markets'
import { BarChart2, Briefcase, Shield, LayoutGrid } from 'lucide-react'
import { NavLink } from 'react-router-dom'

function LivePriceSync({ tickers }: { tickers: any[] }) {
  const selectedMarket = useTradingStore((s) => s.selectedMarket)
  const setSelectedMarket = useTradingStore((s) => s.setSelectedMarket)
  const markets = useTradingStore((s) => s.markets)
  useEffect(() => {
    if (!selectedMarket || tickers.length === 0) return
    const idx = markets.findIndex(m => m.symbol === selectedMarket.symbol)
    if (idx === -1) return
    const ticker = tickers[idx]
    if (ticker && ticker.price > 0 && ticker.price !== selectedMarket.price) {
      setSelectedMarket({ ...selectedMarket, price: ticker.price, priceChange24h: ticker.changePercent24h })
    }
  }, [tickers])
  return null
}

function MarketTickerStrip({ tickers }: { tickers: any[] }) {
  const setSelectedMarket = useTradingStore((s) => s.setSelectedMarket)
  const selectedMarket = useTradingStore((s) => s.selectedMarket)
  const stripRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    let frame: number
    let pos = 0
    const animate = () => {
      pos += 0.4
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    const pause = () => cancelAnimationFrame(frame)
    const resume = () => { frame = requestAnimationFrame(animate) }
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    return () => { cancelAnimationFrame(frame) }
  }, [tickers.length])

  const items = [...ALL_MARKETS, ...ALL_MARKETS]
  return (
    <div ref={stripRef} className="flex items-center gap-1 px-3 py-2 border-b border-border bg-surface flex-shrink-0 overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
      {items.map((m, i) => {
        const ticker = tickers[i % ALL_MARKETS.length]
        const isSelected = selectedMarket?.symbol === m.symbol
        const isPositive = (ticker?.changePercent24h ?? 0) >= 0
        return (
          <button key={i} onClick={() => setSelectedMarket({ ...m, price: ticker?.price ?? 0, priceChange24h: ticker?.changePercent24h ?? 0, fundingRate: 0.0001, openInterestLong: 0, openInterestShort: 0, maxLeverage: 50 })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-150 shrink-0 ${isSelected ? 'bg-muted border border-border' : 'hover:bg-muted/50 border border-transparent'}`}>
            <span className="text-xs font-display font-600 text-ivory">{m.symbol}/USD</span>
            {ticker && (
              <>
                <span className="text-xs font-mono text-ghost">${ticker.price < 10 ? ticker.price.toFixed(3) : ticker.price.toFixed(2)}</span>
                <span className={`text-[11px] font-mono ${isPositive ? 'text-positive' : 'text-negative'}`}>{isPositive ? '+' : ''}{ticker.changePercent24h.toFixed(2)}%</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}

interface TradePageProps {
  mobileTab: 'chart' | 'trade' | 'positions'
  setMobileTab: (tab: 'chart' | 'trade' | 'positions') => void
}

export function TradePage({ mobileTab, setMobileTab }: TradePageProps) {
  const { setMarkets, setSelectedMarket, selectedMarket } = useTradingStore((s) => ({ setMarkets: s.setMarkets, setSelectedMarket: s.setSelectedMarket, selectedMarket: s.selectedMarket }))
  const openPositions = useTradingStore((s) => s.positions.filter(p => p.status === 'OPEN'))
  const tickers = useMarketTickers()
  useLoadPositions()

  useEffect(() => {
    if (tickers.length === 0) return
    const markets = ALL_MARKETS.map((m, i) => ({ ...m, price: tickers[i]?.price ?? 0, priceChange24h: tickers[i]?.changePercent24h ?? 0, fundingRate: 0.0001, openInterestLong: 0, openInterestShort: 0, maxLeverage: 50 }))
    setMarkets(markets)
    if (!selectedMarket) setSelectedMarket(markets[0])
  }, [tickers])

  const priceDisplay = selectedMarket?.price
    ? `$${selectedMarket.price < 10 ? selectedMarket.price.toFixed(3) : selectedMarket.price.toFixed(2)}`
    : '—'
  const changeDisplay = `${(selectedMarket?.priceChange24h ?? 0) >= 0 ? '+' : ''}${(selectedMarket?.priceChange24h ?? 0).toFixed(2)}%`
  const changeColor = (selectedMarket?.priceChange24h ?? 0) >= 0 ? 'text-positive' : 'text-negative'

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col overflow-hidden animate-fade-in">
      <LivePriceSync tickers={tickers} />
      <MarketTickerStrip tickers={tickers} />

      {/* DESKTOP */}
      <div className="hidden md:flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          <div className="flex-1 min-h-0"><PriceChart /></div>
          <FundingRateBar rate={selectedMarket?.fundingRate ?? 0.0001} />
          <div className="h-48 border-t border-border flex-shrink-0 overflow-y-auto">
            <div className="px-4 py-2 border-b border-border">
              <span className="text-xs font-display font-600 text-ghost uppercase tracking-wider">Open Positions</span>
            </div>
            <OpenPositions />
          </div>
        </div>
        <div className="w-80 flex-shrink-0 flex flex-col bg-panel">
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <span className="text-xs font-display font-600 text-ghost uppercase tracking-wider">Place Order</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto"><OrderForm /></div>
          <div className="p-3 border-t border-border flex-shrink-0"><ProofStatus /></div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="flex md:hidden flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-hidden">

          {mobileTab === 'chart' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-surface flex-shrink-0">
                <span className="font-display font-600 text-ivory text-sm">{selectedMarket?.symbol ?? 'ETH'}/USD</span>
                <span className="font-mono text-ivory text-sm font-500">{priceDisplay}</span>
                <span className={`text-xs font-mono ${changeColor}`}>{changeDisplay}</span>
              </div>
              <div className="flex-1 min-h-0"><PriceChart /></div>
              <FundingRateBar rate={selectedMarket?.fundingRate ?? 0.0001} />
            </div>
          )}

          {mobileTab === 'trade' && (
            <div className="h-full flex flex-col bg-panel">
              <div className="px-4 py-3 border-b border-border flex-shrink-0 flex items-center justify-between">
                <span className="text-xs font-display font-600 text-ghost uppercase tracking-wider">Place Order</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-ghost">{selectedMarket?.symbol}/USD</span>
                  <span className="text-xs font-mono text-ivory">{priceDisplay}</span>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto"><OrderForm /></div>
            </div>
          )}

          {mobileTab === 'positions' && (
            <div className="h-full overflow-y-auto">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-display font-600 text-ghost uppercase tracking-wider">Open Positions</span>
                {openPositions.length > 0 && <span className="text-xs font-mono text-arcium-400">{openPositions.length} active</span>}
              </div>
              <OpenPositions />
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="flex-shrink-0 border-t border-border bg-surface grid grid-cols-3">
          {([
            { key: 'chart' as MobileTab, icon: BarChart2, label: 'Chart', to: null },
            { key: 'trade' as MobileTab, icon: Shield, label: 'Trade', to: null },
            { key: 'positions' as MobileTab, icon: Briefcase, label: 'Positions', to: null },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setMobileTab(key)}
              className={`flex flex-col items-center gap-1 py-3 text-[11px] font-display font-600 transition-all relative ${mobileTab === key ? 'text-ivory' : 'text-dim'}`}>
              {mobileTab === key && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />}
              <Icon size={17} className={mobileTab === key ? 'text-arcium-400' : ''} />
              {label}
              {key === 'positions' && openPositions.length > 0 && (
                <span className="absolute top-2 right-3 w-4 h-4 rounded-full bg-arcium-500 text-[9px] text-white flex items-center justify-center">
                  {openPositions.length}
                </span>
              )}
            </button>
          ))}

        </div>
      </div>
    </div>
  )
}
