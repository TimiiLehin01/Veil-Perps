import { useState, useEffect, useRef } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2, Target, ShieldOff, Zap, Clock, ChevronDown } from 'lucide-react'
import { useTradingStore } from '@/store/tradingStore'
import { LeverageSlider } from './LeverageSlider'
import { FaucetButton } from './FaucetButton'
import { ProofStatus } from '@/components/Privacy/ProofStatus'
import { CONTRACTS, VAULT_ABI, MOCK_USDC_ABI, POSITION_MANAGER_ABI } from '@/lib/contracts'
import { generateCommitmentHash, generateSalt, submitToArciumMXE } from '@/lib/privacy'
import { parseUSDC, formatPrice } from '@/lib/formatters'

type Step = 'idle' | 'approving' | 'depositing' | 'proving' | 'submitting' | 'done' | 'error'
type OrderType = 'market' | 'limit' | 'stop'

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
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    side, setSide, leverage, collateralInput, setCollateralInput,
    selectedMarket, setArciumStatus, addPosition,
  } = useTradingStore((s) => ({
    side: s.side,
    setSide: s.setSide,
    leverage: s.leverage,
    collateralInput: s.collateralInput,
    setCollateralInput: s.setCollateralInput,
    selectedMarket: s.selectedMarket,
    setArciumStatus: s.setArciumStatus,
    addPosition: s.addPosition,
  }))

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [selectedMarket?.symbol])

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

  const maxCollateral = usdcBalance !== undefined ? Number(usdcBalance) / 1e6 : 0
  const collateralFloat = parseFloat(collateralInput || '0')
  const exceedsBalance = collateralFloat > maxCollateral && maxCollateral > 0

  const limitValid = orderType !== 'limit' || limitPrice > 0
  const stopValid = orderType !== 'stop' || stopPrice > 0
  const tpValid = !tpslEnabled || takeProfit === 0 ||
    (side === 'LONG' ? takeProfit > currentPrice : takeProfit < currentPrice)
  const slValid = !tpslEnabled || stopLoss === 0 ||
    (side === 'LONG' ? stopLoss < currentPrice : stopLoss > currentPrice)

  const isValid = collateralAmount >= 10_000_000n && !exceedsBalance &&
    !!selectedMarket && isConnected && tpValid && slValid && limitValid && stopValid

  const executionPrice = orderType === 'market' ? currentPrice
    : orderType === 'limit' ? limitPrice : stopPrice

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
      addPosition({
        id: commitmentHash,
        marketSymbol: selectedMarket.symbol,
        collateral: collateralAmount,
        openedAt: Math.floor(Date.now() / 1000),
        status: 'OPEN',
        revealedPnl: null,
        commitmentHash,
        txHash: tx,
        privateData: { size: sizeBig, side, leverage, entryPrice: entryPriceBig },
      })
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

  const isLoading = ['approving', 'depositing', 'proving', 'submitting'].includes(step)

  const btnLabel = isLoading
    ? step === 'approving' ? 'Approving USDC...'
      : step === 'depositing' ? 'Depositing...'
      : step === 'proving' ? 'Generating Proof...'
      : 'Submitting...'
    : step === 'done' ? 'Order Placed'
    : step === 'error' ? 'Try Again'
    : orderType === 'market'
      ? (side === 'LONG' ? 'Buy / Long' : 'Sell / Short')
      : orderType === 'limit' ? 'Place Limit Order'
      : 'Place Stop Order'

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">

        {/* 1. Long / Short */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface rounded-lg border border-border">
          <button onClick={() => setSide('LONG')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-display font-600 transition-all duration-150
              ${side === 'LONG' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-400/25' : 'text-dim hover:text-ghost'}`}>
            <TrendingUp size={13} /> Long
          </button>
          <button onClick={() => setSide('SHORT')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-display font-600 transition-all duration-150
              ${side === 'SHORT' ? 'bg-crimson-500/15 text-crimson-400 border border-crimson-400/25' : 'text-dim hover:text-ghost'}`}>
            <TrendingDown size={13} /> Short
          </button>
        </div>

        {/* 2. Order Type */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface rounded-lg border border-border">
          {(['market', 'limit', 'stop'] as OrderType[]).map((t) => (
            <button key={t} onClick={() => setOrderType(t)}
              className={`flex items-center justify-center gap-1 py-2 rounded-md text-xs font-display font-600 transition-all duration-150 capitalize
                ${orderType === t ? 'bg-arcium-500/15 text-arcium-400 border border-arcium-500/25' : 'text-dim hover:text-ghost'}`}>
              {t === 'market' ? <Zap size={11} /> : t === 'limit' ? <Clock size={11} /> : <ChevronDown size={11} />}
              {t}
            </button>
          ))}
        </div>

        {/* 3. Limit Price */}
        {orderType === 'limit' && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs text-dim font-display">Limit Price</label>
              {currentPrice > 0 && (
                <button onClick={() => setLimitPriceInput(currentPrice.toFixed(2))}
                  className="text-[10px] text-dim hover:text-arcium-400 font-mono">
                  Mark: ${formatPrice(currentPrice)}
                </button>
              )}
            </div>
            <div className="relative">
              <input type="number" value={limitPriceInput} onChange={(e) => setLimitPriceInput(e.target.value)}
                placeholder={currentPrice > 0 ? formatPrice(currentPrice) : '0.00'}
                className="input-field pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">USD</span>
            </div>
            {limitPrice > 0 && currentPrice > 0 && (
              <p className={`text-[10px] font-mono ${(side === 'LONG' && limitPrice < currentPrice) || (side === 'SHORT' && limitPrice > currentPrice) ? 'text-emerald-400' : 'text-gold-400'}`}>
                {side === 'LONG' && limitPrice < currentPrice && `Buying ${((currentPrice - limitPrice) / currentPrice * 100).toFixed(2)}% below mark`}
                {side === 'LONG' && limitPrice >= currentPrice && '⚠ At or above mark — fills immediately'}
                {side === 'SHORT' && limitPrice > currentPrice && `Selling ${((limitPrice - currentPrice) / currentPrice * 100).toFixed(2)}% above mark`}
                {side === 'SHORT' && limitPrice <= currentPrice && '⚠ At or below mark — fills immediately'}
              </p>
            )}
          </div>
        )}

        {/* 4. Stop Price */}
        {orderType === 'stop' && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="text-xs text-dim font-display">Stop Price</label>
              {currentPrice > 0 && <span className="text-[10px] text-dim font-mono">Mark: ${formatPrice(currentPrice)}</span>}
            </div>
            <div className="relative">
              <input type="number" value={stopPriceInput} onChange={(e) => setStopPriceInput(e.target.value)}
                placeholder={currentPrice > 0 ? formatPrice(currentPrice) : '0.00'}
                className="input-field pr-12" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">USD</span>
            </div>
            {stopPrice > 0 && currentPrice > 0 && (
              <p className="text-[10px] font-mono text-dim">
                Triggers when price {stopPrice > currentPrice ? 'rises' : 'falls'} to ${formatPrice(stopPrice)}
              </p>
            )}
          </div>
        )}

        {/* 5. Collateral */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-dim font-display">Collateral</label>
            {freeBalance !== undefined && freeBalance > 0n && (
              <button onClick={() => setCollateralInput((Number(freeBalance) / 1e6).toFixed(2))}
                className="text-[10px] text-dim hover:text-arcium-400 font-mono">
                Vault: ${(Number(freeBalance) / 1e6).toFixed(2)}
              </button>
            )}
          </div>
          <div className="relative">
            <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
            <input type="number" value={collateralInput}
              onChange={(e) => setCollateralInput(e.target.value)}
              placeholder="0.00"
              className={`input-field pl-8 ${exceedsBalance ? 'border-crimson-500/60' : ''}`}
              min={10} step={10} />
            {maxCollateral > 0 && (
              <button onClick={() => setCollateralInput(maxCollateral.toFixed(2))}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-[10px] text-dim hover:text-arcium-400 font-mono border-r border-border pr-2">
                MAX
              </button>
            )}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-dim font-mono">USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-dim font-mono">
              Available: {usdcBalance !== undefined
                ? `$${(Number(usdcBalance) / 1e6).toFixed(2)}`
                : isConnected ? 'Loading...' : '—'}
            </span>
            <FaucetButton onSuccess={() => { refetchUsdcBalance(); refetchFreeBalance() }} />
          </div>
          {exceedsBalance && <p className="text-[10px] text-crimson-400 font-mono">⚠ Exceeds available balance of ${maxCollateral.toFixed(2)}</p>}
          {collateralFloat > 0 && collateralFloat < 10 && <p className="text-[10px] text-gold-400 font-mono">Minimum collateral is $10 USDC</p>}
        </div>

        {/* 6. Leverage */}
        <LeverageSlider />

        {/* 7. TP/SL */}
        <div className="space-y-2">
          <button onClick={() => setTpslEnabled(!tpslEnabled)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-md border transition-all text-xs
              ${tpslEnabled ? 'bg-gold-400/10 border-gold-400/20 text-gold-400' : 'bg-surface border-border text-dim hover:text-ghost'}`}>
            <div className="flex items-center gap-1.5">
              <Target size={12} />
              <span className="font-display font-600">Take Profit / Stop Loss</span>
            </div>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tpslEnabled ? 'bg-gold-400/20' : 'bg-muted'}`}>
              {tpslEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {tpslEnabled && (
            <div className="space-y-3 p-3 bg-surface rounded-lg border border-border animate-fade-in">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-dim font-mono flex items-center gap-1">
                    <Target size={10} className="text-emerald-400" />
                    Take Profit
                    <span className="text-subtle">({side === 'LONG' ? 'above' : 'below'} entry)</span>
                  </label>
                  {takeProfit > 0 && tpValid && currentPrice > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400">
                      +{(Math.abs((takeProfit - currentPrice) / currentPrice) * 100 * leverage).toFixed(1)}% ROI
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input type="number" value={takeProfitInput}
                    onChange={(e) => setTakeProfitInput(e.target.value)}
                    placeholder={currentPrice > 0
                      ? `${side === 'LONG' ? '> ' : '< '}$${formatPrice(currentPrice)}`
                      : 'Price in USD'}
                    className={`input-field pr-12 text-xs ${!tpValid ? 'border-crimson-500/50' : ''}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dim font-mono">USD</span>
                </div>
                {!tpValid && (
                  <p className="text-[10px] text-crimson-400 font-mono">
                    {side === 'LONG' ? 'TP must be above entry price' : 'TP must be below entry price'}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-dim font-mono flex items-center gap-1">
                    <ShieldOff size={10} className="text-crimson-400" />
                    Stop Loss
                    <span className="text-subtle">({side === 'LONG' ? 'below' : 'above'} entry)</span>
                  </label>
                  {stopLoss > 0 && slValid && currentPrice > 0 && (
                    <span className="text-[10px] font-mono text-crimson-400">
                      -{(Math.abs((stopLoss - currentPrice) / currentPrice) * 100 * leverage).toFixed(1)}% ROI
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input type="number" value={stopLossInput}
                    onChange={(e) => setStopLossInput(e.target.value)}
                    placeholder={currentPrice > 0
                      ? `${side === 'LONG' ? '< ' : '> '}$${formatPrice(currentPrice)}`
                      : 'Price in USD'}
                    className={`input-field pr-12 text-xs ${!slValid ? 'border-crimson-500/50' : ''}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dim font-mono">USD</span>
                </div>
                {!slValid && (
                  <p className="text-[10px] text-crimson-400 font-mono">
                    {side === 'LONG' ? 'SL must be below entry price' : 'SL must be above entry price'}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-dim font-mono pt-1 border-t border-border">
                🔒 TP/SL encrypted with position via Arcium MXE
              </p>
            </div>
          )}
        </div>

        {/* 8. Position Summary */}
        <div className="space-y-1.5 p-3 bg-surface rounded-lg border border-border text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-dim">Entry Price</span>
            <span className="text-ivory">{currentPrice > 0 ? `$${formatPrice(executionPrice || currentPrice)}` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">🔒 Position Size</span>
            <span className="text-ghost">{collateralFloat > 0 ? `$${(collateralFloat * leverage).toFixed(2)}` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">🔒 Leverage</span>
            <span className="text-ghost">{leverage}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">🔒 Liq. Price (est.)</span>
            <span className="text-ghost">
              {currentPrice > 0 && collateralFloat > 0
                ? `$${formatPrice(side === 'LONG'
                  ? currentPrice * (1 - 0.9 / leverage)
                  : currentPrice * (1 + 0.9 / leverage))}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <span className="text-dim">Collateral</span>
            <span className="text-ivory">{collateralFloat > 0 ? `$${collateralFloat.toFixed(2)}` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dim">Protocol Fee (0.1%)</span>
            <span className="text-ghost">{collateralFloat > 0 ? `$${(collateralFloat * 0.001).toFixed(4)}` : '—'}</span>
          </div>
          <p className="text-[10px] text-dim pt-1 border-t border-border">
            🔒 Locked fields encrypted — only you and Arcium MXE can see them
          </p>
        </div>

        {/* 9. Privacy Status */}
        <ProofStatus compact />

        {/* 10. Submit */}
        <button onClick={handleTrade} disabled={!isValid || isLoading}
          className={`w-full py-3 rounded-lg font-display font-600 text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
            ${side === 'LONG' ? 'bg-emerald-500 hover:bg-emerald-400 text-void' : 'bg-crimson-500 hover:bg-crimson-400 text-white'}
            ${isLoading ? 'opacity-70' : ''}`}>
          {isLoading && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2" />}
          {!isConnected ? 'Connect Wallet' : btnLabel}
        </button>

        {/* 11. Success */}
        {step === 'done' && txHash && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
            <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-emerald-400 font-display font-600">
                {orderType === 'market' ? 'Position opened' : 'Order placed'}
              </p>
              <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-dim font-mono hover:text-ghost truncate block">
                View on BaseScan →
              </a>
            </div>
          </div>
        )}

        {/* 12. Error */}
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
