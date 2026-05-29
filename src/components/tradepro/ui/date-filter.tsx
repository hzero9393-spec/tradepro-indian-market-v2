'use client'

import { Calendar } from 'lucide-react'

export type DatePreset = 'all' | 'today' | 'tomorrow' | 'yesterday' | 'week' | 'month' | 'custom'

export interface DateFilterProps {
  value: DatePreset
  customFrom: string | null  // YYYY-MM-DD
  customTo: string | null    // YYYY-MM-DD
  onChange: (preset: DatePreset, from: string | null, to: string | null) => void
}

// ─── Helper: Calculate date range from preset ───────────────────

export function getDateRange(preset: DatePreset, customFrom?: string | null, customTo?: string | null): { from: string | null; to: string | null } {
  const now = new Date()

  switch (preset) {
    case 'all':
      return { from: null, to: null }

    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      return { from: start.toISOString(), to: end.toISOString() }
    }

    case 'tomorrow': {
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0)
      const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999)
      return { from: start.toISOString(), to: end.toISOString() }
    }

    case 'yesterday': {
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0)
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999)
      return { from: start.toISOString(), to: end.toISOString() }
    }

    case 'week': {
      // Start from Monday of this week
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday)
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate(), 0, 0, 0, 0)
      return { from: start.toISOString(), to: now.toISOString() }
    }

    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      return { from: start.toISOString(), to: now.toISOString() }
    }

    case 'custom': {
      if (customFrom && customTo) {
        // Use local time (not UTC) so IST users see their local day boundaries
        const [fy, fm, fd] = customFrom.split('-').map(Number)
        const [ty, tm, td] = customTo.split('-').map(Number)
        const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0)
        const to = new Date(ty, tm - 1, td, 23, 59, 59, 999)
        return { from: from.toISOString(), to: to.toISOString() }
      }
      if (customFrom) {
        const [fy, fm, fd] = customFrom.split('-').map(Number)
        const from = new Date(fy, fm - 1, fd, 0, 0, 0, 0)
        return { from: from.toISOString(), to: null }
      }
      if (customTo) {
        const [ty, tm, td] = customTo.split('-').map(Number)
        const to = new Date(ty, tm - 1, td, 23, 59, 59, 999)
        return { from: null, to: to.toISOString() }
      }
      return { from: null, to: null }
    }

    default:
      return { from: null, to: null }
  }
}

// ─── Helper: Filter items by date range (client-side) ───────────

export function filterByDateRange<T>(
  items: T[],
  dateField: keyof T,
  from: string | null,
  to: string | null
): T[] {
  if (!from && !to) return items

  return items.filter(item => {
    const dateValue = item[dateField]
    if (!dateValue || typeof dateValue !== 'string') return true

    const itemTime = new Date(dateValue).getTime()

    if (from && itemTime < new Date(from).getTime()) return false
    if (to && itemTime > new Date(to).getTime()) return false

    return true
  })
}

// ─── Component ───────────────────────────────────────────────────

const presets: { key: DatePreset; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom' },
]

export function DateFilter({ value, customFrom, customTo, onChange }: DateFilterProps) {
  const handlePresetChange = (preset: DatePreset) => {
    const range = getDateRange(preset, customFrom, customTo)
    onChange(preset, range.from, range.to)
  }

  const handleCustomFromChange = (newFrom: string) => {
    const range = getDateRange('custom', newFrom, customTo)
    onChange('custom', range.from, range.to)
  }

  const handleCustomToChange = (newTo: string) => {
    const range = getDateRange('custom', customFrom, newTo)
    onChange('custom', range.from, range.to)
  }

  return (
    <div className="space-y-2.5">
      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Calendar className="size-3.5 text-[#6b7280] mr-1 shrink-0" />
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePresetChange(preset.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              value === preset.key
                ? 'bg-[#00D09C] text-white shadow-sm'
                : 'bg-[#f5f7fa] text-[#6b7280] hover:bg-[#eef0f4] hover:text-[#1a1a1a]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {value === 'custom' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pl-6">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#6b7280] whitespace-nowrap">From</label>
            <input
              type="date"
              value={customFrom || ''}
              onChange={(e) => handleCustomFromChange(e.target.value)}
              className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#00D09C]/30 focus:border-[#00D09C] transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-[#6b7280] whitespace-nowrap">To</label>
            <input
              type="date"
              value={customTo || ''}
              onChange={(e) => handleCustomToChange(e.target.value)}
              className="h-8 rounded-lg border border-[#e5e7eb] bg-white px-2.5 text-xs text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#00D09C]/30 focus:border-[#00D09C] transition-all"
            />
          </div>
        </div>
      )}
    </div>
  )
}
