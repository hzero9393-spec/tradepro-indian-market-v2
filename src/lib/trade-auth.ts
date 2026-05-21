import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, getTokenFromHeaders } from '@/lib/auth'

export interface AuthResult {
  userId: string
  error?: NextResponse
}

/**
 * Verifies the auth token from request headers and checks session validity.
 * Returns userId on success, or an error NextResponse on failure.
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = getTokenFromHeaders(request.headers)

  if (!token) {
    return {
      userId: '',
      error: NextResponse.json(
        { error: 'No token provided. Please login.' },
        { status: 401 }
      ),
    }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return {
      userId: '',
      error: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }

  // Check session exists and is not expired
  const session = await db.session.findUnique({ where: { token } })
  if (!session || session.expiresAt < new Date()) {
    return {
      userId: '',
      error: NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      ),
    }
  }

  // Verify user exists and is active
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true },
  })

  if (!user || !user.isActive) {
    return {
      userId: '',
      error: NextResponse.json(
        { error: 'User not found or deactivated' },
        { status: 401 }
      ),
    }
  }

  return { userId: payload.userId }
}

/**
 * Calculate brokerage for Indian stock market paper trading.
 * Typical brokerage: 0.05% of total value, min ₹20, max ₹500
 */
export function calculateBrokerage(totalValue: number): number {
  const brokeragePercent = 0.0005 // 0.05%
  const calculated = totalValue * brokeragePercent
  return Math.max(20, Math.min(500, Math.round(calculated * 100) / 100))
}
