import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { feedbackService } from '../api/feedbackService'
import { employeeService } from '../api/employeeService'
import { useAuth } from '../context/AuthContext'
import FeedbackTable from '../components/feedback/FeedbackTable'
import { DesignationBadge, RatingBadge } from '../components/common/Badge'
import { DESIGNATION_COLORS, canGiveFeedback } from '../utils/designationUtils'
import { getInitials, formatDate } from '../utils/formatters'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

const INPUT_CLASS = [
  'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800',
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30',
  'focus:border-brand-sidebar transition-colors',
].join(' ')

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [received, setReceived] = useState([])
  const [given, setGiven] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [givenLoading, setGivenLoading] = useState(false)
  const givenFetchedRef = useRef(false)

  // Received + pending fetched at mount
  useEffect(() => {
    Promise.all([
      feedbackService.getReceived(),
      feedbackService.getPendingRequests(),
    ])
      .then(([recv, pend]) => { setReceived(recv); setPendingRequests(pend) })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  // Lazy-fetch given feedback when tab is first activated
  useEffect(() => {
    if (activeTab !== 1 || givenFetchedRef.current) return
    givenFetchedRef.current = true
    setGivenLoading(true)
    feedbackService.getGiven()
      .then(setGiven)
      .catch(() => { })
      .finally(() => setGivenLoading(false))
  }, [activeTab])

  const handleFulfilled = useCallback((id) =>
    setPendingRequests((prev) => prev.filter((r) => r.id !== id)), [])

  const TABS = [
    { label: 'Received', count: loading ? null : received.length },
    { label: 'Given', count: givenLoading ? null : (given.length > 0 ? given.length : null) },
    { label: 'Give Feedback', count: null },
    { label: 'Request Feedback', count: null },
    { label: 'Pending', count: pendingRequests.length > 0 ? pendingRequests.length : null, highlight: true },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header + tabs ──────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-0 bg-white border-b border-gray-200">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Feedback</h2>
          <p className="text-base text-gray-600 leading-relaxed mt-0.5">
            Request, give, and review feedback with your colleagues
          </p>
        </div>

        <div className="flex gap-1" role="tablist">
          {TABS.map((tab, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={activeTab === i}
              onClick={() => setActiveTab(i)}
              className={[
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap',
                activeTab === i
                  ? 'border-brand-sidebar text-brand-sidebar'
                  : 'border-transparent text-gray-700 hover:text-gray-700 hover:border-gray-300',
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
                        : 'bg-gray-100 text-gray-600',
                  ].join(' ')}
                >
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 0 && <ReceivedTab feedbackList={received} loading={loading} />}
        {activeTab === 1 && <GivenTab feedbackList={given} loading={givenLoading} />}
        {activeTab === 2 && <GiveFeedbackTab user={user} />}
        {activeTab === 3 && <RequestFeedbackTab />}
        {activeTab === 4 && (
          <PendingRequestsTab
            requests={pendingRequests}
            loading={loading}
            onFulfilled={handleFulfilled}
          />
        )}
      </div>
    </div>
  )
}

// ── Tab 0: Received Feedback ──────────────────────────────────────────────────

function ReceivedTab({ feedbackList, loading }) {
  const avg = useMemo(() =>
    feedbackList.length
      ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
      : null,
    [feedbackList]
  )

  if (loading) return <FeedbackSkeleton />

  return (
    <div className="max-w-4xl space-y-5">
      {/* Stats bar */}
      {feedbackList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatMini label="Total Reviews" value={feedbackList.length} />
          <StatMini
            label="Average Rating"
            value={
              <span className="flex items-center gap-1.5">
                {avg}
                <span className="text-amber-400 text-sm">
                  {'★'.repeat(Math.round(avg))}
                  <span className="text-gray-200">{'★'.repeat(5 - Math.round(avg))}</span>
                </span>
              </span>
            }
          />
          <StatMini
            label="Latest Review"
            value={feedbackList[0] ? formatDate(feedbackList[0].feedbackDate) : '—'}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">All Received Feedback</h3>
        </div>
        <div className="p-4">
          <FeedbackTable feedbackList={feedbackList} />
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: Given Feedback ─────────────────────────────────────────────────────

function GivenTab({ feedbackList, loading }) {
  const avg = useMemo(() =>
    feedbackList.length
      ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
      : null,
    [feedbackList]
  )

  if (loading) return <FeedbackSkeleton />

  return (
    <div className="max-w-4xl space-y-5">
      {feedbackList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatMini label="Feedback Given" value={feedbackList.length} />
          <StatMini
            label="Avg. Rating Given"
            value={
              <span className="flex items-center gap-1.5">
                {avg}
                <span className="text-amber-400 text-sm">
                  {'★'.repeat(Math.round(avg))}
                  <span className="text-gray-200">{'★'.repeat(5 - Math.round(avg))}</span>
                </span>
              </span>
            }
          />
          <StatMini
            label="Latest Given"
            value={feedbackList[0] ? formatDate(feedbackList[0].feedbackDate) : '—'}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">All Given Feedback</h3>
        </div>
        <div className="p-4">
          {feedbackList.length === 0 ? (
            <EmptyState
              icon={<IconCheck />}
              title="No feedback given yet"
              subtitle="When you give feedback to colleagues, it will appear here."
            />
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>To</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map((fb) => (
                    <GivenFeedbackRow key={fb.id} fb={fb} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GivenFeedbackRow({ fb }) {
  const to = fb.toEmployee
  const colors = DESIGNATION_COLORS[to?.designation] ?? { bg: '#64748B' }
  return (
    <tr>
      <td>
        <div className="table-employee">
          <div className="avatar avatar-xs" style={{ background: colors.bg }}>
            {getInitials(to?.name)}
          </div>
          <div>
            <div className="table-employee-name">{to?.name ?? '—'}</div>
            <DesignationBadge designation={to?.designation} />
          </div>
        </div>
      </td>
      <td><RatingBadge rating={fb.rating} /></td>
      <td className="feedback-comment">{fb.comment}</td>
      <td className="text-muted text-sm">{formatDate(fb.feedbackDate)}</td>
    </tr>
  )
}

// ── Tab 2: Give Feedback ──────────────────────────────────────────────────────

function GiveFeedbackTab({ user }) {
  const [selected, setSelected] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const filterFn = useCallback(
    (emp) => canGiveFeedback(user?.designation, emp.designation),
    [user?.designation]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected || !rating || !comment.trim()) return
    setLoading(true)
    setError('')
    try {
      await feedbackService.give({ toEmployeeId: selected.id, rating, comment: comment.trim() })
      setSuccess(`Feedback submitted for ${selected.name}.`)
      setSelected(null)
      setRating(0)
      setComment('')
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Failed to submit feedback.'
      // Normalise backend hierarchy error to a friendlier phrase
      setError(
        msg.toLowerCase().includes('senior') || msg.toLowerCase().includes('hierarchy')
          ? 'You cannot give feedback to a higher-level employee. Please select someone at the same level or below.'
          : msg
      )
    } finally {
      setLoading(false)
    }
  }

  const isValid = !!selected && rating > 0 && comment.trim().length > 0

  const designationLabel = selected
    ? canGiveFeedback(user?.designation, selected.designation)
      ? null
      : 'selected-invalid'
    : null

  return (
    <div className="max-w-xl space-y-4">

      {/* Hierarchy info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Hierarchy rule: </span>
          You can only give feedback to employees at the <span className="font-semibold">same level or below</span> in the designation ladder.
          {user?.designation && (
            <span className="block mt-0.5 text-blue-500">
              Your designation: <span className="font-semibold">{DESIGNATION_DISPLAY_LOCAL[user.designation] ?? user.designation.replace(/_/g, ' ')}</span>
            </span>
          )}
        </div>
      </div>

      {success && <SuccessBanner message={success} onDismiss={() => setSuccess('')} />}
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} noValidate className="divide-y divide-gray-100">

          {/* Employee */}
          <div className="px-5 py-4">
            <FieldLabel text="Employee" required />
            <EmployeeSearch
              onSelect={setSelected}
              selected={selected}
              onClear={() => setSelected(null)}
              filterFn={filterFn}
              placeholder="Search by name or email…"
              hierarchyNote="Only employees at your level or below are shown"
            />
            {selected && <SelectedEmployeeCard employee={selected} />}
          </div>

          {/* Rating */}
          <div className="px-5 py-4">
            <FieldLabel text="Rating" required />
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel text="Comment" required />
              <span className="text-xs text-gray-600">{comment.length}/1000</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your feedback here…"
              maxLength={1000}
              rows={4}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 bg-gray-50 flex justify-end">
            <SubmitButton disabled={!isValid || loading} loading={loading} label="Submit Feedback" />
          </div>
        </form>
      </div>
    </div>
  )
}

const DESIGNATION_DISPLAY_LOCAL = {
  DIRECTOR: 'Director',
  PARTNER: 'Partner',
  MANAGER: 'Manager',
  SENIOR_CONSULTANT: 'Senior Consultant',
  CONSULTANT: 'Consultant',
  ASSOCIATE_CONSULTANT: 'Associate Consultant',
}

// ── Tab 2: Request Feedback ───────────────────────────────────────────────────

function RequestFeedbackTab() {
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      await feedbackService.request({
        requestFromEmail: selected.email,
        message: message.trim() || undefined,
      })
      setSuccess(`Feedback request sent to ${selected.name}.`)
      setSelected(null)
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to send feedback request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <p className="text-base text-gray-700 leading-relaxed">
        You can request feedback from any colleague, regardless of hierarchy.
      </p>

      {success && <SuccessBanner message={success} onDismiss={() => setSuccess('')} />}
      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} noValidate className="divide-y divide-gray-100">

          {/* Employee */}
          <div className="px-5 py-4">
            <FieldLabel text="Request feedback from" required />
            <EmployeeSearch
              onSelect={setSelected}
              selected={selected}
              onClear={() => setSelected(null)}
              placeholder="Search by name or email…"
            />
            {selected && <SelectedEmployeeCard employee={selected} />}
          </div>

          {/* Message */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel text="Personal message" />
              <span className="text-xs text-gray-600">{message.length}/500</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to give context… (optional)"
              maxLength={500}
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="px-5 py-4 bg-gray-50 flex justify-end">
            <SubmitButton disabled={!selected || loading} loading={loading} label="Send Request" />
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Tab 3: Pending Requests ───────────────────────────────────────────────────

function PendingRequestsTab({ requests, loading, onFulfilled }) {
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleGive(req, rating, comment) {
    try {
      await feedbackService.give({
        toEmployeeId: req.fromEmployee?.id,
        rating,
        comment,
        requestId: req.id,
      })
      onFulfilled(req.id)
      setSuccessMsg('Feedback submitted!')
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Failed to submit feedback.')
    }
  }

  if (loading) return <FeedbackSkeleton />

  return (
    <div className="max-w-xl space-y-4">
      {successMsg && <SuccessBanner message={successMsg} onDismiss={() => setSuccessMsg('')} />}
      {errorMsg && <ErrorAlert message={errorMsg} onDismiss={() => setErrorMsg('')} />}

      {requests.length === 0 ? (
        <EmptyState
          icon={<IconCheck />}
          title="No pending requests"
          subtitle="You have no feedback requests waiting for a response."
        />
      ) : (
        <>
          <p className="text-xs font-medium text-gray-700 uppercase tracking-wider">
            {requests.length} request{requests.length !== 1 ? 's' : ''} awaiting your response
          </p>
          <div className="space-y-3">
            {requests.map((req) => (
              <PendingFeedbackCard key={req.id} request={req} onGive={handleGive} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function PendingFeedbackCard({ request, onGive }) {
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const from = request.fromEmployee
  const colors = DESIGNATION_COLORS[from?.designation] ?? { bg: '#64748B' }

  async function handleSubmit() {
    if (!rating || !comment.trim()) return
    setLoading(true)
    await onGive(request, rating, comment.trim())
    setLoading(false)
    // Card will unmount after onGive calls onFulfilled
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Request header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
          style={{ backgroundColor: colors.bg }}
        >
          {getInitials(from?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{from?.name}</p>
          <div className="mt-0.5">
            <DesignationBadge designation={from?.designation} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={[
            'flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium border transition-colors',
            expanded
              ? 'border-gray-300 text-gray-600 hover:bg-gray-50'
              : 'border-brand-sidebar bg-brand-sidebar text-white hover:bg-brand-dark',
          ].join(' ')}
        >
          {expanded ? 'Cancel' : 'Give Feedback'}
        </button>
      </div>

      {/* Requester's message */}
      {request.comment && (
        <div className="px-5 pb-3">
          <p className="text-xs text-gray-700 italic bg-gray-50 rounded-lg px-3 py-2">
            "{request.comment}"
          </p>
        </div>
      )}

      {/* Inline feedback form */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-4 bg-gray-50/50">
          <div>
            <FieldLabel text="Your Rating" required />
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel text="Comment" required />
              <span className="text-xs text-gray-600">{comment.length}/1000</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share your feedback for ${from?.name}…`}
              maxLength={1000}
              rows={3}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className="flex justify-end">
            <SubmitButton
              disabled={!rating || !comment.trim() || loading}
              loading={loading}
              label="Submit Feedback"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── EmployeeSearch ─────────────────────────────────────────────────────────────
// Self-contained: manages debounce, API call, and click-outside internally.

function EmployeeSearch({ onSelect, selected, onClear, filterFn, placeholder = 'Search employee…', hierarchyNote }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [wasFiltered, setWasFiltered] = useState(false)   // ← new: were results hidden by hierarchy?
  const containerRef = useRef(null)
  const timerRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleQuery(val) {
    setQuery(val)
    if (selected) onClear()
    clearTimeout(timerRef.current)
    if (val.trim().length < 2) { setSuggestions([]); setOpen(false); return }

    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        let results = await employeeService.search(val)
        results = results.filter((e) => e.id !== user?.employeeId)
        const beforeFilter = results.length
        if (filterFn) results = results.filter(filterFn)
        setWasFiltered(beforeFilter > 0 && results.length === 0)
        setSuggestions(results)
        setOpen(true)
      } catch {
        setSuggestions([])
        setWasFiltered(false)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  function handleSelect(emp) {
    onSelect(emp)
    setQuery(emp.name)
    setOpen(false)
    setSuggestions([])
    setWasFiltered(false)
  }

  function handleClear() {
    onClear()
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setWasFiltered(false)
  }

  return (
    <div ref={containerRef} className="relative mt-1.5">
      {/* Hierarchy note */}
      {hierarchyNote && (
        <p className="text-[11px] text-gray-600 mb-1.5 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 flex-shrink-0">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          {hierarchyNote}
        </p>
      )}

      {/* Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-600 pointer-events-none">
          {searching ? <Spinner className="w-4 h-4" /> : <IconSearch className="w-4 h-4" />}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`${INPUT_CLASS} pl-9 ${selected ? 'pr-16' : 'pr-4'}`}
        />
        {selected && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-600"
          >
            <IconX className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-5 text-center">
              {wasFiltered ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className="w-8 h-8 text-amber-300 mx-auto mb-2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">No eligible employees</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    The matched employee(s) have a higher designation and cannot receive feedback from you.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">No results for "{query}"</p>
              )}
            </div>
          ) : (
            suggestions.map((emp) => {
              const colors = DESIGNATION_COLORS[emp.designation] ?? { bg: '#64748B' }
              return (
                <button
                  key={emp.id}
                  type="button"
                  onMouseDown={() => handleSelect(emp)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: colors.bg }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-600 truncate">{emp.email}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <DesignationBadge designation={emp.designation} />
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="transition-transform hover:scale-110 focus:outline-none"
            aria-label={`Rate ${star} out of 5`}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 transition-colors"
              fill={star <= display ? '#F59E0B' : 'none'}
              stroke={star <= display ? '#F59E0B' : '#D1D5DB'}
              strokeWidth="1.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
        {display > 0 && (
          <span className="ml-2 text-sm font-medium text-amber-600">
            {display}/5 — {RATING_LABELS[display]}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Shared small components ───────────────────────────────────────────────────

function SelectedEmployeeCard({ employee }) {
  const colors = DESIGNATION_COLORS[employee.designation] ?? { bg: '#64748B' }
  return (
    <div className="flex items-center gap-3 mt-2 bg-brand-sidebar/5 border border-brand-sidebar/20 rounded-xl px-4 py-2.5">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
        style={{ backgroundColor: colors.bg }}
      >
        {getInitials(employee.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 truncate">{employee.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <DesignationBadge designation={employee.designation} />
          <span className="text-xs text-gray-600 truncate">{employee.email}</span>
        </div>
      </div>
      <IconCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
    </div>
  )
}

function FieldLabel({ text, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-0.5">
      {text}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function SubmitButton({ disabled, loading, label }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={[
        'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all',
        !disabled
          ? 'bg-brand-sidebar hover:bg-brand-dark shadow-sm hover:shadow'
          : 'bg-gray-300 cursor-not-allowed',
      ].join(' ')}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {loading ? `${label.replace(/^(Submit|Send)/, (m) => m + 'ting').replace(/Feedback$/, 'ing…').replace(/Request$/, 'ing…')}` : label}
    </button>
  )
}

function SuccessBanner({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <IconCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-emerald-700 flex-1 font-medium">{message}</p>
      <button onClick={onDismiss} className="text-emerald-400 hover:text-emerald-600">
        <IconX className="w-4 h-4" />
      </button>
    </div>
  )
}

function ErrorAlert({ message, onDismiss }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      <IconAlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-700 flex-1">{message}</p>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
        <IconX className="w-4 h-4" />
      </button>
    </div>
  )
}

function StatMini({ label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  )
}

function FeedbackSkeleton() {
  return (
    <div className="max-w-xl space-y-3 animate-pulse">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100">
          <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-16 flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
        <span className="w-7 h-7">{icon}</span>
      </div>
      <p className="text-sm font-semibold text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-600 max-w-xs">{subtitle}</p>}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ className = 'w-4 h-4' }) {
  return (
    <div className={`border-2 border-current border-t-transparent rounded-full animate-spin opacity-70 ${className}`} />
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

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
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconCheck({ className = 'w-7 h-7' }) {
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
