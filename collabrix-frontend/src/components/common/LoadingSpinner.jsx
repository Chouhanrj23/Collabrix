export default function LoadingSpinner({ size = 40, message = '' }) {
  return (
    <div className="spinner-wrapper">
      <div
        className="spinner"
        style={{ width: size, height: size }}
        role="status"
        aria-label="Loading"
      />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  )
}
