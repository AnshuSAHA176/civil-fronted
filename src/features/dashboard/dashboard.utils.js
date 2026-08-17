const numberValue = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function normalizeCitizenDashboard(payload) {
  const data = payload && typeof payload === 'object' ? payload : {}
  const cards = data.cards && typeof data.cards === 'object' ? data.cards : {}

  const pieChart = Array.isArray(data.pie_chart) ? data.pie_chart : []
  const monthlyActivity = Array.isArray(data.monthly_activity) ? data.monthly_activity : []

  const totals = {
    total: numberValue(cards.total),
    pending: numberValue(cards.pending),
    inProgress: numberValue(cards.in_progress),
    resolved: numberValue(cards.resolved),
    rejected: numberValue(cards.rejected),
  }

  const hasAnyComplaint = totals.total > 0 || Boolean(data.recent_complaint) || pieChart.length > 0 || monthlyActivity.length > 0

  return {
    cards: totals,
    recentComplaint: data.recent_complaint || null,
    pieChart,
    monthlyActivity,
    isEmpty: !hasAnyComplaint,
  }
}

export function formatStatus(value) {
  const text = String(value || 'pending').replaceAll('_', ' ')
  return text.replace(/\b\w/g, (character) => character.toUpperCase())
}

export function getComplaintTitle(complaint) {
  return complaint?.title || complaint?.complaint_title || complaint?.subject || 'Recent complaint'
}

export function getComplaintId(complaint) {
  return complaint?.complaint_id || complaint?.complain_id || complaint?.id || null
}

export function getComplaintDate(complaint) {
  return complaint?.created_at || complaint?.reported_at || complaint?.updated_at || null
}

export function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function normalizePiePoint(point, index) {
  if (Array.isArray(point)) {
    return { name: String(point[0] ?? `Status ${index + 1}`), value: numberValue(point[1]) }
  }

  return {
    name: point?.name || point?.status || point?.label || `Status ${index + 1}`,
    value: numberValue(point?.value ?? point?.count ?? point?.total),
  }
}

export function normalizeActivityPoint(point, index) {
  if (Array.isArray(point)) {
    return { name: String(point[0] ?? index + 1), value: numberValue(point[1]) }
  }

  return {
    name: point?.month || point?.name || point?.label || String(point?.date || index + 1),
    value: numberValue(point?.count ?? point?.value ?? point?.total),
  }
}
