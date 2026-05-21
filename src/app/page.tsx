'use client'

import { useAppStore } from '@/lib/store'
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
    case 'challenges':
      return <ChallengesPage />
    case 'leaderboard':
      return <LeaderboardPage />
    case 'learning':
      return <LearningPage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

export default function Home() {
  const { currentPage, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <div className="flex min-h-screen flex-col bg-tp-surface">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] pt-16 pb-20 md:pb-0">
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
