import { useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { useTradingStore } from '@/store/tradingStore'
import { CONTRACTS, POSITION_MANAGER_ABI } from '@/lib/contracts'

export function useLoadPositions() {
  const { address } = useAccount()
  const { setPositions, selectedMarket } = useTradingStore((s) => ({
    setPositions: s.setPositions,
    selectedMarket: s.selectedMarket,
  }))

  const { data: positionIds } = useReadContract({
    address: CONTRACTS.baseSepolia.positionManager,
    abi: POSITION_MANAGER_ABI,
    functionName: 'getTraderPositions',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 15_000 },
  })

  useEffect(() => {
    if (!positionIds || !Array.isArray(positionIds)) return

    const existing = useTradingStore.getState().positions
    const existingIds = new Set(existing.map(p => p.id))

    const newPositions = (positionIds as `0x${string}`[])
      .filter(id => !existingIds.has(id))
      .map(id => ({
        id,
        marketSymbol: selectedMarket?.symbol ?? 'ETH',
        collateral: 0n,
        openedAt: Math.floor(Date.now() / 1000),
        status: 'OPEN' as const,
        revealedPnl: null,
        commitmentHash: id,
      }))

    if (newPositions.length > 0) {
      setPositions([...existing, ...newPositions])
    }
  }, [positionIds])
}
