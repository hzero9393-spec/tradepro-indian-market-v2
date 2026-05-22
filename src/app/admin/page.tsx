'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Eye, EyeOff, AlertCircle, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ADMIN_PASSWORD = 'admin000'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('tradepro_admin_auth') === 'true'
    }
    return false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 500))

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('tradepro_admin_auth', 'true')
      setIsAuthenticated(true)
    } else {
      setError('Invalid admin password. Access denied.')
    }
    setIsLoading(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
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

            <form onSubmit={handleLogin} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1a1a1a]">Admin Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#9ca3af]" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter admin password"
                    className="pl-10 pr-10 h-12 bg-[#f0f2f5] border-[#e5e7eb] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#00D09C] focus:ring-[#00D09C]/20"
                    autoFocus
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
                disabled={isLoading || !password}
                className="w-full h-12 bg-[#00D09C] hover:bg-[#4456e6] text-white font-semibold text-base disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="size-4" />
                    Access Admin Panel
                  </div>
                )}
              </Button>

              <p className="text-center text-xs text-[#9ca3af] mt-4">
                This area is restricted to authorized administrators only.
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return <AdminPanel />
}

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Users,
  Activity,
  IndianRupee,
  Crown,
  Clock,
  Search,
  Edit,
  Ban,
  BarChart3,
  Settings2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'

const statsCards = [
  { label: 'Total Users', value: '1,248', sub: '+12 this week', icon: Users, color: 'bg-[#00D09C]/10 text-[#00D09C]' },
  { label: 'Active Traders', value: '856', sub: '68.6% of total', icon: Activity, color: 'bg-[#00d09c]/10 text-[#00d09c]' },
  { label: 'Total Trades Today', value: '5,432', sub: '+18% vs yesterday', icon: BarChart3, color: 'bg-[#00D09C]/10 text-[#00D09C]' },
  { label: 'Platform Volume', value: '₹45.2 Cr', sub: 'F&O + Equity', icon: IndianRupee, color: 'bg-[#00d09c]/10 text-[#00d09c]' },
  { label: 'Premium Users', value: '234', sub: '₹23,166/mo revenue', icon: Crown, color: 'bg-[#00D09C]/10 text-[#00D09C]' },
  { label: 'Avg Session', value: '18 min', sub: '+3 min this week', icon: Clock, color: 'bg-[#00d09c]/10 text-[#00d09c]' },
]

const recentActivity = [
  { user: 'Arjun Mehta', action: 'Bought', symbol: 'NIFTY 23500 CE', time: '2 min ago' },
  { user: 'Priya Sharma', action: 'Sold', symbol: 'RELIANCE', time: '5 min ago' },
  { user: 'Rahul Verma', action: 'Bought', symbol: 'BANKNIFTY 50000 PE', time: '8 min ago' },
  { user: 'Sneha Patel', action: 'Deposited', symbol: '₹50,000', time: '12 min ago' },
  { user: 'Vikram Singh', action: 'Sold', symbol: 'TCS', time: '15 min ago' },
]

const mockUsers = [
  { name: 'Arjun Mehta', email: 'arjun.mehta@email.com', balance: '₹2,45,000', trades: 342, pnl: '+₹45,200', pnlPositive: true, subscription: 'Premium', status: 'Active' },
  { name: 'Priya Sharma', email: 'priya.sharma@email.com', balance: '₹1,80,500', trades: 218, pnl: '+₹22,100', pnlPositive: true, subscription: 'Free', status: 'Active' },
  { name: 'Rahul Verma', email: 'rahul.verma@email.com', balance: '₹95,000', trades: 89, pnl: '-₹8,300', pnlPositive: false, subscription: 'Premium', status: 'Active' },
  { name: 'Sneha Patel', email: 'sneha.patel@email.com', balance: '₹3,12,000', trades: 567, pnl: '+₹1,12,400', pnlPositive: true, subscription: 'Premium', status: 'Active' },
  { name: 'Vikram Singh', email: 'vikram.singh@email.com', balance: '₹50,000', trades: 12, pnl: '-₹2,100', pnlPositive: false, subscription: 'Free', status: 'Inactive' },
  { name: 'Ananya Iyer', email: 'ananya.iyer@email.com', balance: '₹4,20,000', trades: 891, pnl: '+₹2,34,500', pnlPositive: true, subscription: 'Premium', status: 'Active' },
]

