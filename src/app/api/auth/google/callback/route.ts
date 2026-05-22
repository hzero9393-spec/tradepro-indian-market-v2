import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
  given_name?: string
  family_name?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Handle user denial or error
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(new URL('/?auth_error=google_denied', request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?auth_error=no_code', request.url))
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth not configured')
      return NextResponse.redirect(new URL('/?auth_error=google_not_configured', request.url))
    }

    // Determine redirect URI (must match the one used in the initial request)
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/google/callback`

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Google token exchange failed:', errorData)
      return NextResponse.redirect(new URL('/?auth_error=token_exchange_failed', request.url))
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json()

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userResponse.ok) {
      console.error('Failed to fetch Google user info')
      return NextResponse.redirect(new URL('/?auth_error=user_info_failed', request.url))
    }

    const googleUser: GoogleUserInfo = await userResponse.json()

    // Check if user exists with this Google OAuth ID
    let user = await db.user.findFirst({
      where: {
        oauthProvider: 'google',
        oauthId: googleUser.sub,
      },
    })

    if (user) {
      // Update existing OAuth user's info
      user = await db.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name,
          avatar: googleUser.picture,
          isEmailVerified: googleUser.email_verified,
          lastLoginAt: new Date(),
        },
      })
    } else {
      // Check if user with this email already exists (linked account)
      user = await db.user.findUnique({
        where: { email: googleUser.email },
      })

      if (user) {
        // Link Google account to existing user
        user = await db.user.update({
          where: { id: user.id },
          data: {
            oauthProvider: 'google',
            oauthId: googleUser.sub,
            avatar: googleUser.picture,
            isEmailVerified: googleUser.email_verified,
            lastLoginAt: new Date(),
          },
        })
      } else {
        // Create new user from Google account
        user = await db.user.create({
          data: {
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.picture,
            oauthProvider: 'google',
            oauthId: googleUser.sub,
            passwordHash: null, // No password for OAuth users
            isEmailVerified: googleUser.email_verified,
            virtualBalance: 100000,
            role: 'USER',
            subscription: 'FREE',
          },
        })
      }
    }

    // Check if account is active
    if (!user.isActive) {
      return NextResponse.redirect(new URL('/?auth_error=account_deactivated', request.url))
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Create session
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await db.session.create({
      data: {
        userId: user.id,
        token,
        device: request.headers.get('user-agent')?.substring(0, 255) || 'Google OAuth',
        ipAddress: request.headers.get('x-forwarded-for') || null,
        expiresAt,
      },
    })

    // Redirect to home with token
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('auth_token', token)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?auth_error=oauth_callback_failed', request.url))
  }
}
