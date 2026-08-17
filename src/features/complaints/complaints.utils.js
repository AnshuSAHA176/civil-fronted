export const STATUS_TONES = Object.freeze({
  pending: 'warning',
  assigned: 'info',
  accepted: 'info',
  inspection: 'info',
  in_progress: 'info',
  resolved: 'success',
  closed: 'success',
  rejected: 'danger',
  reopened: 'warning',
})

export const PRIORITY_TONES = Object.freeze({
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
})

export function formatStatus(value) {
  return String(value || 'pending')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function formatPriority(value) {
  return String(value || 'medium')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function formatComplaintDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

export function normalizeComplaints(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export function formatDateTime(value) {
  if (!value) return 'Not available'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatConfidence(value) {
  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return 'Not available'
  }

  const percentage = numeric <= 1 ? numeric * 100 : numeric

  return `${Math.round(percentage)}%`
}

/**
 * Convert backend media values into browser-safe URLs.
 *
 * Supports:
 * - Cloudinary URLs
 * - Other absolute HTTP/HTTPS URLs
 * - Relative Django media URLs
 * - Relative upload URLs
 */
export function mediaUrl(value) {
  if (!value) return ''

  const url = String(value).trim()

  if (!url) return ''

  // Cloudinary / external URL
  if (/^https?:\/\//i.test(url)) {
    return url.replace(/^http:\/\//i, 'https://')
  }

  // Protocol-relative URL
  if (url.startsWith('//')) {
    return `https:${url}`
  }

  // Relative URL from Django/backend
  const base = (
    import.meta.env.VITE_API_BASE_URL ||
    'http://127.0.0.1:8000'
  ).replace(/\/+$/, '')

  return `${base}/${url.replace(/^\/+/, '')}`
}

export function normalizeComplaintDetails(payload) {
  return payload && typeof payload === 'object'
    ? payload
    : null
}

export function normalizeLikeToggleResponse(
  payload,
  previousLiked = false
) {
  if (!payload || typeof payload !== 'object') {
    return {
      liked: !previousLiked,
      likeCount: null,
    }
  }

  if (typeof payload.like === 'boolean') {
    return {
      liked: payload.like,
      likeCount: Number.isFinite(Number(payload.like_count))
        ? Number(payload.like_count)
        : null,
    }
  }

  if (typeof payload.message === 'boolean') {
    return {
      liked: payload.message,
      likeCount: Number.isFinite(Number(payload.like_count))
        ? Number(payload.like_count)
        : null,
    }
  }

  return {
    liked: !previousLiked,
    likeCount: Number.isFinite(Number(payload.like_count))
      ? Number(payload.like_count)
      : null,
  }
}

export function normalizeLikedComplaints(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}