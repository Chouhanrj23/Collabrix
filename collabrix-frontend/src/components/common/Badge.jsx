import {
  DESIGNATION_DISPLAY,
  DESIGNATION_BADGE_COLORS,
  RELATIONSHIP_TYPE_DISPLAY,
  CONNECTION_STATUS_COLORS,
  CONNECTION_STATUS_DISPLAY,
} from '../../utils/designationUtils'

export function DesignationBadge({ designation }) {
  const label = DESIGNATION_DISPLAY[designation] ?? designation
  const color = DESIGNATION_BADGE_COLORS[designation] ?? '#64748B'
  return (
    <span
      className="badge"
      style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}
    >
      {label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const label = CONNECTION_STATUS_DISPLAY[status] ?? status
  const color = CONNECTION_STATUS_COLORS[status] ?? '#64748B'
  return (
    <span
      className="badge"
      style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}
    >
      {label}
    </span>
  )
}

export function RelationshipBadge({ type }) {
  const label = RELATIONSHIP_TYPE_DISPLAY[type] ?? type
  return (
    <span className="badge badge-relationship">{label}</span>
  )
}

export function GradeBadge({ grade }) {
  const color = grade === 'SENIOR' ? '#1D4ED8' : '#6B7280'
  return (
    <span
      className="badge"
      style={{ backgroundColor: color + '15', color, borderColor: color + '30', fontSize: '0.7rem' }}
    >
      {grade}
    </span>
  )
}

export function RatingBadge({ rating }) {
  const color = rating >= 4 ? '#10B981' : rating >= 3 ? '#F59E0B' : '#EF4444'
  return (
    <span
      className="badge"
      style={{ backgroundColor: color + '20', color, borderColor: color + '40' }}
    >
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)} {rating}/5
    </span>
  )
}
