'use client'

import { Menu, Search, Bell, LogOut, Wallet, ChevronDown, User, FileBarChart } from 'lucide-react'
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
    : 'SV'

  const balance = user?.virtualBalance ?? 100000
  const totalPnl = user?.totalPnl ?? 0
  const isProfit = totalPnl >= 0

  const formatINR = (value: number) =>
    value.toLocaleString('en-IN', { maximumFractionDigits: 0 })

  return (
    <header
      className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center md:left-[260px]"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
      }}
      role="banner"
    >
      <div className="flex h-full w-full items-center gap-2 px-3 md:px-5">
        {/* Left: Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f0f2f5]"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Search - Desktop */}
        <div className="relative hidden flex-1 max-w-xs md:flex">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            type="search"
            placeholder="Search stocks, indices..."
            className="pl-9 h-9 text-sm border-none focus-visible:ring-1 focus-visible:ring-[#5367ff]/30 placeholder:text-[#9ca3af]"
            style={{
              background: '#f0f2f5',
              color: '#1f2937',
              borderRadius: '9999px',
            }}
          />
        </div>

        {/* Search - Mobile */}
        <div className="relative flex-1 md:hidden">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 h-9 text-sm border-none focus-visible:ring-1 focus-visible:ring-[#5367ff]/30 placeholder:text-[#9ca3af]"
            style={{
              background: '#f0f2f5',
              color: '#1f2937',
              borderRadius: '9999px',
            }}
          />
        </div>

        {/* Spacer */}
        <div className="flex-1 hidden md:block" />

        {/* Right section */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {/* Wallet Balance Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: '#f0f2f5',
            }}
          >
            <Wallet className="size-3.5 text-[#5367ff]" />
            <span
              className="text-xs font-semibold"
              style={{ color: '#1f2937', fontFamily: "'Geist Sans', system-ui, sans-serif" }}
            >
              ₹{formatINR(balance)}
            </span>
          </div>

          {/* P&L Badge */}
          {totalPnl !== 0 && (
            <div
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: isProfit ? 'rgba(0, 208, 156, 0.08)' : 'rgba(235, 91, 60, 0.08)',
                color: isProfit ? '#00d09c' : '#eb5b3c',
                fontFamily: "'Geist Sans', system-ui, sans-serif",
              }}
            >
              <span>{isProfit ? '▲' : '▼'}</span>
              <span>
                {isProfit ? '+' : ''}₹{formatINR(Math.abs(totalPnl))}
              </span>
            </div>
          )}

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative shrink-0 text-[#6b7280] hover:text-[#1f2937] hover:bg-[#f0f2f5] h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            <span
              className="absolute right-2 top-2 size-1.5 rounded-full"
              style={{ background: '#5367ff' }}
            />
          </Button>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            {/* Desktop Trigger */}
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-full px-2 py-1.5 transition-colors duration-150 hover:bg-[#f0f2f5] outline-none">
                <Avatar className="size-7" style={{ border: '1.5px solid #e5e7eb' }}>
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{
                      background: 'rgba(83, 103, 255, 0.08)',
                      color: '#5367ff',
                      fontFamily: "'Geist Sans', system-ui, sans-serif",
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span
                    className="text-xs font-medium leading-tight"
                    style={{ color: '#1f2937' }}
                  >
                    {userName || 'User'}
                  </span>
                  <span
                    className="text-[10px] leading-tight"
                    style={{ color: '#9ca3af' }}
                  >
                    Paper Trading
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-[#9ca3af]" />
              </button>
            </DropdownMenuTrigger>

            {/* Desktop Dropdown Content */}
            <DropdownMenuContent
              align="end"
              className="w-56"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#1f2937',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                borderRadius: '12px',
              }}
            >
              <DropdownMenuLabel>
                <div className="flex items-center gap-2.5 py-1">
                  <Avatar className="size-8" style={{ border: '1.5px solid #e5e7eb' }}>
                    <AvatarFallback
                      className="text-xs font-bold"
                      style={{
                        background: 'rgba(83, 103, 255, 0.08)',
                        color: '#5367ff',
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm" style={{ color: '#1f2937' }}>
                      {userName || 'User'}
                    </span>
                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>
                      Paper Trading Account
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: '#f0f2f5' }} />
              <DropdownMenuItem
                onClick={() => setCurrentPage('profile')}
                className="cursor-pointer text-sm py-2 text-[#4b5563] focus:text-[#1f2937] focus:bg-[#f0f2f5]"
              >
                <User className="size-4 mr-2.5 text-[#9ca3af]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentPage('reports')}
                className="cursor-pointer text-sm py-2 text-[#4b5563] focus:text-[#1f2937] focus:bg-[#f0f2f5]"
              >
                <FileBarChart className="size-4 mr-2.5 text-[#9ca3af]" />
                Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: '#f0f2f5' }} />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-sm py-2 text-[#eb5b3c] focus:text-[#eb5b3c] focus:bg-[rgba(235,91,60,0.06)]"
              >
                <LogOut className="size-4 mr-2.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile: Avatar only dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden outline-none shrink-0">
                <Avatar className="size-7" style={{ border: '1.5px solid #e5e7eb' }}>
                  <AvatarFallback
                    className="text-[10px] font-bold"
                    style={{
                      background: 'rgba(83, 103, 255, 0.08)',
                      color: '#5367ff',
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52"
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                color: '#1f2937',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                borderRadius: '12px',
              }}
            >
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium text-sm" style={{ color: '#1f2937' }}>
                    {userName || 'User'}
                  </span>
                  <span className="text-[11px]" style={{ color: '#9ca3af' }}>
                    Paper Trading
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ background: '#f0f2f5' }} />
              <DropdownMenuItem
                onClick={() => setCurrentPage('profile')}
                className="cursor-pointer text-sm py-2 text-[#4b5563] focus:text-[#1f2937] focus:bg-[#f0f2f5]"
              >
                <User className="size-4 mr-2.5 text-[#9ca3af]" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCurrentPage('reports')}
                className="cursor-pointer text-sm py-2 text-[#4b5563] focus:text-[#1f2937] focus:bg-[#f0f2f5]"
              >
                <FileBarChart className="size-4 mr-2.5 text-[#9ca3af]" />
                Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: '#f0f2f5' }} />
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer text-sm py-2 text-[#eb5b3c] focus:text-[#eb5b3c] focus:bg-[rgba(235,91,60,0.06)]"
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
