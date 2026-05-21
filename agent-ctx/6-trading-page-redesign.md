# Task 6 - Trading Page Redesign (Groww/Sahi.com Light Theme)

## Agent: Trading Page Redesign Agent

## Task
Redesign the trading/stocks page at `/home/z/my-project/src/components/tradepro/pages/trading-page.tsx` to match a Groww/Sahi.com LIGHT theme.

## Work Log

### Complete Rewrite of trading-page.tsx

**Design System Applied:**
- Background: `#f5f7fa` (light gray) — replaces `#0a0e17` dark background
- Cards: White (`#ffffff`) with border `#e5e7eb` and `rounded-xl` — replaces `#111827` dark cards
- Primary color: `#5367ff` (blue) — replaces amber-500
- Profit color: `#00d09c` (teal green) — replaces emerald-500
- Loss color: `#eb5b3c` (red-orange) — replaces red-500
- Headings: `#1a1a2e` (dark) — replaces white
- Secondary text: `#6b7280` (gray) — replaces gray-400
- Skeleton loaders: `#f0f0f5` — replaces `#1f2937`
- Row dividers: `#f0f2f5` — clean light dividers

**Layout Changes:**
1. **Header** — "Stocks" title with search bar, market stats bar (Advancing/Declining/Unchanged counts), refresh button
2. **Tab filters** — Pill-style tabs: All | NIFTY 50 | Bank Nifty | F&O | Gainers | Losers with `#5367ff` active state
3. **Stock list** — Clean table/card layout:
   - Table header with `#f8f9fb` background
   - Each row: Stock name + symbol, sector tag (colored), LTP (large, font-mono), change in green/red pill
   - Clickable rows with `#f8f9fb` hover state
   - Clean `#f0f2f5` dividers between rows
   - Scrollable list with `max-h-[calc(100vh-320px)]`
4. **Order panel** — Right sidebar on desktop (sticky), bottom sheet on mobile
   - Light themed inputs with `#e5e7eb` borders and `#5367ff` focus rings
   - Buy button: `#00d09c`, Sell button: `#eb5b3c`
   - Order summary with `#f5f7fa` background
5. **Open positions** — Quick view cards at bottom (only shown if positions exist)
6. **Floating trade button** — Mobile-only `#5367ff` button to open order sheet

**API Integration:**
- Fetches stocks from `/api/trade/stocks` with auth token from `useAuthStore`
- Fetches gainers from `/api/stocks/gainers` (no auth required)
- Fetches losers from `/api/stocks/losers` (no auth required)
- All tab filtering is client-side based on fetched data
- NIFTY 50 / Bank Nifty filtered using symbol sets
- F&O tab filters by `isFuturesAvailable || isOptionsAvailable`

**Empty/Loading/Error States:**
- Skeleton loaders during data fetch (8 rows)
- "Markets data unavailable" error card with retry button when API fails
- Tab-specific empty states (e.g., "No gainers found")
- Search-specific empty state ("No stocks match your search")

**No Demo Data:**
- Removed all static/dummy data (marketNews, generateChartData, generateSparkline, chartConfig)
- Removed chart area and watchlist bar (replaced with stock list)
- All data comes exclusively from API endpoints

**Component Architecture:**
- `StockRow` — Individual stock row component with animation
- `SkeletonRow` — Loading skeleton for stock rows
- `OrderPanel` — Order placement panel (reusable for desktop sidebar and mobile sheet)
- `TradingPage` — Main page component orchestrating everything
- Uses `framer-motion` for staggered list animations, tab transitions, mobile sheet

**Preserved Functionality:**
- Trade execution via `/api/trade/place`
- Trade success popup integration
- Position refresh after trade
- Portfolio/balance display
- Square off capability through positions page navigation

## Stage Summary
- Complete redesign from dark trading terminal to Groww/Sahi.com light theme stock listing page
- Design system: `#f5f7fa` bg, white cards, `#e5e7eb` borders, `#5367ff` primary, `#00d09c` profit, `#eb5b3c` loss
- Pill-style tab filters with market stats
- Clean table layout with sector tags and change pills
- Responsive: desktop 2-column layout with sticky sidebar, mobile bottom sheet for orders
- All API integration preserved, no demo data
- Lint passes cleanly, dev server running without errors
