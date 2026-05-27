// IP-based geolocation utility using ipapi.co free API
// Caches results in-memory to avoid repeated API calls for the same IP

const geoCache = new Map<string, string>()
const CACHE_MAX_SIZE = 500

interface GeoAPIResponse {
  city?: string
  region?: string
  country_name?: string
  country_code?: string
  error?: boolean
  reason?: string
}

/**
 * Get a formatted location string from an IP address.
 * Uses https://ipapi.co/{ip}/json/ to resolve city, region, country.
 * Results are cached in-memory to avoid redundant API calls.
 *
 * @param ipAddress - The IP address to look up (can be null/empty)
 * @returns Formatted location string like "Mumbai, Maharashtra, IN" or "Unknown Location"
 */
export async function getLocationFromIP(ipAddress: string | null): Promise<string> {
  if (!ipAddress) {
    return 'Unknown Location'
  }

  // Handle comma-separated x-forwarded-for headers (take the first one)
  const cleanIP = ipAddress.split(',')[0].trim()

  if (!cleanIP) {
    return 'Unknown Location'
  }

  // Check cache first
  const cached = geoCache.get(cleanIP)
  if (cached) {
    return cached
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`https://ipapi.co/${encodeURIComponent(cleanIP)}/json/`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`[GeoLocation] API returned status ${response.status} for IP ${cleanIP}`)
      return 'Unknown Location'
    }

    const data: GeoAPIResponse = await response.json()

    if (data.error) {
      console.warn(`[GeoLocation] API error for IP ${cleanIP}: ${data.reason || 'Unknown'}`)
      return 'Unknown Location'
    }

    // Build formatted location string
    const parts: string[] = []

    if (data.city) {
      parts.push(data.city)
    }

    if (data.region && data.region !== data.city) {
      parts.push(data.region)
    }

    if (data.country_code) {
      parts.push(data.country_code)
    }

    const location = parts.length > 0 ? parts.join(', ') : 'Unknown Location'

    // Cache the result (evict oldest entries if cache is too large)
    if (geoCache.size >= CACHE_MAX_SIZE) {
      const firstKey = geoCache.keys().next().value
      if (firstKey) {
        geoCache.delete(firstKey)
      }
    }
    geoCache.set(cleanIP, location)

    return location
  } catch (error) {
    // Don't block login if geolocation fails - just log and return default
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`[GeoLocation] Request timed out for IP ${cleanIP}`)
    } else {
      console.warn(`[GeoLocation] Failed to get location for IP ${cleanIP}:`, error instanceof Error ? error.message : String(error))
    }
    return 'Unknown Location'
  }
}
