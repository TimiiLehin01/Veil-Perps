import { NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BarChart2, Briefcase, LayoutGrid } from "lucide-react";
import { PrivacyBadge } from "@/components/Privacy/PrivacyBadge";

const navItems = [
  { to: "/trade", label: "Trade", icon: BarChart2 },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/markets", label: "Markets", icon: LayoutGrid },
];

export function Navbar() {
  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50 flex items-center px-4 gap-4">
      {/* Logo */}
      <NavLink
        to="/trade"
        className="flex items-center gap-2.5 mr-4 flex-shrink-0"
      >
        <div className="w-7 h-7 rounded-md bg-arcium-500/20 border border-arcium-500/40 flex items-center justify-center glow-arcium">
          <span className="text-arcium-400 font-display font-600 text-xs">
            V
          </span>
        </div>
        <span className="font-display font-600 text-ivory text-sm tracking-wide">
          VEIL
        </span>
        <span className="text-dim font-mono text-xs hidden sm:block">
          Perps
        </span>
      </NavLink>

      {/* Nav Links */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-display font-500 transition-all duration-150
              ${
                isActive
                  ? "text-ivory bg-muted"
                  : "text-dim hover:text-ghost hover:bg-muted/50"
              }`
            }
          >
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Arcium status */}
      <div className="hidden md:block">
        <PrivacyBadge />
      </div>

      {/* Wallet */}
      <ConnectButton
        chainStatus="icon"
        showBalance={false}
        accountStatus="avatar"
      />
    </header>
  );
}
