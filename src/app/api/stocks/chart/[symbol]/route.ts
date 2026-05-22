import { NextRequest, NextResponse } from 'next/server'

const GATEWAY_URL = 'https://internal-api.z.ai'
const API_PREFIX = '/external/finance'

function getYahooSymbol(symbol: string): string {
  return `${symbol}.NS`
}

const INTERVAL_MAP: Record<string, string> = {
  '1D': '5m',
  '1W': '30m',
  '1M': '1d',
  '3M': '1d',
  '6M': '1wk',
  '1Y': '1wk',
  '5Y': '1mo',
}

const LIMIT_MAP: Record<string, number> = {
  '1D': 78,
  '1W': 70,
  '1M': 22,
  '3M': 65,
  '6M': 26,
  '1Y': 52,
  '5Y': 60,
}

// Generate realistic mock chart data for stocks
function generateMockChartData(symbol: string, range: string, basePrice: number) {
  const count = LIMIT_MAP[range] || 30
  const now = Date.now()
  const data = []

  let price = basePrice * (0.95 + Math.random() * 0.05)
  const volatility = basePrice > 5000 ? 0.012 : basePrice > 500 ? 0.018 : 0.025

  for (let i = count - 1; i >= 0; i--) {
    const change = (Math.random() - 0.48) * volatility * price
    price = Math.max(price * 0.9, price + change)
    const open = price - (Math.random() - 0.5) * basePrice * 0.005
    const high = Math.max(price, open) + Math.random() * basePrice * 0.008
    const low = Math.min(price, open) - Math.random() * basePrice * 0.008
    const volume = Math.floor(Math.random() * 20000000) + 1000000

    let timestamp: number
    if (range === '1D') {
      timestamp = now - i * 5 * 60 * 1000
    } else if (range === '1W') {
      timestamp = now - i * 30 * 60 * 1000
    } else if (range === '1M' || range === '3M') {
      timestamp = now - i * 24 * 60 * 60 * 1000
    } else if (range === '6M' || range === '1Y') {
      timestamp = now - i * 7 * 24 * 60 * 60 * 1000
    } else {
      timestamp = now - i * 30 * 24 * 60 * 60 * 1000
    }

    data.push({
      date: new Date(timestamp).toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(price.toFixed(2)),
      volume,
    })
  }

  return data
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()
    const yahooSymbol = getYahooSymbol(symbolUpper)

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '1M'
    const interval = INTERVAL_MAP[range] || '1d'
    const limit = LIMIT_MAP[range] || 30

    try {
      // Try to fetch real chart data from Finance API
      const chartRes = await fetch(
        `${GATEWAY_URL}${API_PREFIX}/v2/markets/stock/history?symbol=${encodeURIComponent(yahooSymbol)}&interval=${interval}&limit=${limit}`,
        { headers: { 'X-Z-AI-From': 'Z' }, next: { revalidate: 120 } }
      )

      if (chartRes.ok) {
        const chartData = await chartRes.json()
        const body = chartData?.body

        if (body && Array.isArray(body) && body.length > 0) {
          const parsed = body.map((candle: Record<string, unknown>) => ({
            date: candle.date || candle.timestamp || '',
            open: parseFloat(String(candle.open || '0')),
            high: parseFloat(String(candle.high || '0')),
            low: parseFloat(String(candle.low || '0')),
            close: parseFloat(String(candle.close || '0')),
            volume: parseInt(String(candle.volume || '0')),
          })).filter((c: { close: number }) => c.close > 0)

          if (parsed.length > 0) {
            return NextResponse.json({
              success: true,
              data: parsed,
              isRealData: true,
            })
          }
        }
      }
    } catch (apiErr) {
      console.warn(`[API /stocks/chart/${symbolUpper}] Finance API error:`, apiErr)
    }

    // Fallback: generate mock chart data
    const basePrice = searchParams.get('basePrice') ? parseFloat(searchParams.get('basePrice')!) : 1500
    const mockData = generateMockChartData(symbolUpper, range, basePrice)
    return NextResponse.json({
      success: true,
      data: mockData,
      isRealData: false,
    })
  } catch (error) {
    console.error(`[API /stocks/chart] Error:`, error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}
