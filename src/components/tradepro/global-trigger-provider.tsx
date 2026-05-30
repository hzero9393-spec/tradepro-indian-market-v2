'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'

/**
 * GlobalTriggerProvider - Polls /api/trade/check-triggers every 15s
 * Ensures SL/TP and LIMIT order triggers are checked regardless of which page the user is on.
 *
 * CRITICAL FIX: Previously SL/TP checking only happened on the Positions page.
 * Now triggers are checked globally from any page.
 */
export function GlobalTriggerProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuthStore()
  const lastTriggerCount = useRef(0)

  const checkTriggers = useCallback(async () => {
    if (!token || !isAuthenticated) return
    try {
      const res = await fetch('/api/trade/check-triggers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        let needsRefresh = false

        // Show SL/TP trigger notifications
        if (data.slTpTriggers && data.slTpTriggers.length > 0) {
          for (const trigger of data.slTpTriggers) {
            if (trigger.executed) {
              const reasonLabel = trigger.exitReason === 'STOP_LOSS' ? 'Stop Loss' : 'Target'
              const emoji = trigger.exitReason === 'STOP_LOSS' ? '🛑' : '🎯'
              toast.success(`${emoji} ${reasonLabel} triggered! Position auto-squared off`, {
                description: `Exit @ ₹${trigger.currentPrice.toLocaleString('en-IN')}`,
              })
            }
          }
          needsRefresh = true
        }

        // Show LIMIT order fill notifications
        if (data.triggeredOrders && data.triggeredOrders.length > 0) {
          for (const trigger of data.triggeredOrders) {
            if (trigger.executed) {
              toast.success('📋 Pending order filled!', {
                description: `Order executed @ ₹${trigger.currentPrice.toLocaleString('en-IN')}`,
              })
            }
          }
          needsRefresh = true
        }

        // Refresh user balance if triggers fired
        if (needsRefresh) {
          try {
            const meRes = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (meRes.ok) {
              const meData = await meRes.json()
              if (meData.user) {
                useAuthStore.getState().setUser(meData.user)
              }
            }
          } catch {
            // Silent fail - don't spam errors
          }
        }
      }
    } catch {
      // Silent fail for polling - don't spam errors
    }
  }, [token, isAuthenticated])

  useEffect(() => {
    if (!token || !isAuthenticated) return

    // Check immediately on mount
    checkTriggers()

    // Then poll every 15 seconds
    const interval = setInterval(checkTriggers, 15000)
    return () => clearInterval(interval)
  }, [checkTriggers, token, isAuthenticated])

  return <>{children}</>
}
