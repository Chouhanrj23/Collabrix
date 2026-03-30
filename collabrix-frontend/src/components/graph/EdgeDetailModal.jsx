import { useEffect, useCallback, useState } from 'react'
import { DESIGNATION_COLORS, RELATIONSHIP_TYPE_DISPLAY } from '../../utils/designationUtils'
import { getInitials, getDuration, formatDate } from '../../utils/formatters'
import { feedbackService } from '../../api/feedbackService'
import LoadingSpinner from '../common/LoadingSpinner'

const RELATIONSHIP_EDGE_COLORS = {
  REPORTING_PARTNER: '#8B5CF6',
  ENGAGEMENT_PARTNER: '#F59E0B',
  REPORTING_MANAGER: '#3B82F6',
  ENGAGEMENT_MANAGER: '#06B6D4',
  INTERNAL_PRODUCT_DEVELOPMENT: '#EF4444',
  PEER: '#10B981',
  OTHERS: '#94A3B8',
}

/**
 * EdgeDetailModal
 *
 * Opens when an edge is clicked in CollaborationGraph.
 * Shows relationship details between two employees.
 */
export default function EdgeDetailModal({ isOpen, edge, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  const [edgeFeedback, setEdgeFeedback] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch feedback between the two users
  useEffect(() => {
    if (!isOpen || !edge) return

    const sourceId = edge.from;
    const targetId = edge.to;

    // Role-based visibility logic
    const isPeerRelation = edge.relationshipType === 'PEER';
    if (isPeerRelation) {
      setEdgeFeedback([]);
      return;
    }

    let isMounted = true
    const fetchFeedback = async () => {
      setLoading(true)
      try {
        // Fetch feedback received by both employees to ensure we get bidirectional feedback
        const [sourceReceived, targetReceived] = await Promise.all([
          feedbackService.getForEmployee(sourceId).catch(() => []),
          feedbackService.getForEmployee(targetId).catch(() => [])
        ])

        if (isMounted) {
          const allFeedback = [...sourceReceived, ...targetReceived];

          // Filter feedback exclusively between these two nodes
          const related = allFeedback.filter(f =>
            (f.fromEmployee?.id === sourceId && f.toEmployee?.id === targetId) ||
            (f.fromEmployee?.id === targetId && f.toEmployee?.id === sourceId)
          )

          // Deduplicate by ID in case of overlap
          const uniqueFeedback = Array.from(new Map(related.map(item => [item.id, item])).values());

          // Sort latest first
          uniqueFeedback.sort((a, b) => (b.feedbackDate ?? '').localeCompare(a.feedbackDate ?? ''))
          setEdgeFeedback(uniqueFeedback)
        }
      } catch (err) {
        console.error("Failed to load feedback for edge:", err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchFeedback()

    return () => { isMounted = false }
  }, [isOpen, edge])

  if (!isOpen || !edge) return null

  const relType = edge.relationshipType
  const relDisplay = RELATIONSHIP_TYPE_DISPLAY[relType] ?? relType?.replace(/_/g, ' ') ?? '—'
  const relColor = RELATIONSHIP_EDGE_COLORS[relType] ?? '#94A3B8'

  const fromColors = DESIGNATION_COLORS[edge.fromDesignation] ?? { bg: '#64748B' }
  const toColors = DESIGNATION_COLORS[edge.toDesignation] ?? { bg: '#64748B' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10 sticky top-0">
          <h3 className="text-base font-bold text-gray-900">Connection Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1">

          {/* ── From → To visual ── */}
          <div className="flex items-start gap-4 justify-between bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            {/* From */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md"
                style={{ backgroundColor: fromColors.bg }}
              >
                {getInitials(edge.fromName)}
              </div>
              <p className="text-sm font-bold text-gray-900 text-center leading-tight">
                {edge.fromName}
              </p>
              <p className="text-[11px] text-gray-600 text-center font-medium">
                {edge.fromDesignation?.replace(/_/g, ' ')}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 px-2 pt-3">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: relColor }}>
                {relDisplay}
              </span>
              {relType === 'PEER' ? (
                <svg width="60" height="12" viewBox="0 0 60 12" className="flex-shrink-0">
                  <line x1="0" y1="6" x2="60" y2="6" stroke={relColor} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 4" />
                </svg>
              ) : (
                <svg width="60" height="12" viewBox="0 0 60 12" className="flex-shrink-0">
                  <line x1="0" y1="6" x2="52" y2="6" stroke={relColor} strokeWidth="2.5" strokeLinecap="round" />
                  <polygon points="52,1 60,6 52,11" fill={relColor} />
                </svg>
              )}
            </div>

            {/* To */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md"
                style={{ backgroundColor: toColors.bg }}
              >
                {getInitials(edge.toName)}
              </div>
              <p className="text-sm font-bold text-gray-900 text-center leading-tight">
                {edge.toName}
              </p>
              <p className="text-[11px] text-gray-600 text-center font-medium">
                {edge.toDesignation?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* ── Work Details & Feedback ── */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Relationship Insights
            </h4>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-sm mb-6">
              <DetailRow label="Relationship Type" value={relDisplay} />
              <StatusRow status={edge.status} />
              <DetailRow label="Department" value={edge.department || "Software Engineering"} />
              <DetailRow label="Account" value={edge.account || "—"} />
              <ProjectRow projects={edge.project} />
              <DetailRow label="Start Date" value={edge.startDate ? formatDate(edge.startDate) : "—"} />
              <DetailRow label="End Date" value={edge.endDate ? formatDate(edge.endDate) : "Ongoing"} />
              <DetailRow label="Duration" value={edge.endDate ? getDuration(edge.startDate, edge.endDate) : "Ongoing"} />
            </div>

            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Recent Feedback
            </h4>

            {loading ? (
              <div className="py-8 flex justify-center">
                <LoadingSpinner size="md" color="text-amber-500" />
              </div>
            ) : edge.relationshipType === 'PEER' ? (
              <div className="text-center py-6 px-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                <p className="text-sm text-gray-600">Feedback is private between peers.</p>
              </div>
            ) : edgeFeedback.length === 0 ? (
              <div className="text-center py-6 px-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                <p className="text-sm text-gray-600">No feedback available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {edgeFeedback.map(fb => (
                  <div key={fb.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex flex-col gap-2">
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{fb.comment}"
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-500 text-xs text-shadow-sm">⭐</span>
                      <span className="text-xs font-bold text-amber-700">{fb.rating}.0</span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        By: {fb.fromEmployee?.name ?? 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

const STATUS_CONFIG = {
  APPROVED: { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
  PENDING:  { bg: '#FEF9C3', text: '#CA8A04', border: '#FEF08A' },
  REJECTED: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
}

function StatusRow({ status }) {
  const val = status || 'APPROVED'
  const cfg = STATUS_CONFIG[val] ?? { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' }
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider flex-shrink-0">
        Status
      </span>
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
      >
        {val}
      </span>
    </div>
  )
}

function ProjectRow({ projects }) {
  const list = projects
    ? projects.split(',').map((p) => p.trim()).filter(Boolean)
    : []
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider flex-shrink-0">
        Project
      </span>
      {list.length === 0 ? (
        <span className="text-sm font-semibold text-right text-gray-900">—</span>
      ) : (
        <div className="flex flex-wrap gap-1 justify-end pl-4">
          {list.map((p) => (
            <span
              key={p}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
            >
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
      <span className="text-[11px] text-gray-600 font-bold uppercase tracking-wider flex-shrink-0">
        {label}
      </span>
      <span
        className="text-sm font-semibold text-right truncate pl-4"
        style={{ color: color ?? '#0f172a' }}
      >
        {value}
      </span>
    </div>
  )
}
