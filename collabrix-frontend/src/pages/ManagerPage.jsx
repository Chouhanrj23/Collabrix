import { useEffect, useState, useCallback } from 'react'
import { graphService } from '../api/graphService'
import { useAuth } from '../context/AuthContext'
import PendingRequestCard from '../components/connections/PendingRequestCard'
import CollaborationGraph from '../components/graph/CollaborationGraph'
import Alert from '../components/common/Alert'
import { DesignationBadge } from '../components/common/Badge'
import { getInitials } from '../utils/formatters'
import { DESIGNATION_COLORS } from '../utils/designationUtils'

export default function ManagerPage() {
  const { user } = useAuth()

  // ── Data state ───────────────────────────────────────────────────────────
  const [dashboard, setDashboard] = useState(null)
  const [pendingList, setPendingList] = useState([])

  // ── Loading / error ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Selected reportee + their graph ─────────────────────────────────────
  const [selectedReportee, setSelectedReportee] = useState(null)
  const [reporteeGraph, setReporteeGraph] = useState(null)
  const [reporteeGraphLoading, setReporteeGraphLoading] = useState(false)

  // ── Single API call — pendingApprovals already in ManagerDashboardDto ───
  useEffect(() => {
    graphService.getManagerDashboard()
      .then((dash) => {
        setDashboard(dash)
        setPendingList(dash.pendingApprovals ?? [])
      })
      .catch(() => setError('Failed to load manager dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Reportee click — toggle + lazy-load their graph ─────────────────────
  const handleReporteeClick = useCallback((emp) => {
    if (selectedReportee?.id === emp.id) {
      setSelectedReportee(null)
      setReporteeGraph(null)
      return
    }
    setSelectedReportee(emp)
    setReporteeGraph(null)
    setReporteeGraphLoading(true)
    graphService.getEmployeeGraph(emp.id)
      .then(setReporteeGraph)
      .catch(() => setReporteeGraph(null))
      .finally(() => setReporteeGraphLoading(false))
  }, [selectedReportee?.id])

  const handlePendingResolved = useCallback((id) => {
    setPendingList((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const reportees = dashboard?.reportees ?? []
  const totalConnections = dashboard?.totalConnections ?? 0

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Manager Dashboard</h2>
        {!loading && (
          <p className="text-base text-gray-600 leading-relaxed mt-0.5">
            Overview of your team, their connections, and pending approvals
          </p>
        )}
        <Alert message={error} type="error" onClose={() => setError('')} />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading ? (
          <ManagerSkeleton />
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Direct Reports"
                value={reportees.length}
                icon={<IconUsers />}
              />
              <StatCard
                label="Total Connections"
                value={totalConnections}
                icon={<IconLink />}
              />
              <StatCard
                label="Pending Approvals"
                value={pendingList.length}
                icon={<IconClock />}
                highlight={pendingList.length > 0}
              />
            </div>

            {/* 2-col layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Direct Reports */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Direct Reports</h3>
                  <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold bg-brand-sidebar text-white">
                    {reportees.length}
                  </span>
                </div>
                {reportees.length === 0 ? (
                  <EmptyState
                    icon={<IconUsers />}
                    title="No direct reports"
                    subtitle="No reportees are assigned to you yet."
                  />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {reportees.map((emp) => (
                      <ReporteeRow
                        key={emp.id}
                        emp={emp}
                        isSelected={selectedReportee?.id === emp.id}
                        onClick={() => handleReporteeClick(emp)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Approvals */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Pending Approvals</h3>
                  {pendingList.length > 0 && (
                    <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold bg-amber-500 text-white">
                      {pendingList.length}
                    </span>
                  )}
                </div>
                {pendingList.length === 0 ? (
                  <EmptyState
                    icon={<IconCheck />}
                    title="All caught up!"
                    subtitle="No pending connection requests to review."
                  />
                ) : (
                  <div className="p-3 space-y-2">
                    {pendingList.map((req) => (
                      <PendingRequestCard
                        key={req.id}
                        request={req}
                        onResolved={handlePendingResolved}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reportee graph panel */}
            {selectedReportee && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {selectedReportee.name}'s Network
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">Collaboration connections</p>
                  </div>
                  <button
                    onClick={() => { setSelectedReportee(null); setReporteeGraph(null) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <IconX />
                    <span>Close</span>
                  </button>
                </div>
                <CollaborationGraph
                  graphData={reporteeGraph}
                  loading={reporteeGraphLoading}
                  currentUserId={selectedReportee.id}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── ReporteeRow ───────────────────────────────────────────────────────────────

function ReporteeRow({ emp, isSelected, onClick }) {
  const colors = DESIGNATION_COLORS[emp.designation] ?? { bg: '#64748B' }
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50',
        isSelected ? 'bg-brand-sidebar/5' : '',
      ].join(' ')}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: colors.bg }}
      >
        {getInitials(emp.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{emp.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <DesignationBadge designation={emp.designation} />
        </div>
        {emp.department && (
          <p className="text-xs text-gray-600 mt-0.5 truncate">
            {emp.department}
          </p>
        )}
      </div>
      <span
        className={[
          'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors',
          isSelected ? 'bg-brand-sidebar text-white' : 'bg-gray-100 text-gray-600',
        ].join(' ')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
          {isSelected
            ? <polyline points="18 15 12 9 6 15" />
            : <polyline points="6 9 12 15 18 9" />
          }
        </svg>
      </span>
    </button>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, highlight }) {
  return (
    <div className={[
      'bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4',
      highlight ? 'border-amber-300' : 'border-gray-100',
    ].join(' ')}>
      <div className={[
        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
        highlight ? 'bg-amber-50 text-amber-500' : 'bg-brand-sidebar/10 text-brand-sidebar',
      ].join(' ')}>
        <span className="w-5 h-5">{icon}</span>
      </div>
      <div>
        <p className={[
          'text-2xl font-bold',
          highlight ? 'text-amber-600' : 'text-gray-900',
        ].join(' ')}>{value}</p>
        <p className="text-xs text-gray-600 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
        <span className="w-6 h-6">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-600 max-w-xs">{subtitle}</p>}
    </div>
  )
}

// ── ManagerSkeleton ───────────────────────────────────────────────────────────

function ManagerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gray-200 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-32" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