const indexSettings = [
  { name: 'NIFTY', enabled: true, lotSize: '50', expiryDay: 'Thursday', strikeInterval: '50' },
  { name: 'BANKNIFTY', enabled: true, lotSize: '25', expiryDay: 'Wednesday', strikeInterval: '100' },
  { name: 'FINNIFTY', enabled: true, lotSize: '40', expiryDay: 'Tuesday', strikeInterval: '50' },
  { name: 'SENSEX', enabled: true, lotSize: '20', expiryDay: 'Friday', strikeInterval: '100' },
  { name: 'MIDCPNIFTY', enabled: true, lotSize: '75', expiryDay: 'Monday', strikeInterval: '25' },
]

const userGrowthData = [
  { month: 'Jan', users: 420 }, { month: 'Feb', users: 510 }, { month: 'Mar', users: 640 },
  { month: 'Apr', users: 720 }, { month: 'May', users: 830 }, { month: 'Jun', users: 950 },
  { month: 'Jul', users: 1050 }, { month: 'Aug', users: 1100 }, { month: 'Sep', users: 1160 },
  { month: 'Oct', users: 1200 }, { month: 'Nov', users: 1230 }, { month: 'Dec', users: 1248 },
]

const lineChartConfig: ChartConfig = { users: { label: 'Users', color: '#00D09C' } }

