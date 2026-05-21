'use client'

import { Menu, Search, Bell, LogOut } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
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

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'TP'

  return (
    <header
      className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center md:left-[280px]"
      role="banner"
    >
      {/* Glass card background */}
      <div className="glass-card flex h-full w-full items-center gap-4 px-4 shadow-sm md:px-6">
        {/* Left: Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>

        {/* Search */}
        <div className="relative hidden flex-1 max-w-md md:flex">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search markets, orders, analytics..."
            className="pl-9 bg-tp-surface-container-lowest border-tp-outline-variant/50 h-9 text-sm"
          />
        </div>

        {/* Mobile: compact search */}
        <div className="relative flex-1 md:hidden">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-9 bg-tp-surface-container-lowest border-tp-outline-variant/50 h-9 text-sm"
          />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="size-5 text-tp-on-surface-variant" />
            {/* Notification badge */}
            <span className="absolute right-1.5 top-1.5 flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
          </Button>

          {/* Divider */}
          <Separator orientation="vertical" className="mx-1 h-6 hidden md:block" />

          {/* User Menu (Dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-accent outline-none">
                <Avatar className="size-8 border border-tp-outline-variant/50">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-tp-on-surface leading-tight">
                    {userName || 'TradePro User'}
                  </span>
                  <span className="text-[11px] text-tp-outline leading-tight">
                    Paper Trading
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{userName || 'User'}</span>
                  <span className="text-xs text-muted-foreground">Paper Trading Account</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentPage('analytics')}>
                My Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile: Avatar only (dropdown) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden outline-none">
                <Avatar className="size-8 border border-tp-outline-variant/50">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{userName || 'User'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
