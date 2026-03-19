import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { useTradingStore } from '@/store/tradingStore'

const STATUS_CONFIG = {
  idle: {
    icon: Shield,
    label: 'Private',
    sublabel: 'Arcium MXE ready',
    color: 'text-arcium-400',
    bg: 'bg-arcium-500/10 border-arcium-500/20',
    pulse: false,
  },
  encrypting: {
    icon: Loader2,
    label: 'Encrypting',
    sublabel: 'position data...',
    color: 'text-gold-400',
    bg: 'bg-gold-400/10 border-gold-400/20',
    pulse: true,
  },
  proving: {
    icon: Loader2,
    label: 'Proving',
    sublabel: 'generating ZK proof...',
    color: 'text-arcium-400',
    bg: 'bg-arcium-500/10 border-arcium-500/20',
    pulse: true,
  },
  ready: {
    icon: ShieldCheck,
    label: 'Verified',
    sublabel: 'proof accepted',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
    pulse: false,
  },
  error: {
    icon: ShieldAlert,
    label: 'Failed',
    sublabel: 'proof rejected',
    color: 'text-crimson-400',
    bg: 'bg-crimson-400/10 border-crimson-400/20',
    pulse: false,
  },
}

export function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  const arciumStatus = useTradingStore((s) => s.arciumStatus)
  const config = STATUS_CONFIG[arciumStatus]
  const Icon = config.icon

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-mono ${config.bg} ${config.color}`}>
        <Icon size={10} className={config.pulse ? 'animate-spin' : ''} />
        <span>{config.label}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${config.bg}`}>
      <div className={`${config.color} relative shrink-0`}>
        <Icon size={16} className={config.pulse ? 'animate-spin' : ''} />
        {arciumStatus === 'idle' && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-arcium-400 animate-pulse" />
        )}
      </div>
      <div>
        <div className={`text-xs font-mono font-500 ${config.color}`}>{config.label}</div>
        <div className="text-xs text-dim">{config.sublabel}</div>
      </div>
    </div>
  )
}

export function PrivacyInfoPanel() {
  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={14} className="text-arcium-400" />
        <span className="text-xs font-display font-600 text-ivory uppercase tracking-wider">
          Privacy Layer
        </span>
      </div>
      <div className="space-y-2">
        {[
          { label: 'Position size', private: true },
          { label: 'Direction (Long/Short)', private: true },
          { label: 'Entry price', private: true },
          { label: 'Leverage', private: true },
          { label: 'Collateral amount', private: false, value: 'Public' },
          { label: 'Final PnL', private: false, value: 'Revealed on close' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs text-dim">{row.label}</span>
            <span className={`text-xs font-mono ${row.private ? 'text-arcium-400' : 'text-ghost'}`}>
              {row.private ? 'Encrypted' : row.value}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-dim leading-relaxed pt-1 border-t border-border">
        Position data is encrypted via Arcium MXE. Liquidation checks run privately —
        liquidators learn only that a position is underwater, never the size or entry price.
      </p>
    </div>
  )
}
