import { useEffect, useState, useRef, useCallback } from 'react'
import { employeeService } from '../api/employeeService'
import { connectionService } from '../api/connectionService'
import { useAuth } from '../context/AuthContext'
import { RELATIONSHIP_TYPES, DESIGNATION_COLORS, DESIGNATION_DISPLAY } from '../utils/designationUtils'
import { getInitials } from '../utils/formatters'
import { DesignationBadge } from '../components/common/Badge'

const INITIAL_FORM = {
  targetEmail:      '',
  relationshipType: '',
  account:          '',
  project:          '',
  duration:         '',
}

const INPUT_CLASS = [
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800',
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30',
  'focus:border-brand-sidebar transition-colors',
].join(' ')

export default function AddConnectionPage() {
  const { user } = useAuth()

  // ── Form state ───────────────────────────────────────────────────────────
  const [form,             setForm]             = useState(INITIAL_FORM)
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  // ── Employee search state ────────────────────────────────────────────────
  const [employeeQuery,    setEmployeeQuery]    = useState('')
  const [empSuggestions,   setEmpSuggestions]   = useState([])
  const [empDropdownOpen,  setEmpDropdownOpen]  = useState(false)
  const [empSearching,     setEmpSearching]     = useState(false)
  const empContainerRef = useRef(null)
  const empTimerRef     = useRef(null)

  // ── Account autocomplete state ───────────────────────────────────────────
  const [accountList,       setAccountList]       = useState([])
  const [accountSuggestions,setAccountSuggestions]= useState([])
  const [acctDropdownOpen,  setAcctDropdownOpen]  = useState(false)
  const acctContainerRef = useRef(null)

  // ── Submit state ─────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState('')
  const [error,      setError]      = useState('')

  // ── Load account list on mount ───────────────────────────────────────────
  useEffect(() => {
    employeeService.getAccounts().then(setAccountList).catch(() => {})
  }, [])

  // ── Close dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    function handleOutside(e) {
      if (empContainerRef.current  && !empContainerRef.current.contains(e.target))  setEmpDropdownOpen(false)
      if (acctContainerRef.current && !acctContainerRef.current.contains(e.target)) setAcctDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // ── Employee search with 300ms debounce ──────────────────────────────────
  const handleEmployeeQuery = useCallback((val) => {
    setEmployeeQuery(val)
    setSelectedEmployee(null)
    setForm((f) => ({ ...f, targetEmail: '' }))
    clearTimeout(empTimerRef.current)

    if (val.trim().length < 2) {
      setEmpSuggestions([])
      setEmpDropdownOpen(false)
      return
    }

    empTimerRef.current = setTimeout(async () => {
      setEmpSearching(true)
      try {
        const results = await employeeService.search(val)
        // Exclude self
        setEmpSuggestions(results.filter((e) => e.id !== user?.employeeId))
        setEmpDropdownOpen(true)
      } catch {
        setEmpSuggestions([])
      } finally {
        setEmpSearching(false)
      }
    }, 300)
  }, [user?.employeeId])

  function selectEmployee(emp) {
    setSelectedEmployee(emp)
    setEmployeeQuery(emp.name)
    setEmpDropdownOpen(false)
    setEmpSuggestions([])
    setForm((f) => ({
      ...f,
      targetEmail: emp.email,
      // Pre-fill account from employee's own account if field is empty
      account: f.account || emp.account || '',
    }))
  }

  function clearEmployee() {
    setSelectedEmployee(null)
    setEmployeeQuery('')
    setForm((f) => ({ ...f, targetEmail: '' }))
  }

  // ── Account autocomplete ─────────────────────────────────────────────────
  function handleAccountInput(val) {
    setForm((f) => ({ ...f, account: val }))
    if (!val.trim()) {
      setAcctDropdownOpen(false)
      return
    }
    const matches = accountList.filter((a) =>
      a.toLowerCase().includes(val.toLowerCase())
    )
    setAccountSuggestions(matches)
    setAcctDropdownOpen(matches.length > 0)
  }

  // ── Form submit ──────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!selectedEmployee) {
      setError('Please select an employee from the search results.')
      return
    }

    setSubmitting(true)
    try {
      await connectionService.request(form)
      setSuccess(`Connection request sent to ${selectedEmployee.name}. Awaiting their approval.`)
      setForm(INITIAL_FORM)
      setEmployeeQuery('')
      setSelectedEmployee(null)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send connection request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleReset() {
    setForm(INITIAL_FORM)
    setEmployeeQuery('')
    setSelectedEmployee(null)
    setError('')
    setSuccess('')
  }

  const isValid =
    !!form.targetEmail &&
    !!form.relationshipType &&
    !!form.account.trim() &&
    !!form.project.trim() &&
    !!form.duration.trim()

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Add Connection</h2>
        <p className="text-sm text-gray-400 mt-1">
          Send a connection request to a colleague. It becomes active once they approve it.
        </p>
      </div>

      {/* ── Success banner ────────────────────────────────────────────────── */}
      {success && (
        <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
            <IconCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800">Request Sent!</p>
            <p className="text-sm text-emerald-700 mt-0.5">{success}</p>
          </div>
          <button
            onClick={handleReset}
            className="flex-shrink-0 text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
          >
            Send another
          </button>
        </div>
      )}

      {/* ── Error alert ───────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <IconAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 flex-shrink-0">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Form card ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >

        {/* ── Section 1: Employee ── */}
        <div className="px-6 py-5 border-b border-gray-100">
          <SectionHeading step="1" title="Who would you like to connect with?" />

          <div className="mt-4 space-y-3" ref={empContainerRef}>
            <label className="block text-sm font-medium text-gray-700">
              Search Employee <Required />
            </label>

            {/* Search input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                {empSearching ? <Spinner /> : <IconSearch className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={employeeQuery}
                onChange={(e) => handleEmployeeQuery(e.target.value)}
                onFocus={() => empSuggestions.length > 0 && setEmpDropdownOpen(true)}
                placeholder="Type a name or email to search…"
                autoComplete="off"
                className={`${INPUT_CLASS} pl-9 ${selectedEmployee ? 'pr-20' : 'pr-4'}`}
              />
              {selectedEmployee && (
                <button
                  type="button"
                  onClick={clearEmployee}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 text-xs font-medium gap-1"
                >
                  <IconX className="w-3.5 h-3.5" /> Clear
                </button>
              )}

              {/* Employee dropdown */}
              {empDropdownOpen && empSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
                  {empSuggestions.map((emp) => {
                    const colors = DESIGNATION_COLORS[emp.designation] ?? { bg: '#64748B' }
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onMouseDown={() => selectEmployee(emp)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                          style={{ backgroundColor: colors.bg }}
                        >
                          {getInitials(emp.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                          <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                        </div>
                        <div className="flex-shrink-0 ml-auto">
                          <DesignationBadge designation={emp.designation} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* No results hint */}
              {empDropdownOpen && !empSearching && empSuggestions.length === 0 && employeeQuery.length >= 2 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-400">
                  No employees found for "{employeeQuery}"
                </div>
              )}
            </div>

            {/* Selected employee card */}
            {selectedEmployee && (
              <div className="flex items-center gap-3 bg-brand-sidebar/5 border border-brand-sidebar/20 rounded-xl px-4 py-3">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: (DESIGNATION_COLORS[selectedEmployee.designation] ?? { bg: '#64748B' }).bg }}
                >
                  {getInitials(selectedEmployee.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedEmployee.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <DesignationBadge designation={selectedEmployee.designation} />
                    <span className="text-xs text-gray-400">{selectedEmployee.email}</span>
                  </div>
                </div>
                <IconCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Relationship type ── */}
        <div className="px-6 py-5 border-b border-gray-100">
          <SectionHeading step="2" title="Relationship Type" />

          <p className="text-xs text-gray-400 mt-1 mb-4">
            How are you collaborating with this person?
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RELATIONSHIP_TYPES.map((rt) => {
              const active = form.relationshipType === rt.value
              return (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, relationshipType: rt.value }))}
                  className={[
                    'relative px-3 py-2.5 rounded-xl border-2 text-left transition-all text-sm font-medium',
                    active
                      ? 'border-brand-sidebar bg-brand-sidebar/5 text-brand-sidebar'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {active && (
                    <span className="absolute top-2 right-2">
                      <IconCheckCircle className="w-3.5 h-3.5 text-brand-sidebar" />
                    </span>
                  )}
                  {rt.label}
                </button>
              )
            })}
          </div>
          {!form.relationshipType && (
            <p className="text-xs text-gray-400 mt-2">Select one to continue</p>
          )}
        </div>

        {/* ── Section 3: Connection details ── */}
        <div className="px-6 py-5 border-b border-gray-100">
          <SectionHeading step="3" title="Connection Details" />
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Provide context for this working relationship.
          </p>

          {/* Account + Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Account with autocomplete */}
            <div ref={acctContainerRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account <Required />
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.account}
                  onChange={(e) => handleAccountInput(e.target.value)}
                  placeholder="e.g. TechCorp India"
                  className={INPUT_CLASS}
                  autoComplete="off"
                />
                {acctDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                    {accountSuggestions.map((acct) => (
                      <button
                        key={acct}
                        type="button"
                        onMouseDown={() => {
                          setForm((f) => ({ ...f, account: acct }))
                          setAcctDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {acct}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedEmployee?.account && !form.account && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, account: selectedEmployee.account }))}
                  className="mt-1 text-xs text-brand-light underline"
                >
                  Use {selectedEmployee.name}'s account ({selectedEmployee.account})
                </button>
              )}
            </div>

            {/* Project */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project <Required />
              </label>
              <input
                type="text"
                value={form.project}
                onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
                placeholder="e.g. ERP Modernisation"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Duration <Required />
            </label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 6 months, Jan 2024 – Jun 2024"
              className={INPUT_CLASS}
            />
            <p className="mt-1 text-xs text-gray-400">
              Describe how long you've worked together or plan to.
            </p>
          </div>
        </div>

        {/* ── Form actions ── */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-50">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className={[
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
              isValid && !submitting
                ? 'bg-brand-sidebar hover:bg-brand-dark shadow-sm hover:shadow'
                : 'bg-gray-300 cursor-not-allowed',
            ].join(' ')}
          >
            {submitting && <Spinner />}
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </div>
      </form>

      {/* ── Info box ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <IconInfo className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">Approval Required</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Your request will be sent to the employee for approval. The connection becomes
            visible in graphs and reports only after they accept it.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ step, title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-sidebar text-white text-xs font-bold flex items-center justify-center">
        {step}
      </span>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
  )
}

function Required() {
  return <span className="text-red-400 ml-0.5">*</span>
}

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconSearch({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconX({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <line x1="18" y1="6"  x2="6"  y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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

function IconCheckCircle({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function IconAlertCircle({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function IconInfo({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}
