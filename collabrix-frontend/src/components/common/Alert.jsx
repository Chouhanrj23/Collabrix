export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null
  return (
    <div className={`alert alert-${type}`} role="alert">
      <span className="alert-icon">
        {type === 'error' && '✕'}
        {type === 'success' && '✓'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </span>
      <span className="alert-message">{message}</span>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      )}
    </div>
  )
}
