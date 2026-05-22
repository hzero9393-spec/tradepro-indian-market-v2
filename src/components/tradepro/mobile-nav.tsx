'use client'

import {
  Home,
  CandlestickChart,
  Crosshair,
  FileText,
  Wallet,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'

interface MobileNavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
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
        className="flex h-14 w-full items-center justify-around px-2"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #f0f0f0',
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
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 outline-none rounded-lg transition-colors"
              style={{
                background: isActive ? 'rgba(0, 208, 156, 0.08)' : 'transparent',
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon
                className="size-5 transition-colors"
                style={{ color: isActive ? '#00D09C' : '#9ca3af' }}
              />
              <span
                className="text-[10px] leading-tight transition-colors"
                style={{
                  color: isActive ? '#00D09C' : '#9ca3af',
                  fontWeight: isActive ? 600 : 500,
                }}
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
