# Task 4 - Auth Page Light Theme Redesign

## Task
Redesign the auth page at `/home/z/my-project/src/components/tradepro/auth-page.tsx` to match a Groww/Sahi.com style LIGHT theme.

## Work Done

### Complete visual redesign from dark theme to light theme

**Left Panel (desktop only):**
- Clean white background (`#ffffff`) with subtle blue gradient radial accents (`#5367ff`) in top-right and bottom-left corners
- Thin blue grid pattern overlay at very low opacity (3%) for subtle texture
- TradePro logo with `#5367ff` blue icon on light blue (`#5367ff/10`) background
- Headline "Master Indian Markets" with "Before You Invest" in `#5367ff` blue
- Description in `#6b7280` gray
- 3 feature cards with:
  - Icons in blue circles (`#5367ff/10` bg, `#5367ff` icon color)
  - Light gray card bg (`#f7f8fc`) with `#e8eaf0` border
  - Titles in `#1a1a2e` dark, descriptions in `#6b7280` gray
- Stats row: 50+ NSE Stocks, 5 Indices, ₹1L Virtual Cash in matching light cards

**Right Panel:**
- Light gray outer background (`#f7f8fc`)
- White card with `#e8eaf0` border and subtle shadow
- Input fields: `#f0f2f5` background, `#e8eaf0` border, `#5367ff` focus border, white bg on focus
- 46px tall inputs for comfortable touch targets
- `#5367ff` blue primary button with subtle blue shadow
- `#4356e0` hover state on blue button
- Password visibility toggle with gray icons
- Error messages in `#eb5b3c` red on light red tinted background
- Success messages in `#22c55e` green on light green tinted background
- Password strength indicator with colored bars (red/amber/green) on light gray track
- Password match/mismatch indicators
- Terms checkbox with `#5367ff` accent
- Switch links in `#5367ff` blue

**Mobile:**
- Only shows the form panel with TradePro logo on top
- Logo uses same `#5367ff` blue styling

**Bottom Text:**
- "Secure • Made in India • ₹0 Cost" - no emojis, just text with dot separators

### All existing logic preserved:
- `handleLogin` function with API call to `/api/auth/login`
- `handleSignup` function with validation and API call to `/api/auth/register`
- Form state management (name, email, phone, password, confirmPassword)
- `resetForm` and `switchMode` functions
- `getPasswordStrength` function (updated with `textColor` property)
- Loading states with spinner animation
- Error/success message display with Framer Motion animations
- `useAuthStore` integration with `setAuth`
- AnimatePresence for mode switching transitions

## Verification
- Lint passes cleanly (no new errors)
- Dev server running without compilation errors
