import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BarChart2, Briefcase, LayoutGrid, Shield, List } from 'lucide-react'
import { useTradingStore } from '@/store/tradingStore'

export type TradeTab = 'chart' | 'trade' | 'positions'

// Global store for mobile tab state
let globalSetTradeTab: ((tab: TradeTab) => void) | null = null
export function registerTradeTabSetter(fn: (tab: TradeTab) => void) {
  globalSetTradeTab = fn
}

export function MobileNav({ tradeTab, setTradeTab }: {
  tradeTab?: TradeTab
  setTradeTab?: (tab: TradeTab) => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const openPositions = useTradingStore((s) => s.positions.filter(p => p.status === 'OPEN'))
  const isOnTrade = location.pathname === '/trade'

  const handleTradeTab = (tab: TradeTab) => {
    if (!isOnTrade) {
      navigate('/trade')
      setTimeout(() => setTradeTab?.(tab), 100)
    } else {
      setTradeTab?.(tab)
    }
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm grid grid-cols-5">

      {/* 1. Chart */}
      <button
        onClick={() => handleTradeTab('chart')}
        className={`flex flex-col items-center gap-1 py-3 text-[10px] font-display font-600 transition-all relative
          ${isOnTrade && tradeTab === 'chart' ? 'text-ivory' : 'text-dim'}`}
      >
        {isOnTrade && tradeTab === 'chart' && (
          <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />
        )}
        <BarChart2 size={18} className={isOnTrade && tradeTab === 'chart' ? 'text-arcium-400' : ''} />
        Chart
      </button>

      {/* 2. Trade */}
      <button
        onClick={() => handleTradeTab('trade')}
        className={`flex flex-col items-center gap-1 py-3 text-[10px] font-display font-600 transition-all relative
          ${isOnTrade && tradeTab === 'trade' ? 'text-ivory' : 'text-dim'}`}
      >
        {isOnTrade && tradeTab === 'trade' && (
          <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />
        )}
        <Shield size={18} className={isOnTrade && tradeTab === 'trade' ? 'text-arcium-400' : ''} />
        Trade
      </button>

      {/* 3. Positions */}
      <button
        onClick={() => handleTradeTab('positions')}
        className={`flex flex-col items-center gap-1 py-3 text-[10px] font-display font-600 transition-all relative
          ${isOnTrade && tradeTab === 'positions' ? 'text-ivory' : 'text-dim'}`}
      >
        {isOnTrade && tradeTab === 'positions' && (
          <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />
        )}
        <div className="relative">
          <List size={18} className={isOnTrade && tradeTab === 'positions' ? 'text-arcium-400' : ''} />
          {openPositions.length > 0 && (
            <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-arcium-500 text-[8px] text-white flex items-center justify-center">
              {openPositions.length}
            </span>
          )}
        </div>
        Positions
      </button>

      {/* 4. Portfolio */}
      <NavLink to="/portfolio"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-3 text-[10px] font-display font-600 transition-all relative
          ${isActive ? 'text-ivory' : 'text-dim'}`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />}
            <Briefcase size={18} className={isActive ? 'text-arcium-400' : ''} />
            Portfolio
          </>
        )}
      </NavLink>

      {/* 5. Markets */}
      <NavLink to="/markets"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-3 text-[10px] font-display font-600 transition-all relative
          ${isActive ? 'text-ivory' : 'text-dim'}`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />}
            <LayoutGrid size={18} className={isActive ? 'text-arcium-400' : ''} />
            Markets
          </>
        )}
      </NavLink>

    </nav>
  )
}
