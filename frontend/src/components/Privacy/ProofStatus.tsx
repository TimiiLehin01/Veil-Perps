import { Shield, ShieldCheck, ShieldAlert, Loader2, Info } from 'lucide-react'
import { useState } from 'react'
import { useTradingStore } from '@/store/tradingStore'

const STEPS = [
  { key: 'encrypting', label: 'Encrypt position data', desc: 'Size, side, and leverage encrypted client-side' },
  { key: 'proving', label: 'Generate Arcium proof', desc: 'MXE verifies position validity privately' },
  { key: 'ready', label: 'Submit on-chain', desc: 'Only commitment hash hits the blockchain' },
]

export function ProofStatus({ compact = false }: { compact?: boolean }) {
  const arciumStatus = useTradingStore((s) => s.arciumStatus)
  const [expanded, setExpanded] = useState(false)

  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {arciumStatus === 'idle' && <Shield size={11} className="text-arcium-400" />}
          {arciumStatus === 'encrypting' && <Loader2 size={11} className="text-gold-400 animate-spin" />}
          {arciumStatus === 'proving' && <Loader2 size={11} className="text-arcium-400 animate-spin" />}
          {arciumStatus === 'ready' && <ShieldCheck size={11} className="text-emerald-400" />}
          {arciumStatus === 'error' && <ShieldAlert size={11} className="text-crimson-400" />}
          <span className="text-[10px] font-mono text-dim">
            {arciumStatus === 'idle' && 'Position data will be encrypted'}
            {arciumStatus === 'encrypting' && 'Encrypting...'}
            {arciumStatus === 'proving' && 'Generating proof...'}
            {arciumStatus === 'ready' && 'Proof verified'}
            {arciumStatus === 'error' && 'Proof failed'}
          </span>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-dim hover:text-ghost transition-colors">
          <Info size={11} />
        </button>
      </div>
    )
  }

  const isActive = arciumStatus !== 'idle' && arciumStatus !== 'error'
  const currentStepIndex = STEPS.findIndex((s) => s.key === arciumStatus)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-arcium-400" />
          <span className="text-[11px] font-display font-600 text-ghost uppercase tracking-wider">
            Arcium Privacy
          </span>
        </div>
        {arciumStatus === 'ready' && (
          <span className="text-[10px] font-mono text-emerald-400">✓ Verified</span>
        )}
      </div>

      {isActive && (
        <div className="space-y-1.5">
          {STEPS.map((step, i) => {
            const isDone = currentStepIndex > i || arciumStatus === 'ready'
            const isCurrentStep = step.key === arciumStatus
            return (
              <div
                key={step.key}
                className={`flex items-start gap-2 p-2 rounded-md transition-all duration-300 ${
                  isCurrentStep ? 'bg-arcium-500/10 border border-arcium-500/20' : ''
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center">
                      <span className="text-[8px] text-emerald-400">✓</span>
                    </div>
                  ) : isCurrentStep ? (
                    <Loader2 size={14} className="text-arcium-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-border" />
                  )}
                </div>
                <div>
                  <p className={`text-[11px] font-mono font-500 ${
                    isCurrentStep ? 'text-arcium-400' : isDone ? 'text-ghost' : 'text-subtle'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrentStep && (
                    <p className="text-[10px] text-dim mt-0.5">{step.desc}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
