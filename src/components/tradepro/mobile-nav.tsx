'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  BarChart3,
  Wallet,
  User,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'trading', label: 'Trade', icon: CandlestickChart },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'portfolio', label: 'Wallet', icon: Wallet },
  { id: 'settings', label: 'Profile', icon: User },
]

export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 w-full items-center justify-around border-t border-tp-outline-variant/50 bg-tp-surface/90 backdrop-blur-[20px] px-2 safe-area-bottom">
        {mobileNavItems.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 rounded-lg',
                isActive
                  ? 'text-primary'
                  : 'text-tp-outline hover:text-tp-on-surface-variant'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary/10 p-1.5' : 'p-1.5'
                )}
              >
                <Icon
                  className={cn(
                    'size-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight',
                  isActive && 'font-bold'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
