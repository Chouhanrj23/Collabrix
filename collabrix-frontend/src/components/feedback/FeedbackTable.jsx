import { DesignationBadge, RatingBadge } from '../common/Badge'
import { formatDate, getInitials } from '../../utils/formatters'
import { DESIGNATION_COLORS } from '../../utils/designationUtils'

export default function FeedbackTable({ feedbackList }) {
  if (!feedbackList?.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💬</div>
        <p>No feedback received yet.</p>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>From</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {feedbackList.map((fb) => (
            <FeedbackRow key={fb.id} fb={fb} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeedbackRow({ fb }) {
  const from = fb.fromEmployee
  const colors = DESIGNATION_COLORS[from?.designation] ?? { bg: '#64748B' }
  return (
    <tr>
      <td>
        <div className="table-employee">
          <div className="avatar avatar-xs" style={{ background: colors.bg }}>
            {getInitials(from?.name)}
          </div>
          <div>
            <div className="table-employee-name">{from?.name ?? '—'}</div>
            <DesignationBadge designation={from?.designation} />
          </div>
        </div>
      </td>
      <td><RatingBadge rating={fb.rating} /></td>
      <td className="feedback-comment">{fb.comment}</td>
      <td className="text-muted text-sm">{formatDate(fb.feedbackDate)}</td>
    </tr>
  )
}
