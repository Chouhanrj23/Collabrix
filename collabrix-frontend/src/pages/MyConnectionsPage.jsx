import { useEffect, useState, useMemo, useCallback } from 'react'
import { connectionService } from '../api/connectionService'
import { graphService } from '../api/graphService'
import { useAuth } from '../context/AuthContext'
import ConnectionCard from '../components/connections/ConnectionCard'
import PendingRequestCard from '../components/connections/PendingRequestCard'
import CollaborationGraph from '../components/graph/CollaborationGraph'
import NodeDetailModal from '../components/graph/NodeDetailModal'
import Alert from '../components/common/Alert'

export default function MyConnectionsPage() {
  const { user } = useAuth()

  // ── Data state ───────────────────────────────────────────────────────────
  const [connections, setConnections] = useState([])
  const [pending, setPending] = useState([])
  const [graphData, setGraphData] = useState(null)

  // ── Loading state per tab ────────────────────────────────────────────────
  const [connLoading, setConnLoading] = useState(true)
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphFetched, setGraphFetched] = useState(false)

  // ── UI state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalNode, setModalNode] = useState(null)
  const [modalEdges, setModalEdges] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  // ── Fetch connections + pending on mount (graph is lazy) ─────────────────
  useEffect(() => {
    Promise.all([connectionService.getMy(), connectionService.getPending()])
      .then(([conns, pend]) => {
        setConnections(conns)
        setPending(pend)
      })
      .catch(() => setError('Failed to load connections.'))
      .finally(() => setConnLoading(false))
  }, [])

  // ── Tab change — fetch graph only on first visit to tab 2 ────────────────
  const handleTabChange = useCallback((index) => {
    setActiveTab(index)
    if (index === 2 && !graphFetched) {
      setGraphFetched(true)
      setGraphLoading(true)
      graphService.getMyGraph()
        .then(setGraphData)
        .catch(() => setError('Failed to load graph.'))
        .finally(() => setGraphLoading(false))
    }
  }, [graphFetched])

  // ── Pending resolve — removes card and keeps count in sync ───────────────
  const handleResolved = useCallback((id) => {
    setPending((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // ── Open modal from a connection card click ──────────────────────────────
  const handleConnectionClick = useCallback((connection) => {
    const isFromMe = connection.fromEmployee?.id === user?.employeeId
    const other = isFromMe ? connection.toEmployee : connection.fromEmployee
    if (!other) return

    // Shape the node object NodeDetailModal expects (fetches full details itself)
    setModalNode({
      id: other.id,
      label: other.name,
      name: other.name,
      designation: other.designation,
      grade: other.grade,
    })
    // Provide the single edge so the modal can show "Connection Type"
    setModalEdges([{
      from: connection.fromEmployee?.id,
      to: connection.toEmployee?.id,
      relationshipType: connection.relationshipType,
    }])
    setModalOpen(true)
  }, [user?.employeeId])

  // ── Filtered approved connection list ────────────────────────────────────
  const approved = useMemo(
    () => connections.filter((c) => c.status === 'APPROVED'),
    [connections]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return approved
    const q = search.toLowerCase()
    return approved.filter((c) => {
      const isFromMe = c.fromEmployee?.id === user?.employeeId
      const other = isFromMe ? c.toEmployee : c.fromEmployee
      return (
        other?.name?.toLowerCase().includes(q) ||
        other?.account?.toLowerCase().includes(q) ||
        other?.designation?.toLowerCase().includes(q)
      )
    })
  }, [approved, search, user?.employeeId])

  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setModalNode(null)
    setModalEdges([])
  }, [])

  // ── Tab definitions ──────────────────────────────────────────────────────
  const TABS = [
    { label: 'My Connections', count: connLoading ? null : approved.length },
    { label: 'Pending', count: pending.length > 0 ? pending.length : null, highlight: true },
    { label: 'Graph View', count: null },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0 bg-white border-b border-gray-200">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Connections</h2>
            {!connLoading && (
              <p className="text-sm text-gray-400 mt-0.5">
                {approved.length} approved · {pending.length} pending approval
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        <Alert message={error} type="error" onClose={() => setError('')} />

        {/* Tab navigation */}
        <div className="flex gap-1" role="tablist">
          {TABS.map((tab, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={activeTab === i}
              onClick={() => handleTabChange(i)}
              className={[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === i
                  ? 'border-brand-sidebar text-brand-sidebar'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}
            >
              {tab.label}
              {tab.count != null && (
                <span
                  className={[
                    'flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold',
                    tab.highlight
                      ? 'bg-amber-500 text-white'
                      : activeTab === i
                        ? 'bg-brand-sidebar text-white'
                        : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">

        {/* Tab 0 — My Connections */}
        {activeTab === 0 && (
          <div className="space-y-4 max-w-3xl">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                <IconSearch />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, account, or designation…"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30 focus:border-brand-sidebar"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <IconX />
                </button>
              )}
            </div>

            {/* Results count */}
            {!connLoading && search && (
              <p className="text-xs text-gray-400">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
              </p>
            )}

            {/* List */}
            {connLoading ? (
              <ConnectionSkeleton count={5} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<IconLink />}
                title={search ? 'No matches found' : 'No connections yet'}
                subtitle={
                  search
                    ? 'Try a different name or account.'
                    : 'Add your first connection to get started.'
                }
              />
            ) : (
              <div className="space-y-2">
                {filtered.map((connection) => (
                  <div
                    key={connection.id}
                    onClick={() => handleConnectionClick(connection)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnectionClick(connection)}
                    className="cursor-pointer rounded-xl hover:ring-2 hover:ring-brand-sidebar/20 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-sidebar/40"
                  >
                    <ConnectionCard connection={connection} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1 — Pending Requests */}
        {activeTab === 1 && (
          <div className="max-w-2xl space-y-3">
            {connLoading ? (
              <ConnectionSkeleton count={3} />
            ) : pending.length === 0 ? (
              <EmptyState
                icon={<IconCheck />}
                title="All caught up!"
                subtitle="No pending connection requests to review."
              />
            ) : (
              <>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {pending.length} request{pending.length !== 1 ? 's' : ''} awaiting your approval
                </p>
                <div className="space-y-3">
                  {pending.map((req) => (
                    <PendingRequestCard
                      key={req.id}
                      request={req}
                      onResolved={handleResolved}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2 — Graph View */}
        {activeTab === 2 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px] h-[calc(100vh-240px)]">
            <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900">My Direct Network</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Your direct connections and their relationships
              </p>
            </div>
            <div className="flex-1 min-h-0 relative overflow-hidden">
              <CollaborationGraph
                graphData={graphData}
                loading={graphLoading}
                currentUserId={user?.employeeId}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Node detail modal ─────────────────────────────────────────────── */}
      <NodeDetailModal
        isOpen={modalOpen}
        node={modalNode}
        edges={modalEdges}
        currentUserId={user?.employeeId}
        onClose={handleModalClose}
      />
    </div>
  )
}

// ── ConnectionSkeleton ───────────────────────────────────────────────────────

function ConnectionSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="flex gap-2">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-2/5" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-16 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <span className="w-7 h-7">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 max-w-xs">{subtitle}</p>}
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
