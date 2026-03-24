export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '—'
  const d = new Date(dateTimeStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function truncate(str, max = 80) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function ratingStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating)
}
