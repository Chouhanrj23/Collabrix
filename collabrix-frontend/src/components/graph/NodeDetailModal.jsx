import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { employeeService } from '../../api/employeeService'
import { feedbackService } from '../../api/feedbackService'
import { connectionService } from '../../api/connectionService'
import { DESIGNATION_COLORS, isSeniorTo, canViewFeedback } from '../../utils/designationUtils'
import { DesignationBadge, GradeBadge, RelationshipBadge } from '../common/Badge'
import { getInitials, formatDate } from '../../utils/formatters'

/**
 * NodeDetailModal
 *
 * Opens when a node is clicked in CollaborationGraph.
 * Fetches full employee details and (for the current user) feedback summary.
 *
 * @param {boolean}  isOpen        - controls visibility
 * @param {object}   node          - raw NodeDto from the graph (_raw field)
 * @param {object[]} edges         - raw EdgeDtos connected to this node
 * @param {number}   currentUserId - ID of the logged-in employee
 * @param {function} onClose       - close handler
 */
export default function NodeDetailModal({ isOpen, node, edges = [], currentUserId, onClose }) {
  const { user } = useAuth()

  const [employee,       setEmployee]       = useState(null)
  const [feedbackData,   setFeedbackData]   = useState(null)
  const [feedbackList,   setFeedbackList]   = useState([])
  const [duration,       setDuration]       = useState(null)
  const [detailLoading,  setDetailLoading]  = useState(false)
  const [uploading,      setUploading]      = useState(false)
  const [profileImage,   setProfileImage]   = useState(null)
  const fileInputRef = useRef(null)

  const isCurrentUser = node?.id === currentUserId
  // Show restricted info if viewer is junior to the clicked node (server enforces too)
  const isSenior      = node && user && isSeniorTo(node.designation, user.designation)
  const showFullInfo  = isCurrentUser || !isSenior

  // Feedback visibility: current user always sees own feedback; seniors can see juniors' feedback
  const canSeeFeedback = isCurrentUser || (node && user && canViewFeedback(user.designation, node.designation))

  // Fetch employee details, connections (for duration), and feedback when modal opens
  useEffect(() => {
    if (!isOpen || !node) return

    setEmployee(null)
    setFeedbackData(null)
    setFeedbackList([])
    setDuration(null)
    setDetailLoading(true)
    setProfileImage(node.profileImageUrl ?? null)

    const requests = [
      employeeService.getById(node.id),
      connectionService.getByEmployee(node.id).catch(() => []),
    ]

    // Fetch feedback: own profile uses getReceived(), viewing a junior uses getReceivedForEmployee()
    if (canSeeFeedback) {
      const feedbackReq = isCurrentUser
        ? feedbackService.getReceived()
        : feedbackService.getReceivedForEmployee(node.id)
      requests.push(feedbackReq.catch(() => []))
    }

    Promise.all(requests)
      .then(([emp, connections, feedback]) => {
        setEmployee(emp)
        if (emp?.profileImageUrl) setProfileImage(emp.profileImageUrl)

        // Extract duration from the first matching approved connection
        if (connections?.length) {
          const match = connections.find(
            (c) =>
              c.status === 'APPROVED' &&
              (c.fromEmployee?.id === currentUserId || c.toEmployee?.id === currentUserId)
          )
          setDuration(match?.duration ?? connections[0]?.duration ?? null)
        }

        if (feedback?.length) {
          // Sort by date (newest first), cap at 5
          const sorted = [...feedback].sort(
            (a, b) => (b.feedbackDate ?? '').localeCompare(a.feedbackDate ?? '')
          )
          setFeedbackList(sorted.slice(0, 5))

          const avg = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
          setFeedbackData({
            count: feedback.length,
            avg:   Math.round(avg * 10) / 10,
          })
        }
      })
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }, [isOpen, node?.id, isCurrentUser, canSeeFeedback, currentUserId])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  async function handleProfileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await employeeService.uploadProfilePicture(file)
      setProfileImage(result.profileImageUrl)
    } catch {
      // silently fail — user sees no change
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!isOpen || !node) return null

  const colors         = DESIGNATION_COLORS[node.designation] ?? { bg: '#64748B' }
  const displayName    = employee?.name ?? node.label ?? node.name ?? ''
  const connectedEdges = edges.filter((e) => e.from == node.id || e.to == node.id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Employee Profile"
      >
        {/* -- Modal header -- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-800">Employee Profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        {/* -- Body -- */}
        {detailLoading ? (
          /* Loading skeleton */
          <div className="p-5 space-y-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
              </div>
            </div>
            <div className="h-24 bg-gray-50 rounded-xl" />
          </div>
        ) : (
          <div className="p-5 space-y-5 overflow-y-auto max-h-[70vh]">

            {/* -- Identity -- */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0 group">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={displayName}
                    className="w-14 h-14 rounded-full object-cover shadow-md border-2"
                    style={{ borderColor: colors.bg }}
                    onError={() => setProfileImage(null)}
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md"
                    style={{ backgroundColor: colors.bg }}
                  >
                    {getInitials(displayName)}
                  </div>
                )}
                {isCurrentUser && (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute inset-0 w-14 h-14 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
                      title="Upload profile picture"
                    >
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {uploading ? (
                          <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" /></svg>
                        ) : (
                          <IconCamera />
                        )}
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleProfileUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{displayName}</h3>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <DesignationBadge designation={node.designation} />
                  {(employee?.grade ?? node.grade) && (
                    <GradeBadge grade={employee?.grade ?? node.grade} />
                  )}
                </div>
              </div>
            </div>

            {showFullInfo ? (
              <>
                {/* -- Work details -- */}
                {(employee?.email || employee?.account || employee?.project || duration !== null) && (
                  <div className="bg-gray-50/80 rounded-xl p-4 space-y-3 border border-gray-100/80">
                    {employee.email && (
                      <DetailRow label="Email" value={employee.email} />
                    )}
                    {employee.account && (
                      <DetailRow label="Account" value={employee.account} />
                    )}
                    {employee.project && (
                      <DetailRow label="Project" value={employee.project} />
                    )}
                    <DetailRow label="Duration" value={duration || '\u2014'} />
                  </div>
                )}

                {/* -- Connection types -- */}
                {connectedEdges.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Connection Type{connectedEdges.length > 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {connectedEdges.map((edge, i) => (
                        <RelationshipBadge
                          key={i}
                          type={edge.relationshipType ?? edge.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* -- Feedback section -- */}
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Feedback
                  </p>

                  {canSeeFeedback ? (
                    <>
                      {/* Summary bar */}
                      {feedbackData && (
                        <div className="bg-amber-50/80 border border-amber-100/80 rounded-xl p-4 mb-3">
                          <div className="flex items-center gap-4">
                            <div className="flex items-end gap-1">
                              <span className="text-3xl font-bold text-amber-600 leading-none tabular-nums">
                                {feedbackData.avg}
                              </span>
                              <span className="text-sm text-amber-400 mb-0.5">/5</span>
                            </div>
                            <div>
                              <div className="text-amber-400 text-base tracking-wider leading-none">
                                {'★'.repeat(Math.round(feedbackData.avg))}
                                <span className="text-amber-200">
                                  {'★'.repeat(5 - Math.round(feedbackData.avg))}
                                </span>
                              </div>
                              <p className="text-xs text-amber-600/80 mt-1">
                                {feedbackData.count} review{feedbackData.count !== 1 ? 's' : ''} received
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Individual feedback cards */}
                      {feedbackList.length > 0 ? (
                        <div className="space-y-2.5">
                          {feedbackList.map((fb) => (
                            <FeedbackCard key={fb.id} feedback={fb} />
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-4">
                          No feedback available
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100/80 rounded-xl px-4 py-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                        <IconLockSmall />
                      </div>
                      <p className="text-xs text-gray-400">
                        Feedback is restricted based on hierarchy.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* -- Restricted view -- */
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <IconLock />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Profile Restricted</p>
                  <p className="text-xs text-gray-400 max-w-xs mt-1">
                    Detailed profile is only visible for your peers and direct reports.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// -- Sub-components -----------------------------------------------------------

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider flex-shrink-0 pt-px">{label}</span>
      <span className="text-sm text-gray-800 text-right break-all">{value}</span>
    </div>
  )
}

function FeedbackCard({ feedback }) {
  const { fromEmployee, rating, comment, feedbackDate } = feedback
  const reviewerName = fromEmployee?.name ?? 'Anonymous'

  return (
    <div className="bg-gray-50/80 border border-gray-100/80 rounded-xl p-3.5 transition-all duration-150 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200/80 flex items-center justify-center text-xs font-semibold text-gray-600">
          {getInitials(reviewerName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 truncate">{reviewerName}</p>
            {feedbackDate && (
              <span className="text-[10px] text-gray-400 flex-shrink-0">
                {formatDate(feedbackDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5 mt-1">
            <span className="text-amber-400 text-xs tracking-wider leading-none">
              {'★'.repeat(rating)}
            </span>
            {rating < 5 && (
              <span className="text-gray-200 text-xs tracking-wider leading-none">
                {'★'.repeat(5 - rating)}
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-1.5 font-medium">{rating}/5</span>
          </div>
          {comment && (
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed line-clamp-3">
              {comment}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// -- Icons --------------------------------------------------------------------

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-gray-400">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IconLockSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
