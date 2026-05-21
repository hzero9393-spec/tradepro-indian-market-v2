# Task 3-c: Mobile Bottom Navigation Redesign (Groww/Sahi.com Light Theme)

## Work Log
- Rewrote `/home/z/my-project/src/components/tradepro/mobile-nav.tsx` with Groww/Sahi.com style LIGHT theme
- Changed from dark theme (#111827 bg, amber #fbbf24 accents) to light theme
- Design changes applied:
  - Height: 64px (h-16) → 56px (h-14) per spec
  - Background: #111827 → #ffffff (white)
  - Top border: #1f2937 → #e5e7eb (light gray)
  - Active color: #fbbf24 (amber) → #5367ff (blue)
  - Inactive color: #6b7280 → #9ca3af (gray)
  - Active dot: #f59e0b (amber) → #5367ff (blue)
  - Transition duration: 200ms → 150ms
  - Removed scale-105 animation on active icon (clean, minimal per spec)
  - Removed extra wrapping div around icon+dot
  - Kept focus-visible ring but updated to blue (#5367ff/20)
  - No shadows applied (clean, minimal)
- All 5 nav items preserved: Home, Stocks, Positions, Orders, Portfolio
- Safe area inset preserved: env(safe-area-inset-bottom)
- md:hidden preserved for mobile-only visibility
- Lint passes cleanly
- Dev server running without errors

## Stage Summary
- Complete mobile nav redesign from dark amber theme to Groww/Sahi.com style light theme
- White background with subtle gray top border
- Blue (#5367ff) active state with dot indicator
- Gray (#9ca3af) inactive state
- Clean, minimal design with 150ms smooth transitions
- All existing functionality (useAppStore, PageId, navigation) fully preserved
