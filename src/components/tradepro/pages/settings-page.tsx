'use client'

import { useState, useRef } from 'react'
import {
  User,
  Bell,
  Shield,
  TrendingUp,
  Megaphone,
  Camera,
  Save,
  Lock,
  Smartphone,
  Monitor,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotificationSetting {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  iconBg: string
}

interface SessionInfo {
  id: string
  device: string
  location: string
  time: string
  icon: React.ReactNode
  isActive: boolean
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuickAccessCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 spring-interaction group"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6 flex items-start gap-4">
        <div className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl bg-tp-primary/10 text-tp-primary group-hover:bg-tp-primary group-hover:text-white transition-colors duration-200">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-tp-on-surface text-sm sm:text-base">{title}</h3>
          <p className="text-xs sm:text-sm text-tp-on-surface-variant mt-0.5 line-clamp-2">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfileCard() {
  return (
    <Card className="h-fit">
      <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <Avatar className="size-20 sm:size-24">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Alex Thompson" />
            <AvatarFallback className="text-xl sm:text-2xl font-bold bg-tp-primary/10 text-tp-primary">
              AT
            </AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-tp-primary text-white shadow-md hover:bg-tp-primary/90 transition-colors">
            <Camera className="size-4" />
          </button>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-tp-on-surface">Alex Thompson</h2>
        <p className="text-sm text-tp-on-surface-variant mt-0.5">Senior Portfolio Manager</p>

        <Separator className="my-4" />

        <div className="w-full space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-tp-on-surface-variant">Member Since</span>
            <span className="text-xs sm:text-sm font-medium text-tp-on-surface">Jan 2022</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-tp-on-surface-variant">Account Type</span>
            <Badge className="bg-tp-secondary/10 text-tp-secondary hover:bg-tp-secondary/20 border-0 text-xs">
              Premium
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-tp-on-surface-variant">Verification</span>
            <Badge className="bg-tp-primary/10 text-tp-primary hover:bg-tp-primary/20 border-0 text-xs">
              Verified
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PersonalInfoForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
        <CardDescription>Update your personal details and contact information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" defaultValue="Alex Thompson" placeholder="Enter your full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue="alex.thompson@tradepro.com"
              placeholder="Enter your email"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" placeholder="Enter your phone" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select defaultValue="us">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="ca">Canada</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
                <SelectItem value="jp">Japan</SelectItem>
                <SelectItem value="au">Australia</SelectItem>
                <SelectItem value="sg">Singapore</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button className="bg-tp-primary hover:bg-tp-primary/90 text-white gap-2">
            <Save className="size-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationItem({
  setting,
  onToggle,
}: {
  setting: NotificationSetting
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-tp-surface-container-low transition-colors">
      <div
        className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl ${setting.iconBg}`}
      >
        {setting.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm sm:text-base font-medium text-tp-on-surface">{setting.title}</h4>
        <p className="text-xs sm:text-sm text-tp-on-surface-variant mt-0.5 line-clamp-1">
          {setting.description}
        </p>
      </div>
      <Switch checked={setting.enabled} onCheckedChange={() => onToggle(setting.id)} />
    </div>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'trade',
      icon: <TrendingUp className="size-5 text-tp-primary" />,
      title: 'Trade Executions',
      description: 'Get notified when your trades are executed and filled.',
      enabled: true,
      iconBg: 'bg-tp-primary/10',
    },
    {
      id: 'price',
      icon: <Bell className="size-5 text-tp-secondary" />,
      title: 'Price Alerts',
      description: 'Receive alerts when assets hit your target prices.',
      enabled: true,
      iconBg: 'bg-tp-secondary/10',
    },
    {
      id: 'security',
      icon: <Shield className="size-5 text-tp-primary" />,
      title: 'Security Notifications',
      description: 'Important alerts about account security and login activity.',
      enabled: true,
      iconBg: 'bg-tp-primary/10',
    },
    {
      id: 'marketing',
      icon: <Megaphone className="size-5 text-tp-on-surface-variant" />,
      title: 'Marketing & Insights',
      description: 'Weekly market insights, tips, and promotional offers.',
      enabled: false,
      iconBg: 'bg-muted',
    },
  ])

  const handleToggle = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you want to receive.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {notifications.map((setting) => (
          <NotificationItem key={setting.id} setting={setting} onToggle={handleToggle} />
        ))}
      </CardContent>
    </Card>
  )
}

function PasswordInput({
  id,
  label,
  placeholder,
}: {
  id: string
  label: string
  placeholder: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-tp-on-surface-variant hover:text-tp-on-surface transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function SessionCard({ session, onLogout }: { session: SessionInfo; onLogout: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-tp-outline-variant/50 hover:bg-tp-surface-container-low transition-colors">
      <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        {session.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm sm:text-base font-medium text-tp-on-surface truncate">
            {session.device}
          </h4>
          {session.isActive && (
            <Badge className="bg-tp-secondary/10 text-tp-secondary hover:bg-tp-secondary/20 border-0 text-[10px] px-1.5 py-0">
              Active Now
            </Badge>
          )}
        </div>
        <p className="text-xs sm:text-sm text-tp-on-surface-variant mt-0.5">
          {session.location} · {session.time}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-tp-on-surface-variant hover:text-tp-tertiary shrink-0"
        onClick={() => onLogout(session.id)}
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline ml-1">Logout</span>
      </Button>
    </div>
  )
}

function SecuritySettings() {
  const [sessions, setSessions] = useState<SessionInfo[]>([
    {
      id: 'mac',
      device: 'Mac OS · Chrome',
      location: 'San Francisco, US',
      time: 'Active Now',
      icon: <Monitor className="size-5 text-tp-primary" />,
      isActive: true,
    },
    {
      id: 'iphone',
      device: 'iPhone 15 · Safari',
      location: 'San Francisco, US',
      time: '2 hours ago',
      icon: <Smartphone className="size-5 text-tp-on-surface-variant" />,
      isActive: false,
    },
    {
      id: 'windows',
      device: 'Windows 11 · Edge',
      location: 'New York, US',
      time: '3 days ago',
      icon: <Monitor className="size-5 text-tp-on-surface-variant" />,
      isActive: false,
    },
  ])

  const handleLogout = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-tp-secondary/5 border border-tp-secondary/20">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-tp-secondary/10">
                <ShieldCheck className="size-5 text-tp-secondary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-medium text-tp-on-surface">
                    Status
                  </span>
                  <Badge className="bg-tp-secondary/10 text-tp-secondary hover:bg-tp-secondary/20 border-0 text-xs">
                    Enabled
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-tp-on-surface-variant mt-0.5">
                  Your account is protected with 2FA
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-tp-primary/30 text-tp-primary hover:bg-tp-primary/5 shrink-0 w-fit"
            >
              <ExternalLink className="size-3.5" />
              Manage 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PasswordInput id="currentPassword" label="Current Password" placeholder="Enter current password" />
          <PasswordInput id="newPassword" label="New Password" placeholder="Enter new password" />
          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            placeholder="Confirm new password"
          />
          <div className="flex justify-end pt-2">
            <Button className="bg-tp-primary hover:bg-tp-primary/90 text-white gap-2">
              <Lock className="size-4" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions and logout from other devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} onLogout={handleLogout} />
            ))
          ) : (
            <div className="py-8 text-center text-sm text-tp-on-surface-variant">
              No active sessions found.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-tp-tertiary/30">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg text-tp-tertiary">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-tp-tertiary/5 border border-tp-tertiary/20">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-tp-tertiary/10">
                <Trash2 className="size-5 text-tp-tertiary" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-medium text-tp-tertiary">Delete Account</p>
                <p className="text-xs sm:text-sm text-tp-on-surface-variant mt-0.5">
                  Once you delete your account, there is no going back.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 bg-tp-tertiary hover:bg-tp-tertiary/90 shrink-0 w-fit"
            >
              <Trash2 className="size-3.5" />
              Close Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('personal')
  const personalRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const securityRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (tab: string) => {
    setActiveTab(tab)
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      personal: personalRef,
      notifications: notificationsRef,
      security: securityRef,
    }
    const ref = refMap[tab]
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-tp-surface">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-tp-on-surface">Settings</h1>
          <p className="text-sm sm:text-base text-tp-on-surface-variant mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <QuickAccessCard
            icon={<User className="size-5 sm:size-6" />}
            title="Personal Info"
            description="Update your profile and contact details"
            onClick={() => scrollToSection('personal')}
          />
          <QuickAccessCard
            icon={<Bell className="size-5 sm:size-6" />}
            title="Notifications"
            description="Configure your notification preferences"
            onClick={() => scrollToSection('notifications')}
          />
          <QuickAccessCard
            icon={<Shield className="size-5 sm:size-6" />}
            title="Security"
            description="Manage password and 2FA settings"
            onClick={() => scrollToSection('security')}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-fit mb-6">
            <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm">
              <User className="size-3.5 sm:size-4" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm">
              <Bell className="size-3.5 sm:size-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="size-3.5 sm:size-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Personal Info */}
          <TabsContent value="personal" ref={personalRef}>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">
              <ProfileCard />
              <PersonalInfoForm />
            </div>
          </TabsContent>

          {/* Tab 2: Notifications */}
          <TabsContent value="notifications" ref={notificationsRef}>
            <NotificationSettings />
          </TabsContent>

          {/* Tab 3: Security */}
          <TabsContent value="security" ref={securityRef}>
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
