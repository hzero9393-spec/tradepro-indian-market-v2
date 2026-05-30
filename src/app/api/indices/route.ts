import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// 4 main indices — always returned in this order
const MAIN_INDICES_ORDER = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX']

export async function GET() {
  try {
    const indices = await db.index.findMany({
      where: { isEnabled: true },
    })

    // Sort to prioritize the 4 main indices in the correct order
    const sorted = indices.sort((a, b) => {
      const ai = MAIN_INDICES_ORDER.indexOf(a.symbol)
      const bi = MAIN_INDICES_ORDER.indexOf(b.symbol)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })

    return NextResponse.json({
      success: true,
      data: sorted,
    })
  } catch (error) {
    console.error('[API /indices] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch indices' },
      { status: 500 }
    )
  }
}
