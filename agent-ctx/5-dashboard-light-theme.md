# Task ID: 5 - Dashboard Light Theme Redesign

## Agent: Dashboard Redesign Agent

## Task: Redesign dashboard page to match Groww/Sahi.com style LIGHT theme

## Work Log:

- Completely rewrote `/home/z/my-project/src/components/tradepro/pages/dashboard-page.tsx`
- Applied Groww/Sahi.com light theme design system:
  - Background: #f5f7fa (light gray)
  - Cards: White (#ffffff) with subtle border (#e5e7eb) and border-radius: 12px
  - Primary color: #5367ff (blue) — replaces amber-500
  - Profit color: #00d09c (teal green) — replaces emerald-500
  - Loss color: #eb5b3c (red-orange) — replaces red-500
  - Headings: #1a1a2e (dark) — replaces white
  - Secondary text: #6b7280 (gray) — replaces gray-400
  - Skeleton loaders: #f0f0f5 — replaces #1f2937

### Section Changes:

1. **Market Pulse**:
   - LIVE badge: green pill (#00d09c/10 bg with #00d09c text + animated dot)
   - NSE label: white card with gray border
   - Index cards: white bg with hover border #5367ff/30
   - Green/red indicators use #00d09c / #eb5b3c

2. **Stats Grid** (4 cards):
   - Total Balance: #5367ff left border, #1a1a2e amount, #00d09c return
   - Today's P&L: #00d09c/#eb5b3c left border (conditional), progress bar with matching colors
   - Win Rate: #5367ff left border
   - Total Trades: #6b7280 left border, #5367ff open positions text

3. **Active Positions Table**:
   - White card with clean table
   - Light header row: bg-[#f8f9fb]
   - P&L pills: rounded-md with #00d09c/10 or #eb5b3c/10 bg
   - Empty state: briefcase icon on #f5f7fa bg, "Start Trading" button in #5367ff

4. **Trade Feed**:
   - Timeline with colored dots (#5367ff for blue, #00d09c for green, #eb5b3c for red)
   - BUY labels in #00d09c, SELL labels in #eb5b3c
   - White border dots instead of filled icon circles
   - Empty state: clock icon on #f5f7fa bg

5. **Quick Actions** (3 cards):
   - Smart Analytics: #5367ff icon, #5367ff border on hover
   - Risk Monitor: #eb5b3c icon, #eb5b3c border on hover
   - Strategy Lab: #00d09c icon, #00d09c border on hover

6. **Floating "New Trade" button**: #5367ff rounded-full with Plus icon (white text)

### Preserved:
- All data fetching logic (fetchPortfolio, fetchPositions, fetchTrades, fetchMarketIndices)
- IndexDetailDrawer integration
- Auto-refresh every 10 seconds
- openIndexDetail event listener
- All state management and derived values
- Fallback data structures
- Animation variants (stagger, motion)

## Lint: Passes cleanly
## Dev Server: Running without errors
