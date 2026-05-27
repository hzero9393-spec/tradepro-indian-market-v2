'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Lock, Eye, EyeOff, AlertCircle, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import dynamic from 'next/dynamic'

// Lazy-load the heavy AdminPanel - only loads after successful login
const AdminPanel = dynamic(
  () => import('@/components/admin/admin-panel').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-[#00D09C]" />
          <span className="text-sm text-[#6b7280]">Loading admin panel...</span>
        </div>
      </div>
    ),
  }
)

// ═════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE (lightweight - always loaded)
// ═════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        return
      }
      localStorage.setItem('admin_token', data.token)
      onLogin(data.token)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D09C]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00d09c]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#00D09C]/5 to-[#00d09c]/5 border-b border-[#e5e7eb] px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#00D09C]/10">
                <Shield className="size-6 text-[#00D09C]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1a1a1a]">Admin Access</h1>
                <p className="text-sm text-[#6b7280] mt-0.5">TradePro Administration Panel</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1a1a1a]">Username</Label>
              <Input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                placeholder="Enter username"
                className="h-11 bg-[#f0f2f5] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#00D09C] focus:ring-[#00D09C]/20"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1a1a1a]">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter password"
                  className="pl-10 pr-10 h-11 bg-[#f0f2f5] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#00D09C] focus:ring-[#00D09C]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-[#eb5b3c]/8 border border-[#eb5b3c]/15 text-[#d44a2d] text-sm"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-11 bg-[#00D09C] hover:bg-[#00b888] text-white font-semibold text-base disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Lock className="size-4" />
                  Access Admin Panel
                </div>
              )}
            </Button>

            <p className="text-center text-xs text-[#9ca3af]">
              This area is restricted to authorized administrators only.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('admin_token')
      if (!token) {
        setVerifying(false)
        return
      }
      try {
        const res = await fetch('/api/admin/auth/verify', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem('admin_token')
          setIsAuthenticated(false)
        }
      } catch {
        localStorage.removeItem('admin_token')
        setIsAuthenticated(false)
      } finally {
        setVerifying(false)
      }
    }
    verify()
  }, [])

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-[#00D09C]" />
          <span className="text-sm text-[#6b7280]">Verifying session...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />
  }

  return <AdminPanel onLogout={() => setIsAuthenticated(false)} />
}
