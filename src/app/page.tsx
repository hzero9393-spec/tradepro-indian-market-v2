'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { AuthPage } from '@/components/tradepro/auth-page'
import { Sidebar } from '@/components/tradepro/sidebar'
import { TopBar } from '@/components/tradepro/topbar'
import { MobileNav } from '@/components/tradepro/mobile-nav'
import { DashboardPage } from '@/components/tradepro/pages/dashboard-page'
import { TradingPage } from '@/components/tradepro/pages/trading-page'
import PortfolioPage from '@/components/tradepro/pages/portfolio-page'
import { OrdersPage } from '@/components/tradepro/pages/orders-page'
import AnalyticsPage from '@/components/tradepro/pages/analytics-page'
import { SettingsPage } from '@/components/tradepro/pages/settings-page'
import { ChallengesPage } from '@/components/tradepro/pages/challenges-page'
import { LeaderboardPage } from '@/components/tradepro/pages/leaderboard-page'
import { LearningPage } from '@/components/tradepro/pages/learning-page'
import { AdminPage } from '@/components/tradepro/pages/admin-page'
import { OptionChainPage } from '@/components/tradepro/pages/option-chain-page'
import { FuturesPage } from '@/components/tradepro/pages/futures-page'
import { IndexTicker } from '@/components/tradepro/index-ticker'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TrendingUp } from 'lucide-react'

function PageContent({ page }: { page: string }) {
  switch (page) {
    case 'dashboard':
      return <DashboardPage />
    case 'trading':
      return <TradingPage />
    case 'portfolio':
      return <PortfolioPage />
    case 'orders':
      return <OrdersPage />
    case 'analytics':
      return <AnalyticsPage />
    case 'optionChain':
      return <OptionChainPage />
    case 'futures':
      return <FuturesPage />
    case 'challenges':
      return <ChallengesPage />
    case 'leaderboard':
      return <LeaderboardPage />
    case 'learning':
      return <LearningPage />
    case 'settings':
      return <SettingsPage />
    case 'admin':
      return <AdminPage />
    default:
      return <DashboardPage />
  }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-tp-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground animate-pulse">
          <TrendingUp className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-tp-on-surface">TradePro</h2>
          <p className="text-sm text-tp-on-surface-variant mt-1">Loading your trading desk...</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { currentPage, sidebarOpen, setSidebarOpen } = useAppStore()
  const { isAuthenticated, isInitializing, initialize, logout, user, token } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Show loading while checking auth
  if (isInitializing) {
    return <LoadingScreen />
  }

  // Show auth page if not logged in
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // Ignore logout API errors
    }
    logout()
  }

  return (
    <div className="flex min-h-screen flex-col bg-tp-surface">
      {/* Desktop Sidebar */}
      <Sidebar onLogout={handleLogout} userName={user?.name} userEmail={user?.email} userRole={user?.role} />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <Sidebar onLogout={handleLogout} userName={user?.name} userEmail={user?.email} userRole={user?.role} />
        </SheetContent>
      </Sheet>

      {/* Top Bar */}
      <TopBar userName={user?.name} onLogout={handleLogout} />

      {/* Indian Market Index Ticker */}
      <IndexTicker />

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] pt-24 pb-20 md:pb-0">
        <PageContent page={currentPage} />

        {/* Sticky Footer */}
        <footer className="border-t border-tp-outline-variant/30 bg-tp-surface/90 backdrop-blur-sm px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <TrendingUp className="size-3.5" />
              </div>
              <span className="text-sm font-semibold text-tp-on-surface">TradePro</span>
              <span className="text-xs text-tp-on-surface-variant">© 2025</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-tp-on-surface-variant">
              <span className="hover:text-tp-on-surface cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-tp-on-surface cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-tp-on-surface cursor-pointer transition-colors">Contact Support</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  )
}
