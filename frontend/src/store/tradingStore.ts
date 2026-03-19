import { create } from 'zustand'

export type Side = 'LONG' | 'SHORT'
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED'

export interface Market {
  id: `0x${string}`
  symbol: string
  token: `0x${string}`
  price: number
  priceChange24h: number
  fundingRate: number
  openInterestLong: number
  openInterestShort: number
  maxLeverage: number
}

export interface Position {
  id: `0x${string}`
  marketSymbol: string
  collateral: bigint
  openedAt: number
  status: PositionStatus
  revealedPnl: bigint | null
  commitmentHash: `0x${string}`
  txHash?: `0x${string}`
  privateData?: {
    size: bigint
    side: Side
    leverage: number
    entryPrice: bigint
  }
}

interface TradingStore {
  markets: Market[]
  selectedMarket: Market | null
  setMarkets: (markets: Market[]) => void
  setSelectedMarket: (market: Market) => void
  positions: Position[]
  setPositions: (positions: Position[]) => void
  addPosition: (position: Position) => void
  updatePosition: (id: `0x${string}`, update: Partial<Position>) => void
  side: Side
  leverage: number
  collateralInput: string
  setSide: (side: Side) => void
  setLeverage: (leverage: number) => void
  setCollateralInput: (value: string) => void
  isSubmitting: boolean
  setIsSubmitting: (v: boolean) => void
  arciumStatus: 'idle' | 'encrypting' | 'proving' | 'ready' | 'error'
  setArciumStatus: (status: TradingStore['arciumStatus']) => void
}

export const useTradingStore = create<TradingStore>((set) => ({
  markets: [],
  selectedMarket: null,
  setMarkets: (markets) => set({ markets }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  positions: [],
  setPositions: (positions) => set({ positions }),
  addPosition: (position) => set((state) => ({ positions: [position, ...state.positions] })),
  updatePosition: (id, update) => set((state) => ({
    positions: state.positions.map((p) => p.id === id ? { ...p, ...update } : p),
  })),
  side: 'LONG',
  leverage: 5,
  collateralInput: '',
  setSide: (side) => set({ side }),
  setLeverage: (leverage) => set({ leverage }),
  setCollateralInput: (collateralInput) => set({ collateralInput }),
  isSubmitting: false,
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  arciumStatus: 'idle',
  setArciumStatus: (arciumStatus) => set({ arciumStatus }),
}))

export const selectOpenPositions = (state: TradingStore) =>
  state.positions.filter((p) => p.status === 'OPEN')

export const selectClosedPositions = (state: TradingStore) =>
  state.positions.filter((p) => p.status === 'CLOSED' || p.status === 'LIQUIDATED')

export const selectTotalUnrealizedPnl = (state: TradingStore) =>
  state.positions
    .filter((p) => p.status === 'OPEN' && p.revealedPnl !== null)
    .reduce((acc, p) => acc + (p.revealedPnl ?? 0n), 0n)
