'use client'

import { Menu, Search, Bell, Settings } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function TopBar() {
  const { setSidebarOpen } = useAppStore()

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

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label="Settings"
          >
            <Settings className="size-5 text-tp-on-surface-variant" />
          </Button>

          {/* Divider */}
          <Separator orientation="vertical" className="mx-1 h-6 hidden md:block" />

          {/* User Avatar & Name */}
          <button className="hidden md:flex items-center gap-2.5 rounded-full px-2 py-1.5 transition-colors hover:bg-accent">
            <Avatar className="size-8 border border-tp-outline-variant/50">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                TP
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-tp-on-surface leading-tight">
                TradePro User
              </span>
              <span className="text-[11px] text-tp-outline leading-tight">
                Pro Account
              </span>
            </div>
          </button>

          {/* Mobile: Avatar only */}
          <Avatar className="size-8 border border-tp-outline-variant/50 md:hidden">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              TP
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
