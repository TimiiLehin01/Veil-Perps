import { NavLink } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Shield, BarChart2, Briefcase, LayoutGrid } from 'lucide-react'
import { useChainId, useSwitchChain } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

const navItems = [
  { to: '/trade', label: 'Trade', icon: BarChart2 },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/markets', label: 'Markets', icon: LayoutGrid },
]

export function Navbar() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const isWrongNetwork = chainId !== undefined && chainId !== baseSepolia.id

  return (
    <>
      {/* ── TOP NAVBAR ── */}
      <header className="h-14 border-b border-border bg-surface/90 backdrop-blur-sm sticky top-0 z-50 flex items-center px-3 gap-2">

        {/* Logo */}
        <NavLink to="/trade" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-arcium-500/20 border border-arcium-500/40 flex items-center justify-center">
            <Shield size={13} className="text-arcium-400" />
          </div>
          <span className="font-display font-600 text-ivory text-sm tracking-wide">VEIL</span>
          <span className="text-dim font-mono text-xs hidden sm:block">Perps</span>
        </NavLink>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 ml-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-500 transition-all duration-150
                ${isActive ? 'text-ivory bg-muted' : 'text-dim hover:text-ghost hover:bg-muted/50'}`
              }
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Wrong network */}
        {isWrongNetwork && (
          <button
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-crimson-500/15 border border-crimson-500/30 text-crimson-400 text-[11px] font-mono flex-shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-crimson-400 animate-pulse flex-shrink-0" />
            <span className="hidden sm:block">Wrong Network</span>
            <span className="sm:hidden">Switch</span>
          </button>
        )}

        {/* Wallet */}
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted
            const connected = ready && account && chain
            if (!ready) return <div style={{ opacity: 0 }} />
            if (!connected) {
              return (
                <button onClick={openConnectModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-arcium-500 hover:bg-arcium-400 text-white font-display font-600 text-xs transition-all active:scale-95 flex-shrink-0">
                  <Shield size={12} />
                  <span className="hidden sm:block">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )
            }
            if (chain.unsupported) {
              return (
                <button onClick={openChainModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-crimson-500 hover:bg-crimson-400 text-white font-display font-600 text-xs transition-all flex-shrink-0">
                  Wrong Network
                </button>
              )
            }
            return (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={openChainModal}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-panel border border-border hover:border-muted text-ghost text-xs font-mono transition-all">
                  {chain.hasIcon && chain.iconUrl && (
                    <img src={chain.iconUrl} alt={chain.name} className="w-3.5 h-3.5 rounded-full flex-shrink-0" />
                  )}
                  <span className="hidden sm:block truncate max-w-20">{chain.name}</span>
                </button>
                <button onClick={openAccountModal}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-panel border border-border hover:border-muted text-ivory text-xs font-mono transition-all">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="truncate max-w-24">{account.displayName}</span>
                </button>
              </div>
            )
          }}
        </ConnectButton.Custom>
      </header>

      {/* ── MOBILE BOTTOM NAV (Portfolio + Markets) ── */}
      {/* This sits outside the page — fixed at bottom on mobile only */}
    </>
  )
}
