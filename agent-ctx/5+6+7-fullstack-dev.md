# Task 5+6+7 - Option Chain & Futures Pages

## Summary
Built Option Chain page (NSE-style) and Futures Trading page for TradePro platform, plus updated navigation.

## Files Modified
- `/home/z/my-project/src/lib/store.ts` - Added 'optionChain' and 'futures' to PageId type
- `/home/z/my-project/src/components/tradepro/sidebar.tsx` - Added GitBranch (Option Chain) and TrendingUpIcon (Futures) nav items
- `/home/z/my-project/src/app/page.tsx` - Added imports and switch cases for both new pages

## Files Created
- `/home/z/my-project/src/components/tradepro/pages/option-chain-page.tsx` - Full NSE-style option chain
- `/home/z/my-project/src/components/tradepro/pages/futures-page.tsx` - Futures trading with chart, order panel, positions

## Key Design Decisions
- Option chain uses mock data generation with realistic OI/LTP/IV patterns
- PCR gauge built with SVG (no external dependency)
- OI bars use simple div-based approach (no recharts needed)
- Futures chart uses recharts AreaChart with gradient fill
- Both pages fully responsive with mobile card layouts
- All data is static/mock, structured for future API integration
- Quick Trade modal on option chain rows (Dialog component)