function AdminPanel() {
  const [indices, setIndices] = useState(indexSettings)
  const [userFilter, setUserFilter] = useState('All')
  const router = useRouter()

  const toggleIndex = (index: number) => {
    setIndices((prev) => prev.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)))
  }

  const filteredUsers = mockUsers.filter((user) => {
    if (userFilter === 'All') return true
    if (userFilter === 'Free') return user.subscription === 'Free'
    if (userFilter === 'Premium') return user.subscription === 'Premium'
    if (userFilter === 'Active') return user.status === 'Active'
    if (userFilter === 'Inactive') return user.status !== 'Active'
    return true
  })

  const handleLogout = () => {
    sessionStorage.removeItem('tradepro_admin_auth')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <header className="bg-white border-b border-[#e5e7eb] px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#00D09C]/10">
              <TrendingUp className="size-5 text-[#00D09C]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a1a1a]">TradePro Admin</h1>
              <p className="text-xs text-[#6b7280]">Administration Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-[#00D09C]/10 text-[#00D09C] border-[#00D09C]/20 text-xs">ADMIN</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-[#e5e7eb] text-[#6b7280] hover:text-[#1a1a1a] hover:border-[#d1d5db]"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-white border border-[#e5e7eb]">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C]">Dashboard</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C]">Users</TabsTrigger>
            <TabsTrigger value="market" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C]">Market Control</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#00D09C]/10 data-[state=active]:text-[#00D09C]">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
              {statsCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.label} className="bg-white border-[#e5e7eb] rounded-xl">
                    <CardContent className="p-4">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${stat.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <p className="mt-3 text-xs font-medium text-[#6b7280]">{stat.label}</p>
                      <p className="font-mono text-lg font-bold text-[#1a1a1a]">{stat.value}</p>
                      <p className="text-[11px] text-[#9ca3af]">{stat.sub}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="bg-white border-[#e5e7eb] rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-[#1a1a1a]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                      <TableHead className="text-[#6b7280]">User</TableHead>
                      <TableHead className="text-[#6b7280]">Action</TableHead>
                      <TableHead className="text-[#6b7280]">Symbol</TableHead>
                      <TableHead className="text-right text-[#6b7280]">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((item, i) => (
                      <TableRow key={i} className="border-[#f0f2f5]">
                        <TableCell className="font-medium text-[#1a1a1a]">{item.user}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] font-semibold ${
                            item.action === 'Bought' ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]'
                            : item.action === 'Sold' ? 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                            : 'border-[#00D09C]/30 bg-[#00D09C]/10 text-[#00D09C]'
                          }`}>{item.action}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-[#1a1a1a]">{item.symbol}</TableCell>
                        <TableCell className="text-right text-xs text-[#9ca3af]">{item.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white border-[#e5e7eb] rounded-xl">
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
                    <Input placeholder="Search users..." className="rounded-lg border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] pl-10" />
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#f0f2f5] p-1 border border-[#e5e7eb]">
                    {['All', 'Free', 'Premium', 'Active', 'Inactive'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setUserFilter(f)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          userFilter === f ? 'bg-[#00D09C] text-white' : 'text-[#6b7280] hover:text-[#1a1a1a]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#e5e7eb] rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-[#1a1a1a]">Users ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                      <TableHead className="text-[#6b7280]">Name</TableHead>
                      <TableHead className="hidden sm:table-cell text-[#6b7280]">Email</TableHead>
                      <TableHead className="text-right text-[#6b7280]">Balance</TableHead>
                      <TableHead className="text-[#6b7280]">Plan</TableHead>
                      <TableHead className="text-[#6b7280]">Status</TableHead>
                      <TableHead className="text-right text-[#6b7280]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, i) => (
                      <TableRow key={i} className="border-[#f0f2f5]">
                        <TableCell className="font-medium text-[#1a1a1a]">{user.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-[#6b7280]">{user.email}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-[#1a1a1a]">{user.balance}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] font-semibold ${
                            user.subscription === 'Premium' ? 'border-[#00D09C]/30 bg-[#00D09C]/10 text-[#00D09C]' : 'border-[#e5e7eb] bg-[#f0f2f5] text-[#6b7280]'
                          }`}>{user.subscription}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[11px] font-semibold ${
                            user.status === 'Active' ? 'border-[#00d09c]/30 bg-[#00d09c]/10 text-[#00a87d]' : 'border-[#eb5b3c]/30 bg-[#eb5b3c]/10 text-[#d44a2d]'
                          }`}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-7 text-[#6b7280] hover:text-[#00D09C]"><Edit className="size-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="size-7 text-[#6b7280] hover:text-[#eb5b3c]"><Ban className="size-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <Card className="bg-white border-[#e5e7eb] rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a1a1a]">
                  <Settings2 className="size-4 text-[#00D09C]" /> Indices Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {indices.map((idx, i) => (
                    <div key={idx.name} className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-4 ${
                      idx.enabled ? 'border-[#00D09C]/20 bg-[#00D09C]/5' : 'border-[#e5e7eb] bg-[#f0f2f5]/50'
                    }`}>
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <Switch checked={idx.enabled} onCheckedChange={() => toggleIndex(i)} />
                        <span className={`font-mono font-bold ${idx.enabled ? 'text-[#1a1a1a]' : 'text-[#9ca3af]'}`}>{idx.name}</span>
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6b7280]">Lot Size</Label>
                          <Input defaultValue={idx.lotSize} className="h-8 w-20 border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] font-mono text-sm" disabled={!idx.enabled} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6b7280]">Expiry</Label>
                          <Input defaultValue={idx.expiryDay} className="h-8 w-28 border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] text-sm" disabled={!idx.enabled} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-[#6b7280]">Strike Interval</Label>
                          <Input defaultValue={idx.strikeInterval} className="h-8 w-20 border-[#e5e7eb] bg-[#f0f2f5] text-[#1a1a1a] font-mono text-sm" disabled={!idx.enabled} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white border-[#e5e7eb] rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-[#1a1a1a]">
                  <TrendingUp className="size-4 text-[#00D09C]" /> User Growth (2025)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                  <LineChart data={userGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} width={45} />
                    <RechartsTooltip contentStyle={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="users" stroke="#00D09C" strokeWidth={2.5} dot={{ r: 4, fill: '#00D09C', stroke: '#ffffff', strokeWidth: 2 }} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-[#e5e7eb] rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-[#1a1a1a]">Top Traders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#e5e7eb] hover:bg-transparent">
                      <TableHead className="text-[#6b7280]">#</TableHead>
                      <TableHead className="text-[#6b7280]">Name</TableHead>
                      <TableHead className="text-right text-[#6b7280]">ROI</TableHead>
                      <TableHead className="text-right text-[#6b7280]">Win Rate</TableHead>
                      <TableHead className="text-right text-[#6b7280]">Trades</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: 'Ananya Iyer', roi: '+78.5%', winRate: '72%', totalTrades: 891 },
                      { name: 'Sneha Patel', roi: '+56.1%', winRate: '68%', totalTrades: 567 },
                      { name: 'Arjun Mehta', roi: '+42.3%', winRate: '65%', totalTrades: 342 },
                    ].map((trader, i) => (
                      <TableRow key={i} className="border-[#f0f2f5]">
                        <TableCell>
                          <div className={`flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold ${
                            i === 0 ? 'bg-[#00D09C]/10 text-[#00D09C]' : i === 1 ? 'bg-[#9ca3af]/10 text-[#6b7280]' : 'bg-[#f59e0b]/10 text-[#d97706]'
                          }`}>{i + 1}</div>
                        </TableCell>
                        <TableCell className="font-medium text-[#1a1a1a]">{trader.name}</TableCell>
                        <TableCell className="text-right font-mono text-[#00a87d]">{trader.roi}</TableCell>
                        <TableCell className="text-right font-mono text-[#1a1a1a]">{trader.winRate}</TableCell>
                        <TableCell className="text-right font-mono text-[#6b7280]">{trader.totalTrades}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
