import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2, Target, ShieldOff, Zap, Clock } from 'lucide-react'
import { useTradingStore } from '@/store/tradingStore'
import { LeverageSlider } from './LeverageSlider'
import { PositionSummary } from './PositionSummary'
import { ProofStatus } from '@/components/Privacy/ProofStatus'
import { CONTRACTS, VAULT_ABI, MOCK_USDC_ABI, POSITION_MANAGER_ABI } from '@/lib/contracts'
import { generateCommitmentHash, generateSalt, submitToArciumMXE } from '@/lib/privacy'
import { parseUSDC, formatPrice } from '@/lib/formatters'

type Step = 'idle' | 'approving' | 'depositing' | 'proving' | 'submitting' | 'done' | 'error'
type OrderType = 'market' | 'limit' | 'stop'

const ORDER_TYPES: { key: OrderType; label: string; icon: any; desc: string }[] = [
  { key: 'market', label: 'Market', icon: Zap, desc: 'Execute immediately at current price' },
  { key: 'limit', label: 'Limit', icon: Clock, desc: 'Execute when price reaches your target' },
  { key: 'stop', label: 'Stop', icon: TrendingDown, desc: 'Execute when price breaks a level' },
]

export function OrderForm() {
  const { address, isConnected } = useAccount()
  const [step, setStep] = useState<Step>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [limitPriceInput, setLimitPriceInput] = useState('')
  const [stopPriceInput, setStopPriceInput] = useState('')
  const [tpslEnabled, setTpslEnabled] = useState(false)
  const [takeProfitInput, setTakeProfitInput] = useState('')
  const [stopLossInput, setStopLossInput] = useState('')

  const { side, setSide, leverage, collateralInput, setCollateralInput, selectedMarket, setArciumStatus } =
    useTradingStore((s) => ({
      side: s.side,
      setSide: s.setSide,
      leverage: s.leverage,
      collateralInput: s.collateralInput,
      setCollateralInput: s.setCollateralInput,
      selectedMarket: s.selectedMarket,
      setArciumStatus: s.setArciumStatus,
    }))

  const contracts = CONTRACTS.baseSepolia

  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: contracts.mockUSDC,
    abi: MOCK_USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const { data: freeBalance, refetch: refetchFreeBalance } = useReadContract({
    address: contracts.vault,
    abi: VAULT_ABI,
    functionName: 'freeBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const { writeContractAsync } = useWriteContract()

  const collateralAmount = parseUSDC(collateralInput)
  const currentPrice = selectedMarket?.price ?? 0
  const limitPrice = parseFloat(limitPriceInput || '0')
  const stopPrice = parseFloat(stopPriceInput || '0')
  const takeProfit = parseFloat(takeProfitInput || '0')
  const stopLoss = parseFloat(stopLossInput || '0')

  const limitValid = orderType !== 'limit' || limitPrice > 0
  const stopValid = orderType !== 'stop' || stopPrice > 0
  const tpValid = !tpslEnabled || takeProfit === 0 || (side === 'LONG' ? takeProfit > currentPrice : takeProfit < currentPrice)
  const slValid = !tpslEnabled || stopLoss === 0 || (side === 'LONG' ? stopLoss < currentPrice : stopLoss > currentPrice)

  const isValid = collateralAmount >= 10_000_000n && !!selectedMarket && isConnected && tpValid && slValid && limitValid && stopValid

  const executionPrice = orderType === 'market' ? currentPrice : orderType === 'limit' ? limitPrice : stopPrice

  const handleTrade = async () => {
    if (!isValid || !address || !selectedMarket) return
    setStep('idle')
    setErrorMsg('')

    try {
      setStep('approving')
      await writeContractAsync({
        address: contracts.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: 'approve',
        args: [contracts.vault, collateralAmount],
      })

      setStep('depositing')
      await writeContractAsync({
        address: contracts.vault,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [collateralAmount],
      })

      setStep('proving')
      setArciumStatus('encrypting')

      const salt = generateSalt()
      const entryPriceBig = BigInt(Math.floor(executionPrice * 1e18))
      const sizeBig = collateralAmount * BigInt(leverage)

      const positionData = { size: sizeBig, side, leverage, entryPrice: entryPriceBig, marketId: selectedMarket.id }
      const commitmentHash = generateCommitmentHash(positionData, address, salt)

      setArciumStatus('proving')
      const arciumResult = await submitToArciumMXE(positionData, commitmentHash, address)
      setArciumStatus('ready')

      setStep('submitting')
      const tx = await writeContractAsync({
        address: contracts.positionManager,
        abi: POSITION_MANAGER_ABI,
        functionName: 'openPosition',
        args: [selectedMarket.id, collateralAmount, commitmentHash, arciumResult.proof as `0x${string}`],
      })

      setTxHash(tx)
      setStep('done')
      setCollateralInput('')
      setTakeProfitInput('')
      setStopLossInput('')
      setLimitPriceInput('')
      setStopPriceInput('')
      setArciumStatus('idle')
      refetchUsdcBalance()
      refetchFreeBalance()

    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.shortMessage || err?.message || 'Transaction failed')
      setStep('error')
      setArciumStatus('error')
    }
  }

  const stepLabels: Record<Step, string> = {
    idle: orderType === 'market' ? `${side === 'LONG' ? 'Buy' : 'Sell'} / Market` : orderType === 'limit' ? 'Place Limit Order' : 'Place Stop Order',
    approving: 'Approving USDC...',
    depositing: 'Depositing Collateral...',
    proving: 'Generating Arcium Proof...',
    submitting: 'Submitting On-chain...',
    done: 'Order Placed',
    error: 'Try Again',
  }

  const isLoading = ['approving', 'depositing', 'proving', 'submitting'].includes(step)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-4">

        {/* Long / Short */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface rounded-lg border border-border">
          {(['LONG', 'SHORT'] as const).map((s) => (
            <button key={s} onClick={() => setSide(s)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-display font-600 transition-all duration-150
                ${side === s ? s === 'LONG' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/25' : 'bg-crimson-500/15 text-crimson-400 border border-crimson-400/25' : 'text-dim hover:text-ghost'}`}
            >
              {s === 'LONG' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {s === 'LONG' ? 'Long' : 'Short'}
            </button>
          ))}
        </div>

        {/* Order Type */}
        <div className="space-y-1.5">
          <label className="text-xs text-dim font-display">Order Type</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-lg border border-border">
            {ORDER_TYPES.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setOrderType(key)}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-display font-600 transition-all duration-150
                  ${orderType === key ? 'bg-arcium-500/15 text-arcium-400 border border-arcium-500/25' : 'text-dim hover:text-ghost'}`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-dim font-mono">{ORDER_TYPES.find(o => o.key === orderType)?.desc}</p>
        </div>

        {/* Limit Price */}
        {orderType === 'limit' && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs text-dim font-display">Limit Price</label>
              {currentPrice > 0 && (
                <button onClick={() => setLimitPriceInput(currentPrice.toFixed(2))} className="text-[10px] text-dim hover:text-arcium-400 font-mono transition-colors">
                  Mark: ${formatPrice(currentPrice)}
                </button>
              )}
            </div>
            <div className="relative">
              <input type="number" value={limitPriceInput} onChange={(e) => setLimitPriceInput(e.target.value)}
                placeholder={`$${formatPrice(currentPrice)}`} className="input-field pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">USD</span>
            </div>
            {limitPrice > 0 && currentPrice > 0 && (
              <p className={`text-[10px] font-mono ${(side === 'LONG' && limitPrice < currentPrice) || (side === 'SHORT' && limitPrice > currentPrice) ? 'text-emerald-400' : 'text-gold-400'}`}>
                {side === 'LONG' && limitPrice < currentPrice && `Buying ${((currentPrice - limitPrice) / currentPrice * 100).toFixed(2)}% below mark`}
                {side === 'LONG' && limitPrice >= currentPrice && `⚠ At or above mark — will fill immediately`}
                {side === 'SHORT' && limitPrice > currentPrice && `Selling ${((limitPrice - currentPrice) / currentPrice * 100).toFixed(2)}% above mark`}
                {side === 'SHORT' && limitPrice <= currentPrice && `⚠ At or below mark — will fill immediately`}
              </p>
            )}
          </div>
        )}

        {/* Stop Price */}
        {orderType === 'stop' && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs text-dim font-display">Stop Price</label>
              {currentPrice > 0 && <span className="text-[10px] text-dim font-mono">Mark: ${formatPrice(currentPrice)}</span>}
            </div>
            <div className="relative">
              <input type="number" value={stopPriceInput} onChange={(e) => setStopPriceInput(e.target.value)}
                placeholder={`$${formatPrice(currentPrice)}`} className="input-field pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">USD</span>
            </div>
            {stopPrice > 0 && currentPrice > 0 && (
              <p className="text-[10px] font-mono text-dim">
                Order triggers when price {stopPrice > currentPrice ? 'rises' : 'falls'} to ${formatPrice(stopPrice)}
              </p>
            )}
          </div>
        )}

        {/* Collateral */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-dim font-display">Collateral</label>
            {freeBalance !== undefined && freeBalance > 0n && (
              <button onClick={() => setCollateralInput((Number(freeBalance) / 1e6).toFixed(2))} className="text-[10px] text-dim hover:text-arcium-400 font-mono transition-colors">
                Vault: ${(Number(freeBalance) / 1e6).toFixed(2)}
              </button>
            )}
          </div>
          <div className="relative">
            <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input type="number" value={collateralInput} onChange={(e) => setCollateralInput(e.target.value)}
              placeholder="0.00" className="input-field pl-8" min={10} step={10} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-dim font-mono">
              Wallet: {usdcBalance !== undefined ? `$${(Number(usdcBalance) / 1e6).toFixed(2)} USDC` : isConnected ? 'Loading...' : '—'}
            </p>
            {usdcBalance === 0n && isConnected && <span className="text-[10px] text-gold-400 font-mono">Use faucet ↗</span>}
          </div>
        </div>

        {/* Leverage */}
        <LeverageSlider />

        {/* TP/SL */}
        <div className="space-y-2">
          <button onClick={() => setTpslEnabled(!tpslEnabled)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-md border transition-all duration-150 text-xs
              ${tpslEnabled ? 'bg-gold-400/10 border-gold-400/20 text-gold-400' : 'bg-surface border-border text-dim hover:text-ghost hover:border-muted'}`}
          >
            <div className="flex items-center gap-1.5">
              <Target size={12} />
              <span className="font-display font-600">Take Profit / Stop Loss</span>
            </div>
            <span className="font-mono text-[10px]">{tpslEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {tpslEnabled && (
            <div className="space-y-3 p-3 bg-surface rounded-lg border border-border animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-dim font-mono flex items-center gap-1">
                    <Target size={10} className="text-emerald-400" /> Take Profit
                  </label>
                  {takeProfit > 0 && tpValid && currentPrice > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">+{(Math.abs((takeProfit - currentPrice) / currentPrice) * 100 * leverage).toFixed(1)}% ROI</span>
                  )}
                </div>
                <div className="relative">
                  <input type="number" value={takeProfitInput} onChange={(e) => setTakeProfitInput(e.target.value)}
                    placeholder={currentPrice > 0 ? `${side === 'LONG' ? '> ' : '< '}$${formatPrice(currentPrice)}` : 'Price in USD'}
                    className={`input-field pr-12 text-xs ${!tpValid ? 'border-crimson-500/50' : ''}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dim font-mono">USD</span>
                </div>
                {!tpValid && <p className="text-[10px] text-crimson-400 font-mono">{side === 'LONG' ? 'TP must be above entry' : 'TP must be below entry'}</p>}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-dim font-mono flex items-center gap-1">
                    <ShieldOff size={10} className="text-crimson-400" /> Stop Loss
                  </label>
                  {stopLoss > 0 && slValid && currentPrice > 0 && (
                    <span className="text-[10px] font-mono text-crimson-400">-{(Math.abs((stopLoss - currentPrice) / currentPrice) * 100 * leverage).toFixed(1)}% ROI</span>
                  )}
                </div>
                <div className="relative">
                  <input type="number" value={stopLossInput} onChange={(e) => setStopLossInput(e.target.value)}
                    placeholder={currentPrice > 0 ? `${side === 'LONG' ? '< ' : '> '}$${formatPrice(currentPrice)}` : 'Price in USD'}
                    className={`input-field pr-12 text-xs ${!slValid ? 'border-crimson-500/50' : ''}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dim font-mono">USD</span>
                </div>
                {!slValid && <p className="text-[10px] text-crimson-400 font-mono">{side === 'LONG' ? 'SL must be below entry' : 'SL must be above entry'}</p>}
              </div>

              <p className="text-[10px] text-dim font-mono pt-1 border-t border-border">
                🔒 TP/SL encrypted with your position via Arcium MXE
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border" />
        <PositionSummary />
        <ProofStatus compact />

        <button onClick={handleTrade} disabled={!isValid || isLoading}
          className={`w-full py-3 rounded-lg font-display font-600 text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
            ${side === 'LONG' ? 'bg-emerald-500 hover:bg-emerald-400 text-void' : 'bg-crimson-500 hover:bg-crimson-400 text-white'}
            ${isLoading ? 'opacity-70' : ''}`}
        >
          {isLoading && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />}
          {!isConnected ? 'Connect Wallet' : stepLabels[step]}
        </button>

        {step === 'done' && txHash && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-emerald-400 font-display font-600">{orderType === 'market' ? 'Position opened' : 'Order placed'}</p>
              <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-dim font-mono hover:text-ghost truncate block">View on BaseScan →</a>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-crimson-400/5 border border-crimson-400/20">
            <AlertCircle size={13} className="text-crimson-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-crimson-400 font-mono break-words">{errorMsg}</p>
          </div>
        )}

      </div>
    </div>
  )
}
