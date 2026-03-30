import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { projectService } from '../api/projectService'
import { DESIGNATION_COLORS, isManagerOrAbove } from '../utils/designationUtils'
import { DesignationBadge } from '../components/common/Badge'
import Alert from '../components/common/Alert'
import { getInitials } from '../utils/formatters'

export default function ProjectsPage() {
  const { user } = useAuth()
  const canEdit = isManagerOrAbove(user?.designation)

  // ── Data state ─────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)

  // ── Filter state ───────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')

  // ── Inline-edit state ─────────────────────────────────────────────────────
  const [editingRowId, setEditingRowId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // ── Rename modal state ────────────────────────────────────────────────────
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)

  // ── Toast state ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null) // { message, type }
  const toastTimer = useRef(null)

  // ── Error state ───────────────────────────────────────────────────────────
  const [error, setError] = useState('')

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToast = useCallback((message, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ message, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  // ── Data loaders ───────────────────────────────────────────────────────────

  const fetchProjects = useCallback(() =>
    projectService.getProjects()
      .then(setProjects)
      .catch(() => setError('Failed to load projects.')),
    [])

  const fetchMembers = useCallback((name) => {
    setMembersLoading(true)
    return projectService.getProjectMembers(name)
      .then((data) => setMembers(data.members ?? []))
      .catch(() => setError('Failed to load project members.'))
      .finally(() => setMembersLoading(false))
  }, [])

  useEffect(() => {
    fetchProjects().finally(() => setLoading(false))
  }, [fetchProjects])

  // ── Interaction handlers ───────────────────────────────────────────────────

  function handleProjectSelect(name) {
    if (selectedProject === name) return
    setSelectedProject(name)
    setEditingRowId(null)
    fetchMembers(name)
  }

  async function handleSave(empId) {
    setSaving(true)
    try {
      await projectService.updateEmployeeProject(empId, editValue || null)
      setEditingRowId(null)
      await Promise.all([fetchMembers(selectedProject), fetchProjects()])
      showToast('Project updated successfully')
    } catch (e) {
      showToast(e.message || 'Failed to update project', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleRename() {
    if (!renameValue.trim()) return
    setRenaming(true)
    try {
      const result = await projectService.renameProject(selectedProject, renameValue.trim())
      const newName = renameValue.trim()
      setRenameOpen(false)
      setRenameValue('')
      setSelectedProject(newName)
      await Promise.all([fetchProjects(), fetchMembers(newName)])
      showToast(result.message || `Project renamed to "${newName}"`)
    } catch (e) {
      showToast(e.message || 'Failed to rename project', 'error')
    } finally {
      setRenaming(false)
    }
  }

  function openEdit(emp) {
    setEditingRowId(emp.id)
    setEditValue(emp.project ?? '')
  }

  function cancelEdit() {
    setEditingRowId(null)
    setEditValue('')
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase().trim()
    return q ? projects.filter((p) => p.projectName.toLowerCase().includes(q)) : projects
  }, [projects, search])

  const selectedInfo = projects.find((p) => p.projectName === selectedProject)

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Projects</h2>
            {!loading && (
              <p className="text-sm text-gray-600 mt-0.5">
                {projects.length} project{projects.length !== 1 ? 's' : ''} across the organisation
              </p>
            )}
          </div>
          {!canEdit && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <IconLock size={12} />
              View only
            </span>
          )}
        </div>
      </div>

      {/* ── Error alert ─────────────────────────────────────────────────────── */}
      <Alert message={error} type="error" onClose={() => setError('')} />

      {/* ── Body: split layout ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Project list ─────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white">

          {/* Search */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <span className="absolute inset-y-0 left-2.5 flex items-center text-gray-400 pointer-events-none">
                <IconSearch />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter projects…"
                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30 focus:border-brand-sidebar transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <IconX />
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {loading ? (
              <ProjectListSkeleton />
            ) : filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-gray-300">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
                <p className="text-xs text-gray-400">{search ? `No projects matching "${search}"` : 'No projects yet'}</p>
              </div>
            ) : (
              filteredProjects.map((p) => (
                <button
                  key={p.projectName}
                  onClick={() => handleProjectSelect(p.projectName)}
                  className={[
                    'w-full text-left px-4 py-3 rounded-xl border transition-all duration-150',
                    selectedProject === p.projectName
                      ? 'bg-brand-sidebar/10 border-brand-sidebar/25 ring-1 ring-brand-sidebar/20 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/80',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={[
                      'text-sm font-medium truncate leading-snug',
                      selectedProject === p.projectName ? 'text-brand-sidebar' : 'text-gray-800',
                    ].join(' ')}>
                      {p.projectName}
                    </p>
                    <span className={[
                      'flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full leading-none',
                      selectedProject === p.projectName
                        ? 'bg-brand-sidebar text-white'
                        : 'bg-gray-100 text-gray-600',
                    ].join(' ')}>
                      {p.memberCount}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── RIGHT: Members panel ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/30">
          {!selectedProject ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 select-none">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-gray-400">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" strokeLinecap="round" />
                  <line x1="9" y1="16" x2="13" y2="16" strokeLinecap="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Select a project</p>
                <p className="text-xs text-gray-400 mt-1">Click a project on the left to view its members</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Right panel header ── */}
              <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 leading-tight">{selectedProject}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {membersLoading
                      ? 'Loading…'
                      : `${selectedInfo?.memberCount ?? members.length} member${(selectedInfo?.memberCount ?? members.length) !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => { setRenameOpen(true); setRenameValue('') }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-sidebar text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <IconEdit />
                    Rename Project
                  </button>
                )}
              </div>

              {/* ── Members table ── */}
              {membersLoading ? (
                <TableSkeleton />
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 opacity-40">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <p className="text-sm">No members found for this project</p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 sticky top-0 z-10">
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                        {canEdit && <th className="px-4 py-3.5 w-12" />}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                      {members.map((emp) => (
                        <MemberRow
                          key={emp.id}
                          emp={emp}
                          canEdit={canEdit}
                          editing={editingRowId === emp.id}
                          editValue={editingRowId === emp.id ? editValue : ''}
                          saving={saving}
                          onEdit={() => openEdit(emp)}
                          onCancel={cancelEdit}
                          onSave={() => handleSave(emp.id)}
                          onEditValueChange={setEditValue}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Rename modal ────────────────────────────────────────────────────── */}
      {renameOpen && (
        <RenameModal
          projectName={selectedProject}
          memberCount={selectedInfo?.memberCount ?? members.length}
          value={renameValue}
          onChange={setRenameValue}
          onConfirm={handleRename}
          onClose={() => setRenameOpen(false)}
          loading={renaming}
        />
      )}

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

// ── MemberRow ─────────────────────────────────────────────────────────────────

function MemberRow({ emp, canEdit, editing, editValue, saving, onEdit, onCancel, onSave, onEditValueChange }) {
  const colors = DESIGNATION_COLORS[emp.designation] ?? { bg: '#64748B' }

  function handleKeyDown(e) {
    if (e.key === 'Enter') onSave()
    if (e.key === 'Escape') onCancel()
  }

  return (
    <tr className="hover:bg-gray-50/60 transition-colors duration-100">

      {/* Name */}
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm"
            style={{ backgroundColor: colors.bg }}
          >
            {getInitials(emp.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{emp.email}</p>
          </div>
        </div>
      </td>

      {/* Designation */}
      <td className="px-6 py-3.5">
        <DesignationBadge designation={emp.designation} />
      </td>

      {/* Account (mapped to department) */}
      <td className="px-6 py-3.5">
        <span className="text-sm text-gray-700">{emp.department || '—'}</span>
      </td>

      {/* Project — editable when in edit mode */}
      <td className="px-6 py-3.5">
        {editing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="e.g. AI in SDLC, Banking"
            className="w-full max-w-xs px-2.5 py-1.5 text-sm border border-brand-sidebar/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sidebar/25 bg-white"
          />
        ) : (
          <span className="text-sm text-gray-700">{emp.project || '—'}</span>
        )}
      </td>

      {/* Edit actions */}
      {canEdit && (
        <td className="px-4 py-3.5">
          {editing ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onSave}
                disabled={saving}
                className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={onCancel}
                disabled={saving}
                className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={onEdit}
              title="Edit project"
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-sidebar hover:bg-brand-sidebar/10 transition-all duration-150"
            >
              <IconPencil />
            </button>
          )}
        </td>
      )}
    </tr>
  )
}

// ── RenameModal ───────────────────────────────────────────────────────────────

function RenameModal({ projectName, memberCount, value, onChange, onConfirm, onClose, loading }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isDirty = value.trim() && value.trim() !== projectName

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Rename Project"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-800">Rename Project</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Rename <span className="font-semibold text-gray-800">"{projectName}"</span> across{' '}
            <span className="font-semibold text-gray-800">{memberCount}</span>{' '}
            employee{memberCount !== 1 ? 's' : ''}.
            This will update the project field for all matching employees.
          </p>

          {/* Current name (read-only) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Current Name
            </label>
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500">
              {projectName}
            </div>
          </div>

          {/* New name input */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              New Name
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && isDirty && onConfirm()}
              placeholder="Enter new project name…"
              autoFocus
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30 focus:border-brand-sidebar transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-5 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !isDirty}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-sidebar rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
          >
            {loading ? 'Renaming…' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type = 'success' }) {
  return (
    <div
      className={[
        'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium max-w-sm',
        type === 'success'
          ? 'bg-emerald-600 text-white'
          : 'bg-red-600 text-white',
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      {type === 'success' ? <IconCheckCircle /> : <IconAlertCircle />}
      <span>{message}</span>
    </div>
  )
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────

function ProjectListSkeleton() {
  return (
    <div className="space-y-1.5 animate-pulse">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="px-4 py-3 rounded-xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-gray-100 rounded w-2/3" />
            <div className="h-5 w-8 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="flex-1 bg-white animate-pulse">
      <div className="h-11 bg-gray-50 border-b border-gray-100" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-1/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/5" />
          </div>
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
          <div className="h-3 bg-gray-100 rounded w-1/6" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconAlertCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconLock({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
