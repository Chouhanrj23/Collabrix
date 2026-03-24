import { memo } from 'react'
import { getInitials, formatDate } from '../../utils/formatters'
import { DesignationBadge, RelationshipBadge, StatusBadge } from '../common/Badge'
import { DESIGNATION_COLORS } from '../../utils/designationUtils'
import { useAuth } from '../../context/AuthContext'

export default memo(function ConnectionCard({ connection }) {
  const { user } = useAuth()

  const isFromMe = connection.fromEmployee?.id === user?.employeeId
  const other = isFromMe ? connection.toEmployee : connection.fromEmployee
  const direction = isFromMe ? 'Sent' : 'Received'

  const colors = DESIGNATION_COLORS[other?.designation] ?? { bg: '#64748B' }

  return (
    <div className="connection-card">
      <div className="connection-card-avatar">
        <div className="avatar" style={{ background: colors.bg }}>
          {getInitials(other?.name)}
        </div>
      </div>
      <div className="connection-card-info">
        <div className="connection-card-name">{other?.name ?? '—'}</div>
        <DesignationBadge designation={other?.designation} />
        {other?.account && (
          <div className="connection-card-meta">{other.account} · {other.project}</div>
        )}
        <div className="connection-card-tags">
          <RelationshipBadge type={connection.relationshipType} />
          <StatusBadge status={connection.status} />
          <span className="tag tag-direction">{direction}</span>
        </div>
      </div>
      <div className="connection-card-date">
        <span className="text-muted text-sm">
          {formatDate(connection.createdAt)}
        </span>
      </div>
    </div>
  )
})
