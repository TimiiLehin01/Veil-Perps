import { useWriteContract, useAccount } from 'wagmi'
import { CONTRACTS, MOCK_USDC_ABI } from '@/lib/contracts'
import { useState } from 'react'
import { Droplets } from 'lucide-react'

export function FaucetButton({ onSuccess }: { onSuccess?: () => void }) {
  const { isConnected } = useAccount()
  const [done, setDone] = useState(false)
  const { writeContractAsync, isPending } = useWriteContract()

  const handleFaucet = async () => {
    try {
      await writeContractAsync({
        address: CONTRACTS.baseSepolia.mockUSDC,
        abi: MOCK_USDC_ABI,
        functionName: 'faucet',
      })
      setDone(true)
      onSuccess?.()
      setTimeout(() => setDone(false), 5000)
    } catch (err: any) {
      console.error(err)
    }
  }

  if (!isConnected) return null

  return (
    <button
      onClick={handleFaucet}
      disabled={isPending || done}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-mono transition-all duration-150
        ${done
          ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
          : 'bg-arcium-500/10 border-arcium-500/20 text-arcium-400 hover:bg-arcium-500/20'
        }
        disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {isPending ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Droplets size={11} />
      )}
      {done ? 'Got 10,000 USDC!' : isPending ? 'Claiming...' : 'Get Test USDC'}
    </button>
  )
}
