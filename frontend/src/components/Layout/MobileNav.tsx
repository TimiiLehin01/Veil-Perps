import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BarChart2, Briefcase, LayoutGrid, Shield, TrendingUp } from 'lucide-react'
import { useTradingStore } from '@/store/tradingStore'

export type TradeTab = 'chart' | 'trade' | 'positions'

let globalSetTradeTab: ((tab: TradeTab) => void) | null = null

export function registerTradeTabSetter(fn: (tab: TradeTab) => void) {
  globalSetTradeTab = fn
}

export function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const openPositions = useTradingStore((s) => s.positions.filter(p => p.status === 'OPEN'))
  const isOnTrade = location.pathname === '/trade'

  const goToTradeTab = (tab: TradeTab) => {
    if (!isOnTrade) {
      navigate('/trade')
      setTimeout(() => globalSetTradeTab?.(tab), 100)
    } else {
      globalSetTradeTab?.(tab)
    }
  }

  const NAV_ITEMS = [
    {
      label: 'Chart',
      icon: BarChart2,
      onClick: () => goToTradeTab('chart'),
      isActive: isOnTrade,
    },
    {
      label: 'Trade',
      icon: Shield,
      onClick: () => goToTradeTab('trade'),
      isActive: isOnTrade,
    },
    {
      label: 'Positions',
      icon: TrendingUp,
      onClick: () => goToTradeTab('positions'),
      isActive: isOnTrade,
      badge: openPositions.length,
    },
    {
      label: 'Portfolio',
      icon: Briefcase,
      to: '/portfolio',
      isActive: location.pathname === '/portfolio',
    },
    {
      label: 'Markets',
      icon: LayoutGrid,
      to: '/markets',
      isActive: location.pathname === '/markets',
    },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-sm grid grid-cols-5">
      {NAV_ITEMS.map(({ label, icon: Icon, onClick, to, isActive, badge }: any) => {
        const cls = `flex flex-col items-center gap-0.5 py-3 text-[10px] font-display font-600 transition-all relative ${isActive ? 'text-ivory' : 'text-dim'}`

        const inner = (
          <>
            {isActive && (
              <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />
            )}
            <div className="relative">
              <Icon size={18} className={isActive ? 'text-arcium-400' : ''} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-arcium-500 text-[8px] text-white flex items-center justify-center">
                  {badge}
                </span>
              )}
            </div>
            {label}
          </>
        )

        if (to) {
          return (
            <NavLink key={label} to={to}
              className={({ isActive: a }) =>
                `flex flex-col items-center gap-0.5 py-3 text-[10px] font-display font-600 transition-all relative ${a ? 'text-ivory' : 'text-dim'}`
              }>
              {({ isActive: a }) => (
                <>
                  {a && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-arcium-400 rounded-full" />}
                  <Icon size={18} className={a ? 'text-arcium-400' : ''} />
                  {label}
                </>
              )}
            </NavLink>
          )
        }

        return (
          <button key={label} onClick={onClick} className={cls}>
            {inner}
          </button>
        )
      })}
    </nav>
  )
}
