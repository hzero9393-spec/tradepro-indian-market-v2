'use client'

import { Card, CardContent } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-[#6b7280]">Total Users</p>
            <p className="font-mono text-xl font-bold text-[#1a1a1a]">1,310</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-[#6b7280]">Active Users</p>
            <p className="font-mono text-xl font-bold text-[#1a1a1a]">856</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-[#6b7280]">Paid Users</p>
            <p className="font-mono text-xl font-bold text-[#1a1a1a]">234</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#e5e7eb] rounded-xl">
          <CardContent className="p-4">
            <p className="text-xs text-[#6b7280]">Revenue</p>
            <p className="font-mono text-xl font-bold text-[#1a1a1a]">₹88,200</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
