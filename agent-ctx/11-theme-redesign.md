# Task 11 - Main Page Light Theme Redesign

## Agent: Theme Redesign Agent

## Task
Redesign the main page at `/home/z/my-project/src/app/page.tsx` to use the new Groww-style LIGHT theme, replacing the existing dark theme.

## Work Log

### Changes Applied to `/home/z/my-project/src/app/page.tsx`

1. **Background**: Changed from `#0a0e17` (dark navy) to `#f5f7fa` (light gray)
2. **Brand name**: Changed from "StockVerse" to "TradePro"
3. **Primary color**: Changed from amber (`#f59e0b` / `#d97706`) to blue (`#5367ff`)
4. **Loading screen**:
   - Light background (`#f5f7fa`) instead of dark (`#0a0e17`)
   - TradePro logo in blue (`#5367ff`) instead of amber gradient
   - "TradePro" text in dark (`#1a1a2e`) instead of white (`#f9fafb`)
   - "Loading your trading desk..." in gray (`#6b7280`) — kept same
   - Blue bouncing dots (`#5367ff`) instead of amber (`bg-amber-500`)
5. **Sheet/Sidebar mobile**:
   - White background (`#ffffff`) instead of dark (`#111827`)
   - Border: `#e5e7eb` instead of `#1f2937`
   - Width: `240px` instead of `260px`
6. **Footer**:
   - White background (`#ffffff`) instead of dark (`#111827`)
   - Border: `#e5e7eb` instead of `#1f2937`
   - Brand text: dark (`#1a1a2e`) instead of white (`#f9fafb`)
   - Logo icon: blue (`#5367ff`) instead of amber gradient
7. **Main content area**: Changed `pt-20 pb-20 md:pb-0` to `pt-16 pb-16 md:pb-0`
8. **Sidebar offset**: Changed `md:ml-[260px]` to `md:ml-[240px]`

### Preserved
- All existing imports and page routing logic intact
- All component props and state management unchanged
- Auth flow, logout handling, Sheet behavior unchanged
- TradeSuccessProvider wrapper unchanged
- PageContent routing switch unchanged

## Verification
- Lint passes cleanly (no new errors)
- Dev server running without compilation errors
