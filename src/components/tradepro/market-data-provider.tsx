/**
 * TradePro - Market Data Provider Component
 * Initializes the client-side market engine on app mount and cleans up on unmount.
 * Place this at the root of the app layout.
 * 
 * The engine runs in the browser and provides real-time 1-second tick updates.
 * No external server needed - works on Vercel, Netlify, or any hosting.
 */

'use client';

import { useEffect } from 'react';
import { useMarketData } from '@/lib/market-data';
import { toast } from 'sonner';

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const { connect, disconnect, isConnected, recentTriggers, clearTriggers } = useMarketData();

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Show toast notifications for SL/TP triggers
  useEffect(() => {
    for (const trigger of recentTriggers) {
      if (trigger.type === 'positionClosed') {
        const reasonLabel = trigger.exitReason === 'STOP_LOSS' ? 'Stop Loss' : 'Target';
        const emoji = trigger.exitReason === 'STOP_LOSS' ? '🛑' : '🎯';
        toast.success(`${emoji} ${reasonLabel} triggered! ${trigger.symbol} auto-squared off`, {
          description: `Exit @ ₹${(trigger.exitPrice || 0).toLocaleString('en-IN')} | P&L: ₹${(trigger.realizedPnl || 0).toLocaleString('en-IN')}`,
          duration: 5000,
        });
      } else if (trigger.type === 'orderFilled') {
        toast.success('📋 Pending order filled!', {
          description: `${trigger.symbol} executed @ ₹${(trigger.fillPrice || 0).toLocaleString('en-IN')}`,
          duration: 5000,
        });
      }
    }
    // Clear triggers after showing toasts
    if (recentTriggers.length > 0) {
      clearTriggers();
    }
  }, [recentTriggers.length]);

  return <>{children}</>;
}
