# Task 3+4: Seed Data Script & Backend API Routes

## Task 3: Seed Data Script

### What was done:
- Created `/home/z/my-project/prisma/seed.ts` with comprehensive Indian market data
- Added `"db:seed": "bun run prisma/seed.ts"` to package.json
- Successfully seeded the Supabase PostgreSQL database

### Seed Data Summary:
| Category | Count | Details |
|----------|-------|---------|
| Indices | 5 | NIFTY, BANKNIFTY, SENSEX, FINNIFTY, MIDCPNIFTY |
| Stocks | 20 | NSE F&O stocks with realistic prices, sectors, fundamentals |
| Sectors | 8 | Banking, IT, Pharma, Auto, FMCG, Metal, Energy, Realty |
| Holidays | 12 | 2026 Indian market holidays including Diwali Muhurat |
| F&O Bans | 2 | DELTACORP, GNFC |
| Options | 42 | NIFTY option chain (21 strikes × CE/PE) |
| Futures | 5 | All 5 index futures with basis, margin, OI |
| Challenges | 3 | RETURN_SPRINT, RISK_MANAGER, VOLUME_MASTER |
| Learning | 3 paths, 26 modules | Beginner (8), Technical Analysis (12), Risk Management (6) |
| Breadth | 1 | Today's market breadth snapshot |

### Key decisions:
- Used 2026 dates for holidays (system date is 2026)
- Used DIRECT_URL for seed script to avoid PgBouncer prepared statement issues
- Used dotenv with override for seed script (system env has stale DATABASE_URL)

---

## Task 4: Backend API Routes

### What was done:
Created 16 API route files under `/home/z/my-project/src/app/api/`:

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 1 | `/api/indices` | GET | All enabled indices with prices |
| 2 | `/api/stocks` | GET | Stocks with ?search, ?sector, ?fnoOnly filters |
| 3 | `/api/stocks/gainers` | GET | Top 10 gainers by changePercent |
| 4 | `/api/stocks/losers` | GET | Top 10 losers by changePercent |
| 5 | `/api/options/chain/[underlying]` | GET | Option chain with PCR and Max Pain calculation |
| 6 | `/api/options/expiries/[underlying]` | GET | Available expiry dates (weekly/monthly) |
| 7 | `/api/options/ban-list` | GET | Current F&O ban entries |
| 8 | `/api/futures/[underlying]` | GET | Futures data for underlying |
| 9 | `/api/market/status` | GET | Market status (OPEN/CLOSED/PRE-OPEN/POST-CLOSE) based on IST |
| 10 | `/api/market/breadth` | GET | Latest market breadth data |
| 11 | `/api/market/holidays` | GET | Market holidays for current year |
| 12 | `/api/sectors` | GET | All sectors with performance |
| 13 | `/api/challenges` | GET | Active and upcoming challenges |
| 14 | `/api/learning` | GET | Learning paths with modules |

### Key implementation details:
- **Options chain**: Calculates PCR (Total PE OI / Total CE OI) and Max Pain (strike with minimum total option writer loss)
- **Market status**: IST-based with support for Muhurat trading sessions, weekends, and holidays
- **Stock filters**: Search by symbol/name, filter by sector, F&O availability
- **All routes**: Proper error handling with try/catch, NextResponse.json() responses

### Critical fix: Database connection
- Updated `src/lib/db.ts` to resolve DATABASE_URL from .env file directly when system env has stale SQLite URL
- Added fallback: system env → APP_DATABASE_URL → parse .env file
- Added PrismaClient cache invalidation for dev hot-reload scenarios
- Added APP_DATABASE_URL to .env as redundant fallback

### Verification:
- All 16 endpoints tested and returning correct data
- `bun run lint` passes clean (0 errors)
- Dev server running without issues
