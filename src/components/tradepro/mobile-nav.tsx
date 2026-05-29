'use client'

import {
  Home,
  CandlestickChart,
  Star,
  Crosshair,
  UserCircle,
} from 'lucide-react'
import { useAppStore, type PageId } from '@/lib/store'

interface MobileNavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mobileNavItems: MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'trading', label: 'Stock', icon: CandlestickChart },
  { id: 'watchlist', label: 'Watchlist', icon: Star },
  { id: 'positions', label: 'Position', icon: Crosshair },
  { id: 'profile', label: 'My Profile', icon: UserCircle },
]

export function MobileNav() {
  const { setCurrentPage, currentPage } = useAppStore()

  const isActive = (item: MobileNavItem) => {
    if (item.id === 'dashboard') return currentPage === 'dashboard'
    if (item.id === 'trading' && currentPage === 'stockOverview') return true
    if (item.id === 'profile' && currentPage === 'profile') return true
    if (item.id === 'positions' && currentPage === 'positions') return true
    return currentPage === item.id
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div
        className="flex h-[60px] w-full items-center justify-around px-2"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e8ecf0',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06)',
        }}
      >
        {mobileNavItems.map((item) => {
          const active = isActive(item)
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 outline-none rounded-xl transition-all duration-200"
              style={{
                background: active ? 'rgba(0, 208, 156, 0.08)' : 'transparent',
                minWidth: '52px',
              }}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
            >
              <div
                className="flex size-7 items-center justify-center rounded-lg transition-all duration-200"
                style={{
                  background: active ? 'rgba(0, 208, 156, 0.15)' : 'transparent',
                }}
              >
                <Icon
                  className="size-[18px] transition-colors duration-200"
                  style={{ color: active ? '#00D09C' : '#9ca3af' }}
                />
              </div>
              <span
                className="text-[9px] leading-tight transition-colors duration-200 whitespace-nowrap"
                style={{
                  color: active ? '#00A67E' : '#9ca3af',
                  fontWeight: active ? 700 : 500,
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
