'use client'

import { Menu, Search, Bell, LogOut, ChevronDown, User, FileBarChart, TrendingUp } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  userName?: string | null
  onLogout?: () => void
}

export function TopBar({ userName, onLogout }: TopBarProps) {
  const { setSidebarOpen, setCurrentPage } = useAppStore()
  const { user } = useAuthStore()

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  const balance = user?.virtualBalance ?? 100000
  const totalPnl = user?.totalPnl ?? 0
  const isProfit = totalPnl >= 0

  const formatINR = (value: number) =>
    value.toLocaleString('en-IN', { maximumFractionDigits: 0 })

  return (
    <header
      className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
      }}
      role="banner"
    >
      <div className="flex h-full w-full items-center gap-3 px-4 md:px-6">
        {/* Left: Mobile menu + Logo */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 text-[#4a4a4a] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] h-9 w-9"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Logo */}
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-2 shrink-0"
        >
          <div
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ background: '#00D09C' }}
          >
            <TrendingUp className="size-4 text-white" />
          </div>
          <span className="text-lg font-bold hidden sm:inline" style={{ color: '#1a1a1a' }}>
            TradePro
          </span>
        </button>

        {/* Desktop Nav Links - Groww style */}
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {[
            { label: 'Home', page: 'dashboard' as const },
            { label: 'Stocks', page: 'trading' as const },
            { label: 'Options', page: 'optionChain' as const },
            { label: 'Portfolio', page: 'portfolio' as const },
            { label: 'Learn', page: 'learning' as const },
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-[#f5f5f5]"
              style={{ color: '#4a4a4a' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative hidden md:flex max-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            type="search"
            placeholder="Search stocks, indices..."
            className="pl-9 h-8 text-sm border-none focus-visible:ring-1 focus-visible:ring-[#00D09C]/30 placeholder:text-[#9ca3af]"
            style={{
              background: '#f5f5f5',
              color: '#1a1a1a',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Balance Pill - Groww style */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[#f5f5f5]"
            onClick={() => setCurrentPage('portfolio')}
          >
            <span className="text-xs" style={{ color: '#9ca3af' }}>Balance</span>
            <span className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
              ₹{formatINR(balance)}
            </span>
            {totalPnl !== 0 && (
              <span
                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                style={{
                  color: isProfit ? '#00D09C' : '#eb5b3c',
                  background: isProfit ? 'rgba(0,208,156,0.08)' : 'rgba(235,91,60,0.08)',
                }}
              >
                {isProfit ? '+' : ''}{isProfit ? '+' : '-'}₹{formatINR(Math.abs(totalPnl))}
              </span>
            )}
          </div>

          {/* Notification */}
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0 text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[#f5f5f5] outline-none">
                <div
                  className="flex size-7 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: '#00D09C', color: '#ffffff' }}
                >
                  {initials}
                </div>
                <ChevronDown className="size-3 text-[#9ca3af] hidden md:block" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: '#ffffff',
                border: '1px solid #f0f0f0',
                color: '#1a1a1a',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
              }}
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5 py-1">
                  <div
                    className="flex size-9 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: '#00D09C', color: '#ffffff' }}
                  >
                    {initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm" style={{ color: '#1a1a1a' }}>
                      {userName || 'User'}
                    </span>
                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>
                      Paper Trading Account
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: '#f0f0f0' }} />
              <DropdownMenuItem
                onClick={() => setCurrentPage('profile')}
                className="cursor-pointer text-sm py-2.5 text-[#4a4a4a] focus:text-[#1a1a1a] focus:bg-[#f5f5f5]"
              >
                <User className="size-4 mr-2.5 text-[#9ca3af]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentPage('reports')}
                className="cursor-pointer text-sm py-2.5 text-[#4a4a4a] focus:text-[#1a1a1a] focus:bg-[#f5f5f5]"
              >
                <FileBarChart className="size-4 mr-2.5 text-[#9ca3af]" />
                Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: '#f0f0f0' }} />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-sm py-2.5 text-[#eb5b3c] focus:text-[#eb5b3c] focus:bg-[rgba(235,91,60,0.06)]"
              >
                <LogOut className="size-4 mr-2.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
