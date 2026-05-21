'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, BarChart3, Shield, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { setAuth } = useAuthStore()

  const resetForm = () => {
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
    setShowPassword(false)
  }

  const switchMode = (newMode: AuthMode) => {
    resetForm()
    setMode(newMode)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      setAuth(data.user, data.token)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setAuth(data.user, data.token)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: BarChart3,
      title: 'Real-time Market Data',
      desc: 'NIFTY, BANKNIFTY, SENSEX & more with live option chain analysis',
    },
    {
      icon: Shield,
      title: 'Risk-Free Trading',
      desc: 'Practice with ₹1,00,000 virtual money — zero financial risk',
    },
    {
      icon: Zap,
      title: 'F&O Trading',
      desc: 'Trade futures & options with Indian market lot sizes & expiries',
    },
  ]

  return (
    <div className="min-h-screen flex bg-tp-surface">
      {/* Left Panel - Branding & Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-tp-primary">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-tp-primary via-tp-primary-container to-tp-secondary opacity-90" />
          {/* Decorative circles */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          {/* Floating shapes */}
          <motion.div
            className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/10 blur-xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-white/5 blur-lg"
            animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <TrendingUp className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TradePro</h1>
              <p className="text-white/70 text-sm">Indian Market Platform</p>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Master the Markets<br />
              <span className="text-white/80">Before You Invest</span>
            </h2>
            <p className="text-white/60 text-lg">
              Practice trading with real market data. Build strategies, analyze options, and sharpen your skills — all risk-free.
            </p>
          </motion.div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="flex gap-4 items-start"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                  <feature.icon className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            className="mt-12 grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-white/50 text-xs">NSE Stocks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">5</div>
              <div className="text-white/50 text-xs">Indices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">₹1L</div>
              <div className="text-white/50 text-xs">Virtual Cash</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="size-5" />
            </div>
            <span className="text-xl font-bold text-tp-on-surface">TradePro</span>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-tp-on-surface">Welcome back</h2>
                  <p className="text-tp-on-surface-variant mt-1">
                    Sign in to continue your trading journey
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-tp-on-surface-variant hover:text-tp-on-surface transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="size-4" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Switch to Signup */}
                <div className="mt-8 text-center">
                  <p className="text-tp-on-surface-variant text-sm">
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      className="text-primary font-semibold hover:underline"
                    >
                      Create Account
                    </button>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-tp-on-surface">Create Account</h2>
                  <p className="text-tp-on-surface-variant mt-1">
                    Start your paper trading journey with ₹1,00,000 virtual cash
                  </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Phone (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">
                      Phone Number <span className="text-tp-on-surface-variant font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-tp-on-surface-variant hover:text-tp-on-surface transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    {password && (
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              password.length >= level * 3
                                ? password.length >= 10
                                  ? 'bg-green-500'
                                  : password.length >= 6
                                    ? 'bg-yellow-500'
                                    : 'bg-red-400'
                                : 'bg-tp-outline-variant/30'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tp-on-surface-variant" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 h-11 ${
                          confirmPassword && confirmPassword !== password
                            ? 'border-destructive focus-visible:border-destructive'
                            : ''
                        }`}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-destructive text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="mt-0.5 size-4 rounded border-tp-outline-variant text-primary accent-primary"
                    />
                    <label htmlFor="terms" className="text-xs text-tp-on-surface-variant leading-relaxed">
                      I agree to the{' '}
                      <span className="text-primary hover:underline cursor-pointer">Terms of Service</span>{' '}
                      and{' '}
                      <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>
                    </label>
                  </div>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Success */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
                    >
                      {success}
                    </motion.div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading || (confirmPassword !== '' && confirmPassword !== password)}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating Account...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Create Account
                        <ArrowRight className="size-4" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Switch to Login */}
                <div className="mt-6 text-center">
                  <p className="text-tp-on-surface-variant text-sm">
                    Already have an account?{' '}
                    <button
                      onClick={() => switchMode('login')}
                      className="text-primary font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom info */}
          <div className="mt-8 pt-6 border-t border-tp-outline-variant/30">
            <div className="flex items-center justify-center gap-4 text-xs text-tp-on-surface-variant">
              <span>🔒 Secure</span>
              <span>•</span>
              <span>🇮🇳 Made in India</span>
              <span>•</span>
              <span>₹0 Cost</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
