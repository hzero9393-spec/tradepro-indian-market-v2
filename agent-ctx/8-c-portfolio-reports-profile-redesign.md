# Task 8-c: Portfolio/Reports/Profile Page Redesign

## Agent: Portfolio/Reports/Profile Redesign Agent

## Summary
Redesigned three pages (Portfolio, Reports, Profile) with the professional dark trading theme, applying all headline changes, color system updates, and visual styling specified in the task.

## Changes Made

### 1. Portfolio Page (`portfolio-page.tsx`)
- **Headlines**: Portfolio Overview → Portfolio Tracker, Open Positions → Active Holdings, Portfolio Allocation → Asset Allocation, Account Summary → Account Details
- **Summary cards**: Dark bg (#111827) with colored left borders (amber, gray, emerald, red)
- **P&L colors**: emerald-500 for profit, red-500 for loss
- **Square Off button**: orange-500 styling with hover:bg-orange-500 hover:text-white
- **New Trade button**: amber-500 bg with black text
- **Pie chart tooltip**: Dark themed
- **Allocation colors**: amber-500 for Equity, #374151 for Cash
- **All functionality preserved**: auto-refresh, square off API, portfolio/positions fetch

### 2. Reports Page (`reports-page.tsx`)
- **Headlines**: Reports & Analytics → Performance Analytics, Cumulative P&L Over Time → P&L Curve, Win/Loss Distribution → Win/Loss Ratio, Segment-wise Breakdown → Segment Analysis, Trade History → Trade Log
- **Stats cards**: Dark bg with emerald/red/amber left borders
- **Area chart**: emerald-500/red-500 gradients for profit/loss
- **Axis/grid**: Dark themed (#9ca3af ticks, rgba white grid lines)
- **Custom tooltip**: Dark bg (#111827) with proper border
- **Win/Loss donut**: emerald-500/red-500 colors
- **Segment colors**: amber-500 Equity, emerald-500 Futures, red-500 Options
- **Start Trading button**: amber-500 bg with black text
- **All functionality preserved**: all computed metrics, charts, trade log

### 3. Profile Page (`profile-page.tsx`)
- **Headlines**: Profile & Account → My Account, Capital Overview → Account Balance, Account Statistics → Trading Stats
- **Profile card**: Dark bg with amber-500 accent avatar ring
- **Account balance card**: amber-500 left border
- **Stats grid**: Colored left borders (amber, emerald, red, gray)
- **Reset Account button**: red-500 themed
- **New Trade button**: amber-500 bg with black text
- **All functionality preserved**: profile display, portfolio fetch, reset account

## Verification
- ESLint: All three files pass lint cleanly (only pre-existing admin page error)
- Dev server: Running without compilation errors
