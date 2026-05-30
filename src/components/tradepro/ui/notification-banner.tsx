'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useNotifications } from '@/lib/use-notifications'

/**
 * A small dismissible banner that shows at the top of the dashboard
 * prompting users to enable browser push notifications.
 *
 * Automatically hides when:
 * - Notifications are not supported
 * - Permission is already granted
 * - Permission is permanently denied
 * - The user dismissed the banner
 */
export function NotificationBanner() {
  const { permission, requestPermission, isSupported } = useNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [requesting, setRequesting] = useState(false)

  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null
  }

  const handleEnable = async () => {
    setRequesting(true)
    await requestPermission()
    setRequesting(false)
  }

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-xl bg-[#00D09C]/8 border border-[#00D09C]/20 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-[#00D09C]/15 flex items-center justify-center shrink-0">
          <Bell className="size-4 text-[#00D09C]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1a1a1a]">Enable Trade Notifications</p>
          <p className="text-[10px] text-[#6b7280]">Get instant alerts for order fills, P&amp;L updates &amp; more</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleEnable}
          disabled={requesting}
          className="px-3 py-1.5 rounded-lg bg-[#00D09C] text-white text-xs font-semibold hover:bg-[#00b88a] transition-colors disabled:opacity-50"
        >
          {requesting ? 'Enabling...' : 'Enable'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="size-6 rounded-md flex items-center justify-center text-[#6b7280] hover:bg-[#f5f7fa] transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
