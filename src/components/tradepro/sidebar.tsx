'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  Crosshair,
  FileText,
  Wallet,
  BarChart3,
  GraduationCap,
  LogOut,
  TrendingUp,
  GitBranch,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: 'trade' | 'manage' | 'learn'
  url: string
}

const navItems: NavItem[] = [
  // Trade group
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, group: 'trade', url: '/' },
  { id: 'trading', label: 'Stocks', icon: CandlestickChart, group: 'trade', url: '/stocks' },
  { id: 'optionChain', label: 'Option Chain', icon: GitBranch, group: 'trade', url: '/option-chain' },
  { id: 'futures', label: 'Futures', icon: TrendingUp, group: 'trade', url: '/futures' },
  // Manage group
  { id: 'positions', label: 'Positions', icon: Crosshair, group: 'manage', url: '/positions' },
  { id: 'orders', label: 'Orders', icon: FileText, group: 'manage', url: '/orders' },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet, group: 'manage', url: '/portfolio' },
  { id: 'reports', label: 'Reports', icon: BarChart3, group: 'manage', url: '/reports' },
  // Learn group
  { id: 'learning', label: 'Learn', icon: GraduationCap, group: 'learn', url: '/learning' },
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
  userAvatar?: string | null
}

export function Sidebar({ onLogout, userName, userAvatar }: SidebarProps) {
  const { setCurrentPage, currentPage } = useAppStore()

  const avatar = userAvatar
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  // Determine if a nav item is active based on currentPage state
  const isActive = (item: NavItem) => {
    if (item.id === 'dashboard') {
      return currentPage === 'dashboard'
    }
    if (item.id === 'trading' && (currentPage === 'stockOverview')) {
      return true
    }
    if (item.id === 'optionChain' && currentPage === 'optionChain') {
      return true
    }
    return currentPage === item.id
  }

  // Group items
  const grouped = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  const isProfileActive = currentPage === 'profile'

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] flex-col md:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      <div
        className="flex h-full flex-col"
        style={{
          background: '#ffffff',
          borderRight: '1px solid #e8ecf0',
        }}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-6 py-5">
          <button onClick={() => setCurrentPage('dashboard')} className="flex items-center gap-3 group">
            <div
              className="flex size-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #00D09C 0%, #00A67E 100%)',
                boxShadow: '0 2px 8px rgba(0, 208, 156, 0.25)',
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
                className="text-[9px] font-semibold tracking-widest uppercase"
                style={{ color: '#9ca3af' }}
              >
                Paper Trading
              </p>
            </div>
          </button>
        </div>

        {/* Separator */}
        <div className="mx-5 h-px" style={{ background: '#e8ecf0' }} />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4 sidebar-scrollbar">
          <nav className="flex flex-col gap-5">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p
                  className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: '#b0b8c4' }}
                >
                  {groupLabels[group] || group}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const active = isActive(item)
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 outline-none',
                          'focus-visible:ring-2 focus-visible:ring-[#00D09C]/20',
                          !active && 'hover:bg-[#f4f6f8]',
                        )}
                        style={{
                          background: active ? 'linear-gradient(135deg, rgba(0,208,156,0.1) 0%, rgba(0,166,126,0.06) 100%)' : 'transparent',
                          color: active ? '#00A67E' : '#4b5563',
                        }}
                        aria-current={active ? 'page' : undefined}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                            style={{
                              background: 'linear-gradient(180deg, #00D09C, #00A67E)',
                            }}
                          />
                        )}

                        <div
                          className={cn(
                            'flex size-8 items-center justify-center rounded-lg transition-all duration-200',
                            active ? 'bg-[#00D09C]/10' : 'group-hover:bg-[#e8ecf0]',
                          )}
                        >
                          <Icon
                            className="size-[16px] shrink-0 transition-colors duration-200"
                            style={{ color: active ? '#00D09C' : '#9ca3af' }}
                          />
                        </div>

                        <span className={cn('transition-colors duration-200', active && 'font-semibold')}>
                          {item.label}
                        </span>

                        {!active && item.id !== 'pricing' && (
                          <ChevronRight className="ml-auto size-3 text-transparent group-hover:text-[#b0b8c4] transition-colors duration-200" />
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
        <div className="px-3 py-3" style={{ borderTop: '1px solid #e8ecf0' }}>
          <button
            onClick={() => setCurrentPage('profile')}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 outline-none w-full',
              !isProfileActive && 'hover:bg-[#f4f6f8]',
              'focus-visible:ring-2 focus-visible:ring-[#00D09C]/20',
            )}
            style={{
              background: isProfileActive ? 'linear-gradient(135deg, rgba(0,208,156,0.1) 0%, rgba(0,166,126,0.06) 100%)' : 'transparent',
              color: isProfileActive ? '#00A67E' : '#4b5563',
            }}
          >
            {isProfileActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                style={{ background: 'linear-gradient(180deg, #00D09C, #00A67E)' }}
              />
            )}
            <div className={cn(
              'flex size-8 items-center justify-center rounded-lg overflow-hidden transition-all duration-200',
              isProfileActive ? 'bg-[#00D09C]/10' : 'group-hover:bg-[#e8ecf0]',
            )}>
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Settings className="size-[16px] shrink-0" style={{ color: isProfileActive ? '#00D09C' : '#9ca3af' }} />
              )}
            </div>
            <span className={isProfileActive ? 'font-semibold' : ''}>Settings</span>
            <ChevronRight className="ml-auto size-3 text-transparent group-hover:text-[#b0b8c4] transition-colors duration-200" />
          </button>

          <button
            onClick={onLogout}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 outline-none w-full hover:bg-red-50/80"
            style={{ color: '#4b5563' }}
          >
            <div className="flex size-8 items-center justify-center rounded-lg transition-all duration-200 group-hover:bg-red-100/80">
              <LogOut className="size-[16px] shrink-0 text-[#9ca3af] group-hover:text-[#ef4444] transition-colors duration-200" />
            </div>
            <span className="group-hover:text-[#ef4444] transition-colors duration-200">Sign Out</span>
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
