'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  Wallet,
  FileText,
  BarChart3,
  GitBranch,
  TrendingUp as TrendingUpIcon,
  Trophy,
  Medal,
  GraduationCap,
  HelpCircle,
  ShieldCheck,
  LogOut,
  TrendingUp,
  Settings,
  Crown,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trading', label: 'Trading', icon: CandlestickChart },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'optionChain', label: 'Option Chain', icon: GitBranch },
  { id: 'futures', label: 'Futures', icon: TrendingUpIcon },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'leaderboard', label: 'Leaderboard', icon: Medal },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
]

const bottomNavItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

interface SidebarProps {
  onLogout?: () => void
  userName?: string | null
  userEmail?: string | null
  userRole?: string | null
}

export function Sidebar({ onLogout, userName, userEmail, userRole }: SidebarProps) {
  const { currentPage, setCurrentPage } = useAppStore()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  const subscriptionLabel = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
    ? 'Admin'
    : 'Free Account'

  return (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col md:flex"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Glass card background */}
      <div className="glass-card flex h-full flex-col shadow-lg border-r border-tp-outline-variant/50">
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-tp-on-surface">
              TradePro
            </h1>
            <p className="text-[11px] font-medium tracking-wider text-tp-outline uppercase">
              Institutional Grade
            </p>
          </div>
        </div>

        <Separator className="mx-4 w-auto" />

        {/* User Profile Card */}
        {userName && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 rounded-xl bg-tp-surface-container-low p-3">
              <Avatar className="size-9 border border-tp-outline-variant/50">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-tp-on-surface truncate">
                  {userName}
                </p>
                <div className="flex items-center gap-1.5">
                  <Crown className="size-3 text-tp-outline" />
                  <p className="text-[11px] text-tp-outline">
                    {subscriptionLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-2 custom-scrollbar">
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                    'hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-tp-on-surface-variant hover:text-tp-on-surface'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'size-5 transition-transform duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-primary'
                        : 'text-tp-outline group-hover:text-tp-on-surface'
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="mt-auto border-t border-tp-outline-variant/50 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {bottomNavItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                    'hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/30',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-tp-on-surface-variant hover:text-tp-on-surface'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={cn(
                      'size-5 transition-transform duration-200 group-hover:scale-110',
                      isActive
                        ? 'text-primary'
                        : 'text-tp-outline group-hover:text-tp-on-surface'
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              )
            })}

            <Separator className="my-2" />

            <button
              onClick={onLogout}
              className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-tp-on-surface-variant transition-all duration-200 hover:bg-destructive/5 hover:text-destructive outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
            >
              <LogOut className="size-5 transition-transform duration-200 group-hover:scale-110" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  )
}
