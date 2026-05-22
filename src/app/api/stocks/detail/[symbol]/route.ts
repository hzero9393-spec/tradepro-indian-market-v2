import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GATEWAY_URL = 'https://internal-api.z.ai'
const API_PREFIX = '/external/finance'

// Yahoo Finance suffix for NSE stocks
function getYahooSymbol(symbol: string): string {
  return `${symbol}.NS`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const symbolUpper = symbol.toUpperCase()

    // First, try to get stock from database
    const dbStock = await db.stock.findUnique({
      where: { symbol: symbolUpper },
    })

    // Try to fetch real-time data from Finance API
    let realtimeData: Record<string, unknown> | null = null
    try {
      const yahooSym = getYahooSymbol(symbolUpper)
      const quoteRes = await fetch(
        `${GATEWAY_URL}${API_PREFIX}/v1/markets/quote?ticker=${encodeURIComponent(yahooSym)}&type=STOCKS`,
        { headers: { 'X-Z-AI-From': 'Z' }, next: { revalidate: 60 } }
      )

      if (quoteRes.ok) {
        const quoteJson = await quoteRes.json()
        const body = quoteJson?.body
        if (body) {
          const currentPrice = parseFloat(String(body.regularMarketPrice?.raw || body.regularMarketPrice || '0'))
          const previousClose = parseFloat(String(body.regularMarketPreviousClose?.raw || body.regularMarketPreviousClose || '0'))
          const change = currentPrice - previousClose
          const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

          realtimeData = {
            currentPrice,
            previousClose,
            change,
            changePercent,
            open: parseFloat(String(body.regularMarketOpen?.raw || body.regularMarketOpen || '0')),
            high: parseFloat(String(body.regularMarketDayHigh?.raw || body.regularMarketDayHigh || '0')),
            low: parseFloat(String(body.regularMarketDayLow?.raw || body.regularMarketDayLow || '0')),
            volume: parseInt(String(body.regularMarketVolume?.raw || body.regularMarketVolume || '0')),
            week52High: parseFloat(String(body.fiftyTwoWeekHigh?.raw || body.fiftyTwoWeekHigh || '0')),
            week52Low: parseFloat(String(body.fiftyTwoWeekLow?.raw || body.fiftyTwoWeekLow || '0')),
            marketCap: parseFloat(String(body.marketCap?.raw || body.marketCap || '0')),
            peRatio: parseFloat(String(body.trailingPE?.raw || body.trailingPE || dbStock?.peRatio || 0)),
            eps: parseFloat(String(body.epsTrailingTwelveMonths?.raw || body.epsTrailingTwelveMonths || '0')),
            dividendYield: parseFloat(String(body.dividendYield?.raw || body.dividendYield || (dbStock?.dividendYield ? dbStock.dividendYield * 100 : 0) || 0)) / 100,
            pbRatio: parseFloat(String(body.priceToBook?.raw || body.priceToBook || '0')),
            roe: parseFloat(String(body.returnOnEquity?.raw || body.returnOnEquity || '0')) * 100,
            bookValue: parseFloat(String(body.bookValue?.raw || body.bookValue || '0')),
            debtToEquity: parseFloat(String(body.debtToEquity?.raw || body.debtToEquity || '0')),
            faceValue: dbStock?.faceValue || 10,
            industryPE: parseFloat(String(body.industryPE?.raw || '0')),
            name: body.shortName || dbStock?.name || symbolUpper,
            sector: dbStock?.sector || '',
            isRealData: true,
          }
        }
      }
    } catch (apiErr) {
      console.warn(`[API /stocks/detail/${symbolUpper}] Finance API error:`, apiErr)
    }

    // Build response: merge DB data with realtime data
    const stockData = {
      symbol: symbolUpper,
      name: (realtimeData?.name as string) || dbStock?.name || symbolUpper,
      sector: (realtimeData?.sector as string) || dbStock?.sector || '',
      industry: dbStock?.industry || '',
      exchange: dbStock?.exchange || 'NSE',

      // Price data - prefer realtime
      currentPrice: (realtimeData?.currentPrice as number) || dbStock?.currentPrice || 0,
      change: (realtimeData?.change as number) || dbStock?.change || 0,
      changePercent: (realtimeData?.changePercent as number) || dbStock?.changePercent || 0,
      open: (realtimeData?.open as number) || dbStock?.open || 0,
      high: (realtimeData?.high as number) || dbStock?.high || 0,
      low: (realtimeData?.low as number) || dbStock?.low || 0,
      previousClose: (realtimeData?.previousClose as number) || dbStock?.previousClose || 0,
      volume: (realtimeData?.volume as number) || dbStock?.volume || 0,
      week52High: (realtimeData?.week52High as number) || dbStock?.week52High || 0,
      week52Low: (realtimeData?.week52Low as number) || dbStock?.week52Low || 0,

      // Fundamentals
      marketCap: (realtimeData?.marketCap as number) || dbStock?.marketCap || 0,
      peRatio: (realtimeData?.peRatio as number) || dbStock?.peRatio || null,
      eps: (realtimeData?.eps as number) || 0,
      dividendYield: (realtimeData?.dividendYield as number) || dbStock?.dividendYield || 0,
      pbRatio: (realtimeData?.pbRatio as number) || 0,
      roe: (realtimeData?.roe as number) || 0,
      bookValue: (realtimeData?.bookValue as number) || 0,
      debtToEquity: (realtimeData?.debtToEquity as number) || 0,
      faceValue: (realtimeData?.faceValue as number) || dbStock?.faceValue || 10,
      industryPE: (realtimeData?.industryPE as number) || 0,

      // F&O
      lotSize: dbStock?.lotSize || 1,
      isFuturesAvailable: dbStock?.isFuturesAvailable || false,
      isOptionsAvailable: dbStock?.isOptionsAvailable || false,
      isFnoBan: dbStock?.isFnoBan || false,

      isRealData: !!realtimeData?.isRealData,
    }

    // Get similar stocks from the same sector
    let similarStocks: Array<{
      symbol: string; name: string; currentPrice: number; change: number; changePercent: number; sector: string
    }> = []

    if (stockData.sector) {
      similarStocks = await db.stock.findMany({
        where: {
          sector: stockData.sector,
          symbol: { not: symbolUpper },
          isActive: true,
        },
        select: {
          symbol: true,
          name: true,
          currentPrice: true,
          change: true,
          changePercent: true,
          sector: true,
        },
        orderBy: { marketCap: 'desc' },
        take: 8,
      })
    }

    return NextResponse.json({
      success: true,
      data: stockData,
      similarStocks,
    })
  } catch (error) {
    console.error(`[API /stocks/detail] Error:`, error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock detail' },
      { status: 500 }
    )
  }
}
