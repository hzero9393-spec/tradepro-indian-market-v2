'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, Crown, UserCheck, ArrowUpDown, Crosshair,
  BarChart3, FileText, UserCircle, Settings, LogOut, TrendingUp,
  Menu, Bell, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
  AlertDialogAction, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import dynamic from 'next/dynamic'

// ─── Types ───────────────────────────────────────────────────────────────────
type PageKey = 'dashboard' | 'users' | 'paid-users' | 'free-users' | 'trades' | 'positions' | 'analytics' | 'reports' | 'profile' | 'settings'

// ─── Lazy-loaded page components ────────────────────────────────────────────
const DashboardPage = dynamic(() => import('./pages/dashboard-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const UsersPage = dynamic(() => import('./pages/users-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const TradesPage = dynamic(() => import('./pages/trades-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const PositionsPage = dynamic(() => import('./pages/positions-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const AnalyticsPage = dynamic(() => import('./pages/analytics-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const ReportsPage = dynamic(() => import('./pages/reports-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const ProfilePage = dynamic(() => import('./pages/profile-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

const SettingsPage = dynamic(() => import('./pages/settings-page'), {
  ssr: false,
  loading: () => <PageLoadingSkeleton />,
})

// ─── Loading Skeleton ────────────────────────────────────────────────────────
function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 h-28 border border-[#e5e7eb]" />
        ))}
      </div>
      <div className="bg-white rounded-xl h-80 border border-[#e5e7eb]" />
      <div className="bg-white rounded-xl h-40 border border-[#e5e7eb]" />
    </div>
  )
}

// ─── Sidebar Nav Items ───────────────────────────────────────────────────────
const navItems: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'paid-users', label: 'Paid Users', icon: Crown },
  { key: 'free-users', label: 'Free Users', icon: UserCheck },
  { key: 'trades', label: 'Trades / Orders', icon: ArrowUpDown },
  { key: 'positions', label: 'Positions', icon: Crosshair },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'profile', label: 'Admin Profile', icon: UserCircle },
  { key: 'settings', label: 'Settings', icon: Settings },
]

// ═════════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [currentPage, setCurrentPage] = useState<PageKey>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleNavClick = (key: PageKey) => {
    setCurrentPage(key)
    setSidebarOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    onLogout()
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />
      case 'users': return <UsersPage />
      case 'paid-users': return <UsersPage subscriptionFilter="PREMIUM" />
      case 'free-users': return <UsersPage subscriptionFilter="FREE" />
      case 'trades': return <TradesPage />
      case 'positions': return <PositionsPage />
      case 'analytics': return <AnalyticsPage />
      case 'reports': return <ReportsPage />
      case 'profile': return <ProfilePage />
      case 'settings': return <SettingsPage />
      default: return <DashboardPage />
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#e5e7eb]">
        <div className="flex size-9 items-center justify-center rounded-lg bg-[#00D09C]">
          <TrendingUp className="size-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-[#1a1a1a]">TradePro</h1>
          <p className="text-[10px] text-[#6b7280]">Admin Panel</p>
        </div>
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00D09C]/10 text-[#00D09C]'
                    : 'text-[#6b7280] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]'
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-[#e5e7eb]">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-[#d44a2d] hover:bg-[#eb5b3c]/10 transition-colors">
              <LogOut className="size-4" />
              Logout
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to logout from the admin panel?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-[#eb5b3c] hover:bg-[#d44a2d]">Logout</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-60 bg-white border-r border-[#e5e7eb] flex flex-col shrink-0 sticky top-0 h-screen">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-60 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-[#e5e7eb] px-4 lg:px-6 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button variant="ghost" size="icon" className="size-9" onClick={() => setSidebarOpen(true)}>
                  <Menu className="size-5 text-[#6b7280]" />
                </Button>
              )}
              <div>
                <h2 className="text-sm font-semibold text-[#1a1a1a] capitalize">
                  {currentPage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <p className="text-[10px] text-[#6b7280]">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-9 text-[#6b7280] hover:text-[#1a1a1a]">
                <Bell className="size-4" />
              </Button>
              <div className="flex items-center gap-2 pl-2 border-l border-[#e5e7eb]">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-[#00D09C]/10 text-[#00D09C] text-xs font-semibold">A</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-[#1a1a1a]">Admin</p>
                  <p className="text-[10px] text-[#6b7280]">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
