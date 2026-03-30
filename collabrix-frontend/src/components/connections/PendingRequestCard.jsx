import { memo, useState } from 'react'
import { getInitials, formatDate } from '../../utils/formatters'
import { DesignationBadge, RelationshipBadge } from '../common/Badge'
import { DESIGNATION_COLORS } from '../../utils/designationUtils'
import { connectionService } from '../../api/connectionService'

export default memo(function PendingRequestCard({ request, onResolved }) {
  const [loading, setLoading] = useState(false)

  const from = request.fromEmployee
  const colors = DESIGNATION_COLORS[from?.designation] ?? { bg: '#64748B' }

  const handle = async (action) => {
    setLoading(true)
    try {
      if (action === 'approve') {
        await connectionService.approve(request.id)
      } else {
        await connectionService.reject(request.id)
      }
      onResolved?.(request.id, action)
    } catch (e) {
      console.error('Failed to process request:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pending-card">
      <div className="pending-card-avatar">
        <div className="avatar avatar-sm" style={{ background: colors.bg }}>
          {getInitials(from?.name)}
        </div>
      </div>
      <div className="pending-card-info">
        <div className="pending-card-name">{from?.name}</div>
        <DesignationBadge designation={from?.designation} />
        <div className="pending-card-meta">
          <RelationshipBadge type={request.relationshipType} />
          {request.department && <span className="text-muted text-sm">{request.department}</span>}
          {request.duration && <span className="text-muted text-sm">Duration: {request.duration}</span>}
        </div>
        <div className="text-muted text-sm">Requested {formatDate(request.createdAt)}</div>
      </div>
      <div className="pending-card-actions">
        <button
          className="btn btn-success btn-sm"
          onClick={() => handle('approve')}
          disabled={loading}
        >
          Approve
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => handle('reject')}
          disabled={loading}
        >
          Reject
        </button>
      </div>
    </div>
  )
})
