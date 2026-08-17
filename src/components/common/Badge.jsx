const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, '_')

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge badge-${normalize(tone)}`}>{children}</span>
}
