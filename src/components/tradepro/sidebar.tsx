'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  Crosshair,
  FileText,
  Wallet,
  BarChart3,
  GraduationCap,
  User,
  LogOut,
  TrendingUp,
  GitBranch,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Stocks', icon: CandlestickChart },
  { id: 'positions', label: 'Positions', icon: Crosshair },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'optionChain', label: 'Option Chain', icon: GitBranch },
  { id: 'futures', label: 'Futures', icon: TrendingUp },
  { id: 'learning', label: 'Learn', icon: GraduationCap },
]

interface SidebarProps {
  onLogout?: () => void
  userName?: string | null
  userEmail?: string | null
  userRole?: string | null
}

export function Sidebar({ onLogout, userName, userEmail }: SidebarProps) {
  const { currentPage, setCurrentPage } = useAppStore()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] flex-col md:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="flex h-full flex-col border-r"
        style={{
          background: '#ffffff',
          borderColor: '#e5e7eb',
        }}
      >
        {/* Branding Area */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div
            className="flex size-9 items-center justify-center rounded-lg"
            style={{
              background: '#5367ff',
            }}
          >
            <TrendingUp className="size-[18px] text-white" />
          </div>
          <div>
            <h1
              className="text-[15px] font-bold tracking-tight"
              style={{ color: '#111827' }}
            >
              TradePro
            </h1>
            <p
              className="text-[10px] font-medium tracking-wide uppercase"
              style={{ color: '#9ca3af' }}
            >
              Indian Market Platform
            </p>
          </div>
        </div>

        {/* User Profile Card */}
        {userName && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setCurrentPage('profile')}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 transition-colors duration-150 hover:bg-[#f3f4f6]"
              style={{ background: '#f9fafb' }}
            >
              <Avatar className="size-8">
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    background: '#5367ff',
                    color: '#ffffff',
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-[#111827] truncate">
                  {userName}
                </p>
                <p className="text-[11px] truncate" style={{ color: '#9ca3af' }}>
                  {userEmail || 'Paper Trading'}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 h-px" style={{ background: '#e5e7eb' }} />

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-2 sidebar-scrollbar">
          <nav className="flex flex-col gap-0.5">
            {mainNavItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 outline-none',
                    'focus-visible:ring-2 focus-visible:ring-[#5367ff]/20',
                  )}
                  style={{
                    background: isActive ? '#eef0ff' : 'transparent',
                    color: isActive ? '#5367ff' : '#6b7280',
                    borderLeft: isActive ? '3px solid #5367ff' : '3px solid transparent',
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className="size-[18px] shrink-0 transition-colors duration-150"
                    style={{ color: isActive ? '#5367ff' : '#9ca3af' }}
                  />
                  <span className={cn(isActive && 'font-semibold')}>
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Section - Separator */}
        <div className="px-4 py-2">
          <div className="h-px" style={{ background: '#e5e7eb' }} />
        </div>

        {/* Bottom Navigation */}
        <div className="px-3 pb-4">
          <nav className="flex flex-col gap-0.5">
            {/* Profile */}
            <button
              onClick={() => setCurrentPage('profile')}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 outline-none',
                'focus-visible:ring-2 focus-visible:ring-[#5367ff]/20',
              )}
              style={{
                background: currentPage === 'profile' ? '#eef0ff' : 'transparent',
                color: currentPage === 'profile' ? '#5367ff' : '#6b7280',
                borderLeft: currentPage === 'profile' ? '3px solid #5367ff' : '3px solid transparent',
              }}
              aria-current={currentPage === 'profile' ? 'page' : undefined}
            >
              <User
                className="size-[18px] shrink-0 transition-colors duration-150"
                style={{ color: currentPage === 'profile' ? '#5367ff' : '#9ca3af' }}
              />
              <span className={cn(currentPage === 'profile' && 'font-semibold')}>
                Profile
              </span>
            </button>

            {/* Sign Out */}
            <button
              onClick={onLogout}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 outline-none hover:bg-[#fef2f2] focus-visible:ring-2 focus-visible:ring-[#eb5b3c]/20"
              style={{ color: '#6b7280', borderLeft: '3px solid transparent' }}
            >
              <LogOut className="size-[18px] shrink-0 transition-colors duration-150 group-hover:text-[#eb5b3c]" />
              <span className="transition-colors duration-150 group-hover:text-[#eb5b3c]">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>

      <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </aside>
  )
}
