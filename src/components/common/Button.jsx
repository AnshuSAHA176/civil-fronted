export function Button({ children, variant = 'primary', loading = false, disabled = false, className = '', type = 'button', ...props }) {
  return (
    <button className={`button button-${variant} ${className}`.trim()} type={type} disabled={disabled || loading} {...props}>
      {loading ? 'Loading…' : children}
    </button>
  )
}
