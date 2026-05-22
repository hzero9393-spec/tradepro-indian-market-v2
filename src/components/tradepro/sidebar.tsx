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
  Settings,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: 'trade' | 'manage' | 'learn'
}

const navItems: NavItem[] = [
  // Trade group
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, group: 'trade' },
  { id: 'trading', label: 'Stocks', icon: CandlestickChart, group: 'trade' },
  { id: 'optionChain', label: 'Option Chain', icon: GitBranch, group: 'trade' },
  { id: 'futures', label: 'Futures', icon: TrendingUp, group: 'trade' },
  // Manage group
  { id: 'positions', label: 'Positions', icon: Crosshair, group: 'manage' },
  { id: 'orders', label: 'Orders', icon: FileText, group: 'manage' },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet, group: 'manage' },
  { id: 'reports', label: 'Reports', icon: BarChart3, group: 'manage' },
  // Learn group
  { id: 'learning', label: 'Learn', icon: GraduationCap, group: 'learn' },
]

const groupLabels: Record<string, string> = {
  trade: 'Trade',
  manage: 'Manage',
  learn: 'Learn',
}

interface SidebarProps {
  onLogout?: () => void
  userName?: string | null
  userEmail?: string | null
  userRole?: string | null
}

export function Sidebar({ onLogout, userName }: SidebarProps) {
  const { currentPage, setCurrentPage } = useAppStore()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  // Group items
  const grouped = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[220px] flex-col md:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="flex h-full flex-col"
        style={{
          background: '#ffffff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        {/* Logo Area - Groww style minimal */}
        <div className="flex items-center gap-2.5 px-5 py-4">
          <div
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ background: '#00D09C' }}
          >
            <TrendingUp className="size-4 text-white" />
          </div>
          <div>
            <h1
              className="text-sm font-bold tracking-tight"
              style={{ color: '#1a1a1a' }}
            >
              TradePro
            </h1>
            <p
              className="text-[9px] font-medium tracking-wide uppercase"
              style={{ color: '#9ca3af' }}
            >
              Paper Trading
            </p>
          </div>
        </div>

        {/* User quick info */}
        {userName && (
          <div className="px-4 pb-3">
            <button
              onClick={() => setCurrentPage('profile')}
              className="flex w-full items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-[#f5f5f5]"
            >
              <div
                className="flex size-7 items-center justify-center rounded-full text-[10px] font-bold shrink-0"
                style={{ background: '#00D09C', color: '#ffffff' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs font-semibold truncate" style={{ color: '#1a1a1a' }}>
                  {userName}
                </p>
                <p className="text-[10px] truncate" style={{ color: '#9ca3af' }}>
                  Paper Trading
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Thin separator */}
        <div className="mx-4 h-px" style={{ background: '#f0f0f0' }} />

        {/* Navigation - Grouped like Groww */}
        <ScrollArea className="flex-1 px-3 py-3 sidebar-scrollbar">
          <nav className="flex flex-col gap-4">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  {groupLabels[group] || group}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const isActive = currentPage === item.id
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        className={cn(
                          'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all outline-none',
                          'focus-visible:ring-2 focus-visible:ring-[#00D09C]/20',
                        )}
                        style={{
                          background: isActive ? 'rgba(0, 208, 156, 0.08)' : 'transparent',
                          color: isActive ? '#00D09C' : '#4a4a4a',
                        }}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          className="size-4 shrink-0"
                          style={{ color: isActive ? '#00D09C' : '#9ca3af' }}
                        />
                        <span className={cn(isActive && 'font-semibold')}>
                          {item.label}
                        </span>
                        {isActive && (
                          <div
                            className="ml-auto h-1.5 w-1.5 rounded-full"
                            style={{ background: '#00D09C' }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid #f0f0f0' }}>
          <button
            onClick={() => setCurrentPage('profile')}
            className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all outline-none w-full hover:bg-[#f5f5f5]"
            style={{
              color: currentPage === 'profile' ? '#00D09C' : '#4a4a4a',
            }}
          >
            <Settings
              className="size-4 shrink-0"
              style={{ color: currentPage === 'profile' ? '#00D09C' : '#9ca3af' }}
            />
            <span>Settings</span>
          </button>

          <button
            onClick={onLogout}
            className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all outline-none w-full hover:bg-[#fef2f2]"
            style={{ color: '#4a4a4a' }}
          >
            <LogOut className="size-4 shrink-0 group-hover:text-[#eb5b3c]" />
            <span className="group-hover:text-[#eb5b3c]">Sign Out</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .sidebar-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </aside>
  )
}
