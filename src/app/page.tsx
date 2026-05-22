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
import { PositionsPage } from '@/components/tradepro/pages/positions-page'
import { ReportsPage } from '@/components/tradepro/pages/reports-page'
import { ProfilePage } from '@/components/tradepro/pages/profile-page'
import { OptionChainPage } from '@/components/tradepro/pages/option-chain-page'
import { FuturesPage } from '@/components/tradepro/pages/futures-page'
import { LearningPage } from '@/components/tradepro/pages/learning-page'
import { IndexTicker } from '@/components/tradepro/index-ticker'
import { TradeSuccessProvider } from '@/components/tradepro/trade-success-popup'
import { Footer } from '@/components/tradepro/footer'
import {
  PrivacyPolicyPage,
  TermsOfServicePage,
  SupportPage,
  ContactUsPage,
  FAQPage,
  DisclaimerPage,
  AboutUsPage,
  RefundPolicyPage,
} from '@/components/tradepro/footer-pages'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TrendingUp } from 'lucide-react'

// Footer page IDs — these pages show their own footer-free layout
const FOOTER_PAGES = new Set([
  'privacy-policy',
  'terms-of-service',
  'support',
  'contact-us',
  'faq',
  'disclaimer',
  'about-us',
  'refund-policy',
])

function PageContent({ page }: { page: string }) {
  switch (page) {
    case 'dashboard':
      return <DashboardPage />
    case 'trading':
      return <TradingPage />
    case 'positions':
      return <PositionsPage />
    case 'orders':
      return <OrdersPage />
    case 'portfolio':
      return <PortfolioPage />
    case 'reports':
      return <ReportsPage />
    case 'optionChain':
      return <OptionChainPage />
    case 'futures':
      return <FuturesPage />
    case 'learning':
      return <LearningPage />
    case 'profile':
      return <ProfilePage />
    // Footer pages
    case 'privacy-policy':
      return <PrivacyPolicyPage />
    case 'terms-of-service':
      return <TermsOfServicePage />
    case 'support':
      return <SupportPage />
    case 'contact-us':
      return <ContactUsPage />
    case 'faq':
      return <FAQPage />
    case 'disclaimer':
      return <DisclaimerPage />
    case 'about-us':
      return <AboutUsPage />
    case 'refund-policy':
      return <RefundPolicyPage />
    default:
      return <DashboardPage />
  }
}

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#f5f7fa' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex size-14 items-center justify-center rounded-2xl animate-pulse"
          style={{
            background: '#00D09C',
            color: '#ffffff',
          }}
        >
          <TrendingUp className="size-7" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold" style={{ color: '#1a1a1a' }}>TradePro</h2>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Loading your trading desk...
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          <div
            className="size-2 rounded-full animate-bounce"
            style={{ background: '#00D09C', animationDelay: '0ms' }}
          />
          <div
            className="size-2 rounded-full animate-bounce"
            style={{ background: '#00D09C', animationDelay: '150ms' }}
          />
          <div
            className="size-2 rounded-full animate-bounce"
            style={{ background: '#00D09C', animationDelay: '300ms' }}
          />
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

  const isFooterPage = FOOTER_PAGES.has(currentPage)

  return (
    <TradeSuccessProvider>
      <div className="flex min-h-screen flex-col" style={{ background: '#f5f7fa' }}>
        {/* Desktop Sidebar */}
        <Sidebar onLogout={handleLogout} userName={user?.name} userEmail={user?.email} userRole={user?.role} />

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[220px] p-0"
            style={{ background: '#ffffff', borderRight: '1px solid #e5e7eb' }}
          >
            <Sidebar onLogout={handleLogout} userName={user?.name} userEmail={user?.email} userRole={user?.role} />
          </SheetContent>
        </Sheet>

        {/* Top Bar */}
        <TopBar userName={user?.name} onLogout={handleLogout} />

        {/* Indian Market Index Ticker */}
        {!isFooterPage && <IndexTicker />}

        {/* Main Content */}
        <main className="flex-1 md:ml-[220px] mt-14 pb-16 md:pb-0">
          <PageContent page={currentPage} />

          {/* Footer */}
          <Footer />
        </main>

        {/* Mobile Bottom Nav */}
        {!isFooterPage && <MobileNav />}
      </div>
    </TradeSuccessProvider>
  )
}
