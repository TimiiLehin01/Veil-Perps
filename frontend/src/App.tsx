import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { wagmiConfig } from '@/lib/wagmi.config'
import { Navbar } from '@/components/Layout/Navbar'
import { MobileNav } from '@/components/Layout/MobileNav'
import { TradePage } from '@/pages/Trade'
import { PortfolioPage } from '@/pages/Portfolio'
import { MarketsPage } from '@/pages/Markets'

const queryClient = new QueryClient()

const rainbowTheme = darkTheme({
  accentColor: '#8B5CF6',
  accentColorForeground: 'white',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
})

export default function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowTheme} modalSize="compact">
          <BrowserRouter>
            <div className="min-h-screen bg-void text-ivory overflow-x-hidden pb-16 md:pb-0">
              <Navbar />
              <MobileNav />
              <Routes>
                <Route path="/" element={<Navigate to="/trade" replace />} />
                <Route path="/trade" element={<TradePage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/markets" element={<MarketsPage />} />
              </Routes>
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
