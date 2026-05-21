# Task 3-a: Sidebar Redesign - Groww/Sahi.com Light Theme

## Agent
Sidebar Redesign Agent

## Task
Redesign the sidebar component at `/home/z/my-project/src/components/tradepro/sidebar.tsx` to match a Groww/Sahi.com style LIGHT theme.

## Work Log

- Completely rewrote `/home/z/my-project/src/components/tradepro/sidebar.tsx`:
  - **Background**: Changed from dark `#111827` to clean white `#ffffff`
  - **Border**: Changed from dark `#1f2937` to light `#e5e7eb`
  - **Width**: Changed from `260px` to `240px`
  - **Branding**: Changed from "StockVerse" / "Market Simulator" to "TradePro" / "Indian Market Platform"
  - **Logo icon**: Changed from amber gradient to solid blue (`#5367ff`) with rounded-lg
  - **User profile card**: Light gray background (`#f9fafb`) with blue avatar initials (`#5367ff` bg, white text)
  - **Active nav item**: Light blue background (`#eef0ff`) with blue text (`#5367ff`) and blue left border (`3px solid #5367ff`)
  - **Inactive nav item**: Gray text (`#6b7280`) with gray icons (`#9ca3af`)
  - **Hover state on profile card**: `hover:bg-[#f3f4f6]` (subtle light gray)
  - **Sign Out hover**: Red-orange tinted hover (`hover:bg-[#fef2f2]`) with red-orange text (`#eb5b3c`)
  - **Separator lines**: Light gray `#e5e7eb`
  - **Transitions**: Smooth `150ms` duration throughout
  - **Focus rings**: Blue-based `focus-visible:ring-[#5367ff]/20`
  - **Scrollbar**: Light themed (track transparent, thumb `#d1d5db`, hover `#9ca3af`)
  - **Font size**: Nav items `text-[13px]` for clean, minimal look
  - **Removed**: Active dot indicator (was amber dot, now just blue left border)
  - **Preserved**: All 9 nav items with correct PageId mappings
  - **Preserved**: Profile + Sign Out at bottom with separator
  - **Preserved**: All props (onLogout, userName, userEmail, userRole)
  - **Preserved**: Mobile hidden (`hidden md:flex`)
  - **Preserved**: useAppStore for navigation state
  - **Preserved**: ScrollArea, Avatar, AvatarFallback component usage

- Color system applied:
  - Primary: `#5367ff` (blue) - replaces amber
  - Profit: `#00d09c` (teal green) - used for Sign Out hover context
  - Loss: `#eb5b3c` (red-orange) - used for Sign Out hover state
  - Active background: `#eef0ff` (light blue)
  - Active text/border: `#5367ff` (blue)
  - Inactive text: `#6b7280` (gray)
  - Inactive icons: `#9ca3af` (light gray)
  - Surface: `#f9fafb` (near white)
  - Borders/separators: `#e5e7eb` (light gray)

- Lint passes cleanly (no errors)
- Dev server running without compilation errors

## Stage Summary
- Complete sidebar redesign from dark amber theme to clean white Groww/Sahi.com style light theme
- TradePro branding with "Indian Market Platform" tagline
- Blue (#5367ff) primary color system replacing amber
- Clean, minimal design with subtle shadows and smooth 150ms transitions
- All existing functionality and props preserved
