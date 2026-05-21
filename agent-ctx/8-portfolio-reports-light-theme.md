# Task 8 - Portfolio & Reports Light Theme Redesign

## Summary
Redesigned both Portfolio Page and Reports Page from dark theme to Groww/Sahi.com LIGHT theme.

## Files Modified
1. `/home/z/my-project/src/components/tradepro/pages/portfolio-page.tsx` — Complete rewrite
2. `/home/z/my-project/src/components/tradepro/pages/reports-page.tsx` — Complete rewrite

## Design System Applied
- Background: #f5f7fa
- Cards: White (#ffffff) with border #e5e7eb, rounded-xl
- Primary: #5367ff
- Profit: #00d09c
- Loss: #eb5b3c
- Headings: #1a1a2e
- Secondary text: #6b7280
- Skeleton loaders: #f0f0f5
- Table header bg: #f8f9fb
- Sub-card bg: #f8f9fb

## Portfolio Page Key Changes
- Total Portfolio Value hero card with Available Balance / Invested / Current Value breakdown sub-cards
- 4 summary cards: Total P&L, Unrealized P&L, Realized P&L, Open Positions
- Holdings table with Symbol (#5367ff), P&L pills, empty state "Your portfolio is empty"
- Segment Breakdown cards: Equity (#5367ff), Futures (#00d09c), Options (#eb5b3c)
- Asset Allocation donut chart with allocation bar
- Account Details card with #5367ff left border
- All data from /api/trade/portfolio and /api/trade/positions with auth token
- No demo data

## Reports Page Key Changes
- 4 summary cards: Total Trades, Win Rate, Total P&L, Avg P&L/Trade
- P&L Trend placeholder with "Analytics coming soon" message
- Win/Loss Summary with visual progress bar and detailed breakdown
- Segment Breakdown computed from trade data
- Recent Trades table with max-h-96 scroll
- Performance Summary footer card
- All data from /api/trade/trades with auth token
- No demo data, no Recharts imports

## Verification
- Lint passes cleanly
- Dev server running without errors
