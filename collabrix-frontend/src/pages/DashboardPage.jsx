import { useEffect, useState, useCallback, memo } from 'react'
import { useAuth } from '../context/AuthContext'
import { graphService } from '../api/graphService'
import { connectionService } from '../api/connectionService'
import { feedbackService } from '../api/feedbackService'
import CollaborationGraph from '../components/graph/CollaborationGraph'
import PendingRequestCard from '../components/connections/PendingRequestCard'
import Alert from '../components/common/Alert'
import { DESIGNATION_COLORS, DESIGNATION_DISPLAY } from '../utils/designationUtils'
import { getInitials, formatDate } from '../utils/formatters'

// NOTE: The backend exposes no single "getDashboard" endpoint for regular users.
// Data is composed from: graphService.getFullGraph + connectionService.getPending
// + feedbackService.getReceived + connectionService.getMy (all fetched in parallel).

export default function DashboardPage() {
  const { user } = useAuth()

  const [graphData, setGraphData] = useState(null)
  const [pending, setPending] = useState([])
  const [receivedFeedback, setReceivedFeedback] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [graphLoading, setGraphLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Full org graph — fetched separately so the network renders ASAP
    graphService.getFullGraph()
      .then(setGraphData)
      .catch(() => setError('Failed to load collaboration graph.'))
      .finally(() => setGraphLoading(false))

    // All side-panel data in parallel
    Promise.all([
      connectionService.getPending(),
      feedbackService.getReceived(),
      connectionService.getMy(),
    ])
      .then(([pendingList, feedback, allConnections]) => {
        const approved = allConnections.filter((c) => c.status === 'APPROVED').length
        const avgRating = feedback.length
          ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
          : null

        setPending(pendingList)
        setReceivedFeedback(feedback)
        setStats({
          connections: approved,
          pendingCount: pendingList.length,
          feedbackCount: feedback.length,
          avgRating,
        })
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false))
  }, [])

  const handlePendingResolved = useCallback((id) =>
    setPending((prev) => {
      const next = prev.filter((r) => r.id !== id)
      setStats((s) => ({ ...s, pendingCount: next.length }))
      return next
    }), [])

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const designationColors = DESIGNATION_COLORS[user?.designation] ?? { bg: '#64748B' }
  const designationLabel = DESIGNATION_DISPLAY[user?.designation] ?? user?.designation?.replace(/_/g, ' ')

  return (
    <div className="p-4 lg:p-6 space-y-5 min-h-full">

      {/* ── Welcome bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl px-6 py-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]}
          </h2>
          <p className="text-sm text-gray-400 mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-sm transition-transform duration-200 hover:scale-105"
            style={{ backgroundColor: designationColors.bg }}
          >
            {designationLabel}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* ── Error alert ─────────────────────────────────────────────────────── */}
      <Alert message={error} type="error" onClose={() => setError('')} />

      {/* ── Pending alert banner ────────────────────────────────────────────── */}
      {!loading && pending.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50/80 border border-amber-200/60 rounded-2xl px-5 py-4 transition-all duration-200">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mt-0.5">
            <IconClock className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {pending.length} Pending Connection Request{pending.length > 1 ? 's' : ''}
            </p>
            <div className="mt-1 space-y-0.5">
              {pending.slice(0, 2).map((req) => (
                <p key={req.id} className="text-sm text-amber-700/80">
                  <span className="font-medium text-amber-800">{req.fromEmployee?.name}</span>
                  {' requested a '}
                  <span className="italic">{req.relationshipType?.replace(/_/g, ' ')}</span>
                  {' connection.'}
                </p>
              ))}
              {pending.length > 2 && (
                <p className="text-xs text-amber-500 mt-1">+{pending.length - 2} more</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Connections"
          value={loading ? '…' : (stats?.connections ?? 0)}
          icon={<IconLink />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          label="Pending Approvals"
          value={loading ? '…' : (stats?.pendingCount ?? 0)}
          icon={<IconClock />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          loading={loading}
          highlight={!loading && stats?.pendingCount > 0}
        />
        <StatCard
          label="Feedback Received"
          value={loading ? '…' : (stats?.feedbackCount ?? 0)}
          icon={<IconChat />}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          loading={loading}
        />
        <StatCard
          label="Avg Rating"
          value={loading ? '…' : (stats?.avgRating ?? '—')}
          icon={<IconStar />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          loading={loading}
          suffix={stats?.avgRating ? ' / 5' : ''}
        />
      </div>

      {/* ── Main grid: graph + side panel ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Graph — spans 8 cols on desktop */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] h-[calc(100vh-320px)] transition-all duration-200 hover:shadow-md">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Organization Network</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                All employees and their connections across the organisation
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live
            </div>
          </div>
          <div className="flex-1 min-h-0 relative">
            <CollaborationGraph
              graphData={graphData}
              loading={graphLoading}
              currentUserId={user?.employeeId}
            />
          </div>
        </div>

        {/* Side panel — spans 4 cols */}
        <div className="lg:col-span-4 flex flex-col gap-5">

          {/* ── Pending connection requests ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Pending Requests</h3>
              {!loading && pending.length > 0 && (
                <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm">
                  {pending.length}
                </span>
              )}
            </div>

            {loading ? (
              <SidebarSkeleton rows={2} />
            ) : pending.length === 0 ? (
              <EmptyState
                icon={<IconCheck />}
                title="All clear!"
                subtitle="No pending connection requests."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {pending.slice(0, 5).map((req) => (
                  <div key={req.id} className="px-4 py-3 transition-colors duration-150 hover:bg-gray-50/50">
                    <PendingRequestCard
                      request={req}
                      onResolved={handlePendingResolved}
                    />
                  </div>
                ))}
                {pending.length > 5 && (
                  <p className="px-5 py-3 text-xs text-gray-400 text-center">
                    +{pending.length - 5} more — visit My Connections to see all
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Recent feedback ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Recent Feedback</h3>
            </div>

            {loading ? (
              <SidebarSkeleton rows={2} />
            ) : receivedFeedback.length === 0 ? (
              <EmptyState
                icon={<IconChat />}
                title="No feedback yet"
                subtitle="Feedback you receive will appear here."
              />
            ) : (
              <div className="divide-y divide-gray-50">
                {receivedFeedback.slice(0, 3).map((fb) => (
                  <FeedbackRow key={fb.id} feedback={fb} />
                ))}
                {receivedFeedback.length > 3 && (
                  <p className="px-5 py-3 text-xs text-gray-400 text-center">
                    +{receivedFeedback.length - 3} more — visit Feedback to see all
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = memo(function StatCard({ label, value, icon, iconBg, iconColor, loading, highlight, suffix = '' }) {
  return (
    <div
      className={[
        'group bg-white rounded-2xl border px-5 py-4 flex items-center gap-4',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        highlight ? 'border-amber-200 shadow-sm ring-1 ring-amber-100' : 'border-gray-100 shadow-sm',
      ].join(' ')}
    >
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-110`}>
        <span className="w-5 h-5">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-14 bg-gray-100 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5 tabular-nums">
            {value}
            {suffix && <span className="text-sm font-normal text-gray-400">{suffix}</span>}
          </p>
        )}
      </div>
    </div>
  )
})

// ── FeedbackRow ──────────────────────────────────────────────────────────────

function FeedbackRow({ feedback }) {
  const from = feedback.fromEmployee
  const colors = DESIGNATION_COLORS[from?.designation] ?? { bg: '#64748B' }

  return (
    <div className="px-5 py-4 transition-colors duration-150 hover:bg-gray-50/50">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
          style={{ backgroundColor: colors.bg }}
        >
          {getInitials(from?.name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + date */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-800 truncate">
              {from?.name}
            </span>
            <span className="text-[11px] text-gray-400 flex-shrink-0">
              {formatDate(feedback.feedbackDate)}
            </span>
          </div>

          {/* Star rating */}
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 ${i < feedback.rating ? 'text-amber-400' : 'text-gray-200'}`}
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
            <span className="text-[11px] text-gray-400 ml-1.5 font-medium">{feedback.rating}/5</span>
          </div>

          {/* Comment */}
          {feedback.comment && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
              {feedback.comment}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2.5 py-10 px-4 text-center">
      <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300">
        <span className="w-5 h-5">{icon}</span>
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}

// ── SidebarSkeleton ──────────────────────────────────────────────────────────

function SidebarSkeleton({ rows = 3 }) {
  return (
    <div className="divide-y divide-gray-50 animate-pulse">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-4">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded-lg w-3/4" />
            <div className="h-3 bg-gray-100 rounded-lg w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconLink({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconClock({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconChat({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function IconStar({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function IconCheck({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
