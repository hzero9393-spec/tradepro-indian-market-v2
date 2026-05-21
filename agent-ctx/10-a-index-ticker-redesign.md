# Task 10-a: IndexTicker Light Theme Redesign

## Task
Redesign the IndexTicker component to match Groww/Sahi.com style LIGHT theme.

## Changes Made
- **File**: `/home/z/my-project/src/components/tradepro/index-ticker.tsx`

### Visual Design Changes
1. **Background**: Changed from dark `#111827` to white `#ffffff`
2. **Bottom border**: Changed from `#1f2937` (dark) to `#e5e7eb` (light gray)
3. **Top position**: Kept at `top-[56px]` below topbar
4. **Height**: Set explicitly to `32px`
5. **Market status badge**:
   - OPEN: Green `#00d09c` with pulsing dot animation (ping effect)
   - PRE-OPEN: Amber `#f59e0b` with static dot
   - CLOSED: Red `#eb5b3c` with static dot
   - Pill/badge style with colored background at 10% opacity
6. **Separator**: Clean `border-r border-[#e5e7eb]` between status badge and indices
7. **Index items**:
   - Symbol: `#6b7280` (gray), bold, uppercase
   - Price: `#1a1a2e` (dark), font-mono
   - Change: `#00d09c` (green) or `#eb5b3c` (red) with arrow icons
   - Hover: `#eef0ff` (light blue) background
   - Changed from `div` to `button` for semantic clickable element
8. **Removed**: `Activity` icon import (replaced with dot-based status indicator)
9. **Custom event**: `openIndexDetail` dispatch preserved on click

### Data Fetching Logic
- All existing data fetching logic preserved exactly (API calls, fallback mock data, 30s refresh interval)
- State management unchanged
- `useEffect` with `fetchData` + interval pattern unchanged

## Verification
- Lint passes cleanly
- Dev server running without errors
- Component renders with light theme styling
