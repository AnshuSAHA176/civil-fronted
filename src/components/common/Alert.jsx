export function Alert({ children, tone = 'danger' }) {
  return <div className={`alert alert-${tone}`} role="alert">{children}</div>
}
