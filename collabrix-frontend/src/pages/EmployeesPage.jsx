import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { employeeService } from '../api/employeeService'
import { graphService } from '../api/graphService'
import { useAuth } from '../context/AuthContext'
import Alert from '../components/common/Alert'
import CollaborationGraph from '../components/graph/CollaborationGraph'
import { DesignationBadge } from '../components/common/Badge'
import { DESIGNATION_COLORS, DESIGNATION_LEVELS, isSeniorTo } from '../utils/designationUtils'
import { getInitials, formatDate } from '../utils/formatters'

export default function EmployeesPage() {
  const { user } = useAuth()

  // ── Data state ───────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Filter state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filterDesignation, setFilterDesignation] = useState('')

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modalEmp, setModalEmp] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [empGraph, setEmpGraph] = useState(null)
  const [empGraphLoading, setEmpGraphLoading] = useState(false)

  // ── Fetch all employees on mount ─────────────────────────────────────────
  useEffect(() => {
    employeeService.getAll()
      .then(setEmployees)
      .catch(() => setError('Failed to load employees.'))
      .finally(() => setLoading(false))
  }, [])

  // ── Designation options sorted by level descending (Director first) ──────
  const designationOptions = useMemo(() => {
    const unique = [...new Set(employees.map((e) => e.designation))]
    return unique.sort((a, b) => (DESIGNATION_LEVELS[b] ?? 0) - (DESIGNATION_LEVELS[a] ?? 0))
  }, [employees])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return employees.filter((e) => {
      const matchSearch = !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department ?? '').toLowerCase().includes(q)
      const matchDesig = !filterDesignation || e.designation === filterDesignation
      return matchSearch && matchDesig
    })
  }, [employees, search, filterDesignation])

  // ── Open profile modal ────────────────────────────────────────────────────
  const openProfile = useCallback((emp) => {
    setModalEmp(emp)
    setEmpGraph(null)
    setModalOpen(true)
    // Only load graph if current user is at least as senior
    if (user && !isSeniorTo(emp.designation, user.designation)) {
      setEmpGraphLoading(true)
      graphService.getEmployeeGraph(emp.id)
        .then(setEmpGraph)
        .catch(() => setEmpGraph(null))
        .finally(() => setEmpGraphLoading(false))
    }
  }, [user])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setModalEmp(null)
    setEmpGraph(null)
  }, [])

  const canViewGraph = modalEmp != null && user != null &&
    !isSeniorTo(modalEmp.designation, user.designation)

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Employees</h2>
        {!loading && (
          <p className="text-base text-gray-600 leading-relaxed mt-0.5">
            {employees.length} employee{employees.length !== 1 ? 's' : ''} in the organisation
          </p>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <Alert message={error} type="error" onClose={() => setError('')} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-600 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department…"
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30 focus:border-brand-sidebar"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-600"
                aria-label="Clear search"
              >
                <IconX />
              </button>
            )}
          </div>

          {/* Designation filter */}
          <select
            value={filterDesignation}
            onChange={(e) => setFilterDesignation(e.target.value)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30 focus:border-brand-sidebar sm:w-52"
          >
            <option value="">All Designations</option>
            {designationOptions.map((d) => (
              <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && (search || filterDesignation) && (
          <p className="text-xs text-gray-600">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {search && ` for "${search}"`}
            {filterDesignation && ` · ${filterDesignation.replace(/_/g, ' ')}`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <EmployeeSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={!!(search || filterDesignation)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((emp) => (
              <EmployeeCard
                key={emp.id}
                emp={emp}
                isMe={emp.id === user?.employeeId}
                onClick={() => openProfile(emp)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Employee profile modal ─────────────────────────────────────── */}
      {modalOpen && modalEmp && (
        <EmployeeModal
          emp={modalEmp}
          graph={empGraph}
          graphLoading={empGraphLoading}
          canViewGraph={canViewGraph}
          currentUserId={user?.employeeId}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

// ── EmployeeCard ──────────────────────────────────────────────────────────────

function EmployeeCard({ emp, isMe, onClick }) {
  const colors = DESIGNATION_COLORS[emp.designation] ?? { bg: '#64748B' }
  return (
    <button
      onClick={onClick}
      className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-sidebar/30 transition-all text-left p-4 w-full"
    >
      {isMe && (
        <span className="absolute top-3 right-3 px-1.5 py-0.5 text-[10px] font-bold bg-brand-sidebar text-white rounded-full">
          You
        </span>
      )}
      <div className="flex flex-col items-center text-center gap-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: colors.bg }}
        >
          {getInitials(emp.name)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{emp.name}</p>
          <div className="flex justify-center mt-1">
            <DesignationBadge designation={emp.designation} />
          </div>
          <p className="text-xs text-gray-600 mt-1 truncate max-w-[160px]">{emp.department || '—'}</p>
        </div>
      </div>
    </button>
  )
}

// ── EmployeeModal ─────────────────────────────────────────────────────────────

function EmployeeModal({ emp, graph, graphLoading, canViewGraph, currentUserId, onClose }) {
  const colors = DESIGNATION_COLORS[emp.designation] ?? { bg: '#64748B' }
  const overlayRef = useRef(null)

  // Escape key + body scroll lock
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Employee Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <IconXLg />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Identity */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
              style={{ background: colors.bg }}
            >
              {getInitials(emp.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{emp.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <DesignationBadge designation={emp.designation} />
              </div>
            </div>
          </div>

          {/* Work details */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
            <DetailRow label="Email" value={emp.email} />
            {canViewGraph && (
              <>
                {emp.department && <DetailRow label="Department" value={emp.department} />}
                {emp.joiningDate && <DetailRow label="Joined" value={formatDate(emp.joiningDate)} />}
              </>
            )}
          </div>

          {/* Graph or restricted notice */}
          {canViewGraph ? (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Collaboration Network</h4>
              <div className="rounded-xl border border-gray-100 overflow-hidden" style={{ height: 280 }}>
                <CollaborationGraph
                  graphData={graph}
                  loading={graphLoading}
                  currentUserId={currentUserId}
                  currentUserDesignation={emp?.designation}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 flex-shrink-0">
                <IconLock />
              </span>
              <span className="text-sm text-gray-700">
                Connection details are only visible to senior colleagues.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── DetailRow ─────────────────────────────────────────────────────────────────

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-medium text-gray-600 flex-shrink-0">{label}</span>
      <span className="text-xs text-gray-700 text-right">{value}</span>
    </div>
  )
}

// ── EmployeeSkeleton ──────────────────────────────────────────────────────────

function EmployeeSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-gray-200" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-5 bg-gray-200 rounded w-28" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
        <IconSearch />
      </div>
      <p className="text-sm font-semibold text-gray-600">No employees found</p>
      <p className="text-xs text-gray-600">
        {hasFilters ? 'Try adjusting your search or filter.' : 'No employees have been added yet.'}
      </p>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function IconXLg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
