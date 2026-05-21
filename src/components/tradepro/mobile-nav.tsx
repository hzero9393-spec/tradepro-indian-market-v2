'use client'

import {
  LayoutDashboard,
  CandlestickChart,
  Crosshair,
  FileText,
  Wallet,
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
  { id: 'trading', label: 'Stocks', icon: CandlestickChart },
  { id: 'positions', label: 'Positions', icon: Crosshair },
  { id: 'orders', label: 'Orders', icon: FileText },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet },
]

export function MobileNav() {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div
        className="flex h-14 w-full items-center justify-around px-1"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {mobileNavItems.map((item) => {
          const isActive = currentPage === item.id
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 outline-none rounded-lg',
                'transition-colors duration-150',
                'focus-visible:ring-2 focus-visible:ring-[#5367ff]/20',
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon
                className="size-5 transition-colors duration-150"
                style={{ color: isActive ? '#5367ff' : '#9ca3af' }}
              />
              {/* Active dot indicator */}
              {isActive && (
                <div
                  className="h-1 w-1 rounded-full"
                  style={{ background: '#5367ff' }}
                />
              )}
              <span
                className={cn(
                  'text-[10px] leading-tight transition-colors duration-150',
                  isActive ? 'font-semibold' : 'font-medium',
                )}
                style={{ color: isActive ? '#5367ff' : '#9ca3af' }}
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
