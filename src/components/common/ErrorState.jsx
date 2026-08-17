export function ErrorState({ title = 'Unable to load this page', description, onRetry }) {
  return (
    <div className="error-state">
      <h2>{title}</h2>
      <p>{description || 'Something went wrong while communicating with CivicAI.'}</p>
      {onRetry && <button className="button button-secondary" onClick={onRetry}>Try again</button>}
    </div>
  )
}
