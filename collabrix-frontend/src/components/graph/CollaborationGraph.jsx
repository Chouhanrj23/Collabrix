import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import { DESIGNATION_COLORS, RELATIONSHIP_TYPE_DISPLAY } from '../../utils/designationUtils'
import LoadingSpinner from '../common/LoadingSpinner'
import NodeDetailModal from './NodeDetailModal'

// ── Edge colors per relationship type ─────────────────────────────────────────
const RELATIONSHIP_EDGE_COLORS = {
  REPORTING_PARTNER: '#8B5CF6',
  ENGAGEMENT_PARTNER: '#F59E0B',
  REPORTING_MANAGER: '#3B82F6',
  ENGAGEMENT_MANAGER: '#06B6D4',
  INTERNAL_PRODUCT_DEVELOPMENT: '#EF4444',
  PEER: '#10B981',
  OTHERS: '#94A3B8',
}

// ── Map designation → hierarchy level (1 = top of org chart) ──────────────────
const HIERARCHY_LEVEL = {
  PARTNER: 1,
  DIRECTOR: 2,
  MANAGER: 3,
  SENIOR_CONSULTANT: 4,
  CONSULTANT: 5,
  ASSOCIATE_CONSULTANT: 6,
}

// ── Readable relationship label ──────────────────────────────────────────────
function formatRelationship(type) {
  if (!type) return ''
  return type
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Readable designation label ────────────────────────────────────────────────
function designationLabel(d) {
  if (!d) return ''
  return d.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    .replace('Senior Consultant', 'Sr. Consultant')
    .replace('Associate Consultant', 'Assoc. Consultant')
}

// ── vis-network configuration — hierarchical org-chart layout ─────────────────
const GRAPH_OPTIONS = {
  autoResize: true,
  height: '100%',
  width: '100%',
  layout: {
    hierarchical: {
      enabled: true,
      direction: 'UD',
      sortMethod: 'directed',
      nodeSpacing: 160,
      levelSeparation: 180,
      treeSpacing: 220,
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
    },
  },
  nodes: {
    shape: 'circle',
    size: 30,
    font: {
      size: 15,
      face: 'Inter, system-ui, sans-serif',
      color: '#FFFFFF',
      bold: true,
      strokeWidth: 0,
      strokeColor: 'transparent',
    },
    borderWidth: 2.5,
    shadow: { enabled: true, color: 'rgba(0,0,0,0.08)', size: 10, x: 0, y: 4 },
    chosen: {
      node: (values) => {
        values.size += 4
        values.shadowSize = 18
        values.borderWidth = 4
      },
    },
  },
  edges: {
    arrows: { to: { enabled: true, scaleFactor: 0.6, type: 'arrow' } },
    font: {
      size: 10,
      face: 'Inter, system-ui, sans-serif',
      color: '#6b7280',
      align: 'middle',
      strokeWidth: 3,
      strokeColor: '#FFFFFF',
    },
    width: 1.5,
    selectionWidth: 2.5,
    smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.5 },
    chosen: {
      edge: (values) => {
        values.width = 3
        values.color = '#2563EB'
      },
    },
    hoverWidth: 0.5,
  },
  physics: {
    enabled: false,
  },
  interaction: {
    hover: true,
    tooltipDelay: 200,
    zoomView: false,
    dragView: true,
    dragNodes: true,
    multiselect: false,
    navigationButtons: false,
    keyboard: { enabled: false, bindToWindow: false },
  },
}

// ── Extract initials from full name ───────────────────────────────────────────
function getNodeInitials(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Generate a fallback avatar data URL ───────────────────────────────────────
function generateAvatarDataUrl(name, bgColor) {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 24px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  ctx.fillText(initials, size / 2, size / 2)
  return canvas.toDataURL('image/png')
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * CollaborationGraph
 *
 * @param {object}  graphData     - { nodes: NodeDto[], edges: EdgeDto[] }
 * @param {boolean} loading       - whether parent is still fetching
 * @param {number}  currentUserId - ID of the central/current employee
 */
export default function CollaborationGraph({ graphData, loading, currentUserId }) {
  // ── DOM / network refs ───────────────────────────────────────────────────
  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const networkRef = useRef(null)
  const rawEdgesRef = useRef([])
  const nodesDataSetRef = useRef(null)
  const edgesDataSetRef = useRef(null)
  const flashTimerRef = useRef(null)
  const searchRef = useRef(null)

  // ── Modal state ─────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdges, setSelectedEdges] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  // ── Toolbar state ──────────────────────────────────────────────────────
  const [showRelLegend, setShowRelLegend] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // ── Fullscreen synchronization ─────────────────────────────────────────
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
      setTimeout(() => {
        networkRef.current?.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } })
      }, 50)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // ── Focus mode state ───────────────────────────────────────────────────
  const [focusedNodeId, setFocusedNodeId] = useState(null)

  // ── Search state ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (!searchOpen) return
    function handler(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchOpen])

  // ── Memoized node transformations (with hierarchy level) ───────────────
  const visNodeItems = useMemo(() => {
    if (!graphData?.nodes?.length) return []
    return graphData.nodes.map((n) => {
      const colors = DESIGNATION_COLORS[n.designation] ?? { bg: '#64748B', border: '#475569' }
      const isCenter = n.id === currentUserId
      const level = HIERARCHY_LEVEL[n.designation] ?? 6
      const hasImage = !!n.profileImageUrl

      const fullName = n.label ?? n.name
      const initials = getNodeInitials(fullName)

      const desigLabel = designationLabel(n.designation)

      const nodeBase = {
        id: n.id,
        label: initials,
        level,
        title: `<div style="font:13px Inter,sans-serif;padding:6px 10px;line-height:1.5;max-width:220px">
                  <strong>${fullName}</strong><br/>
                  <span style="color:#64748B">${n.designation?.replace(/_/g, ' ') ?? ''}</span>
                  ${n.account ? `<br/><span style="color:#94A3B8;font-size:11px">${n.account}</span>` : ''}
                </div>`,
        color: {
          background: colors.bg,
          border: isCenter ? '#FFFFFF' : colors.border,
          highlight: { background: colors.bg, border: '#FFFFFF' },
          hover: { background: colors.bg, border: '#E2E8F0' },
        },
        size: isCenter ? 35 : 30,
        borderWidth: isCenter ? 4.5 : 2.5,
        borderWidthSelected: 4.5,
        shadow: isCenter
          ? { enabled: true, color: 'rgba(37,99,235,0.25)', size: 20, x: 0, y: 0 }
          : { enabled: true, color: 'rgba(0,0,0,0.08)', size: 10, x: 0, y: 4 },
        font: {
          color: '#FFFFFF',
          size: 15,
          face: 'Inter, system-ui, sans-serif',
          bold: true,
          strokeWidth: 0,
          strokeColor: 'transparent',
          vadjust: 0,
        },
        _raw: n,
        _fullName: fullName,
        _desigLabel: desigLabel,
      }

      if (hasImage) {
        nodeBase.shape = 'circularImage'
        nodeBase.image = n.profileImageUrl
        nodeBase.brokenImage = generateAvatarDataUrl(n.label ?? n.name, colors.bg)
      }

      return nodeBase
    })
  }, [graphData, currentUserId])

  // ── Memoized edge transformations (labels hidden, hover shows tooltip) ─
  const visEdgeItems = useMemo(() => {
    if (!graphData?.edges?.length) return []
    return graphData.edges.map((e, i) => {
      const edgeColor = RELATIONSHIP_EDGE_COLORS[e.relationshipType] ?? '#CBD5E1'
      return {
        id: e.id ?? i,
        from: e.from,
        to: e.to,
        label: formatRelationship(e.relationshipType),
        title: RELATIONSHIP_TYPE_DISPLAY[e.relationshipType] ?? e.label ?? '',
        color: {
          color: edgeColor + 'A0',    // ~63% opacity for cleaner look
          highlight: '#2563EB',
          hover: edgeColor,
        },
        width: 1.5,
      }
    })
  }, [graphData])

  // ── Search results ─────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return visNodeItems.filter((n) => n._fullName?.toLowerCase().includes(q)).slice(0, 8)
  }, [searchQuery, visNodeItems])

  // ── Focus mode — in-place DataSet updates ──────────────────────────────
  function applyFocusMode(nodeId) {
    const nodesDS = nodesDataSetRef.current
    const edgesDS = edgesDataSetRef.current
    const network = networkRef.current
    if (!nodesDS || !edgesDS || !network) return

    const connectedNodeIds = new Set(network.getConnectedNodes(nodeId).map(String))
    const connectedEdgeIds = new Set(network.getConnectedEdges(nodeId).map(String))
    const focusId = String(nodeId)

    nodesDS.update(
      nodesDS.getIds().map((id) => ({
        id,
        opacity: (String(id) === focusId || connectedNodeIds.has(String(id))) ? 1 : 0.12,
      }))
    )

    edgesDS.update(
      edgesDS.getIds().map((id) => {
        if (connectedEdgeIds.has(String(id))) {
          return { id, width: 3.5 }
        }
        return { id, width: 0.3, color: { color: '#E2E8F0', highlight: '#E2E8F0', hover: '#E2E8F0' } }
      })
    )

    setFocusedNodeId(nodeId)
  }

  // ── Network init / re-init ─────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || loading) return

    rawEdgesRef.current = graphData?.edges ?? []

    setFocusedNodeId(null)
    setSearchQuery('')
    setSearchOpen(false)
    clearTimeout(flashTimerRef.current)

    const nodes = new DataSet(visNodeItems)
    const edges = new DataSet(visEdgeItems)
    nodesDataSetRef.current = nodes
    edgesDataSetRef.current = edges

    if (networkRef.current) {
      networkRef.current.destroy()
      networkRef.current = null
    }

    const network = new Network(containerRef.current, { nodes, edges }, GRAPH_OPTIONS)
    networkRef.current = network

    const handleResize = () => network.redraw()
    window.addEventListener('resize', handleResize)

    // Hierarchical layout positions nodes immediately — fit after first draw
    network.once('afterDrawing', () => {
      network.fit({
        animation: { duration: 500, easingFunction: 'easeInOutQuad' },
      })
    })

    // Paint name + designation below each node on every frame
    network.on('afterDrawing', (ctx) => {
      const nodeIds = nodes.getIds()
      for (const nodeId of nodeIds) {
        const pos = network.getPositions([nodeId])[nodeId]
        if (!pos) continue
        const nodeData = nodes.get(nodeId)
        if (!nodeData) continue

        const fullName = nodeData._fullName
        const desig = nodeData._desigLabel
        const nodeSize = nodeData.size ?? 30
        const opacity = nodeData.opacity ?? 1
        if (opacity < 0.2) continue   // skip dimmed nodes in focus mode

        const scale = network.getScale()
        if (scale < 0.3) continue     // skip text at very small scales

        const baseY = pos.y + nodeSize + 10

        ctx.save()
        ctx.globalAlpha = opacity
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        // Name line
        ctx.font = '500 11px Inter, system-ui, sans-serif'
        ctx.fillStyle = '#334155'
        ctx.fillText(fullName ?? '', pos.x, baseY)

        // Designation line
        if (desig) {
          ctx.font = '400 9px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#94A3B8'
          ctx.fillText(desig, pos.x, baseY + 14)
        }

        ctx.restore()
      }
    })

    network.on('click', (params) => {
      if (params.nodes.length === 0) return

      const nodeId = params.nodes[0]
      const nodeData = nodes.get(nodeId)
      if (!nodeData) return

      applyFocusMode(nodeId)

      const connectedEdges = rawEdgesRef.current.filter(
        // eslint-disable-next-line eqeqeq — IDs may be string or number
        (e) => e.from == nodeId || e.to == nodeId
      )
      setSelectedNode(nodeData._raw)
      setSelectedEdges(connectedEdges)
      setModalOpen(true)
    })

    return () => {
      network.off('click')
      network.off('afterDrawing')
      window.removeEventListener('resize', handleResize)
    }
  }, [visNodeItems, visEdgeItems, loading])

  // ── Destroy on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(flashTimerRef.current)
      networkRef.current?.destroy()
      networkRef.current = null
    }
  }, [])

  // ── Reset view ─────────────────────────────────────────────────────────
  function handleReset() {
    const nodesDS = nodesDataSetRef.current
    const edgesDS = edgesDataSetRef.current
    if (!nodesDS || !edgesDS) return

    nodesDS.update(visNodeItems.map((n) => ({
      id: n.id, color: n.color, opacity: 1, shadow: n.shadow,
      ...(n.shape ? { shape: n.shape, image: n.image, brokenImage: n.brokenImage } : {}),
    })))
    edgesDS.update(visEdgeItems.map((e) => ({ id: e.id, color: e.color, width: 1.5 })))

    setFocusedNodeId(null)
    networkRef.current?.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } })
  }

  // ── Search: focus + amber flash ────────────────────────────────────────
  function handleSearchSelect(item) {
    setSearchQuery(item._fullName)
    setSearchOpen(false)

    const network = networkRef.current
    const nodesDS = nodesDataSetRef.current
    if (!network || !nodesDS) return

    network.focus(item.id, {
      scale: 1.0,
      animation: { duration: 600, easingFunction: 'easeInOutQuad' },
    })

    clearTimeout(flashTimerRef.current)
    nodesDS.update([{ id: item.id, color: { background: '#F59E0B', border: '#D97706' } }])
    flashTimerRef.current = setTimeout(() => {
      if (nodesDataSetRef.current === nodesDS) {
        nodesDS.update([{ id: item.id, color: item.color }])
      }
    }, 1500)
  }

  // ── Toolbar handlers ───────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen()
    }
  }

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedNode(null)
    setSelectedEdges([])
  }, [])

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 360 }}>
        <LoadingSpinner message="Loading collaboration graph…" />
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (!graphData?.nodes?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-gray-400" style={{ minHeight: 360 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-40">
          <circle cx="12" cy="12" r="10" />
          <circle cx="7" cy="9" r="2" />
          <circle cx="17" cy="9" r="2" />
          <circle cx="12" cy="16" r="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="8" y1="11" x2="11" y2="15" />
          <line x1="16" y1="11" x2="13" y2="15" />
        </svg>
        <p className="text-sm font-medium text-gray-500">No connections to display yet</p>
        <p className="text-xs text-gray-400">Add connections to see your collaboration network here.</p>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="flex flex-col h-full w-full relative bg-white">

      {/* ── Row 1: Stats + Node search ── */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 bg-white flex-shrink-0">

        {/* Graph stats */}
        <div className="flex items-center gap-2.5 text-xs text-gray-400 flex-shrink-0">
          <span>
            <span className="font-semibold text-gray-600">{visNodeItems.length}</span>
            {' '}nodes
          </span>
          <span className="text-gray-200 select-none">·</span>
          <span>
            <span className="font-semibold text-gray-600">{visEdgeItems.length}</span>
            {' '}connections
          </span>
          {focusedNodeId != null && (
            <span className="flex items-center gap-1 text-brand-sidebar font-medium pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-sidebar animate-pulse" />
              Focus mode
            </span>
          )}
        </div>

        {/* Node search */}
        <div ref={searchRef} className="relative flex-1 max-w-xs ml-auto">
          <span className="absolute inset-y-0 left-2.5 flex items-center text-gray-400 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(e.target.value.length > 0) }}
            onFocus={() => { if (searchResults.length > 0) setSearchOpen(true) }}
            placeholder="Search nodes…"
            className="w-full pl-7 pr-7 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sidebar/30 focus:border-brand-sidebar transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false) }}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <IconXSmall />
            </button>
          )}

          {/* Dropdown — matching results */}
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
              {searchResults.map((item) => {
                const nodeColors = DESIGNATION_COLORS[item._raw?.designation] ?? { bg: '#64748B' }
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => handleSearchSelect(item)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                  >
                    <div
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: nodeColors.bg }}
                    >
                      {item.label}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item._fullName}</p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {item._raw?.designation?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Dropdown — no results */}
          {searchOpen && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5">
              <p className="text-xs text-gray-400">No nodes match "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Designation legend + Controls ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">

        {/* Designation node colors */}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(DESIGNATION_COLORS).map(([designation, colors]) => (
            <span key={designation} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.bg }} />
              {designation.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <ToolbarButton onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}><IconExpand /></ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-0.5 flex-shrink-0" />

          <ToolbarButton
            onClick={() => setShowRelLegend((v) => !v)}
            title={showRelLegend ? 'Hide relationship legend' : 'Show relationship legend'}
            active={showRelLegend}
          >
            <IconLegend />
          </ToolbarButton>

          <ToolbarButton
            onClick={handleReset}
            title="Reset view — restore all node and edge styles"
            active={focusedNodeId != null}
          >
            <IconReset />
          </ToolbarButton>
        </div>
      </div>

      {/* ── Row 3: Relationship legend (conditional) ── */}
      {showRelLegend && (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-4 py-2.5 border-b border-gray-100 bg-gray-50/40 flex-shrink-0">
          {Object.entries(RELATIONSHIP_EDGE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-2 text-[11px] text-gray-600">
              <svg width="18" height="6" viewBox="0 0 18 6" className="flex-shrink-0">
                <line x1="0" y1="3" x2="18" y2="3" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              {RELATIONSHIP_TYPE_DISPLAY[type] ?? type.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* ── Canvas ── */}
      <div ref={containerRef} className="flex-1 w-full relative min-h-0 overflow-hidden" />

      {/* ── Node detail modal ── */}
      <NodeDetailModal
        isOpen={modalOpen}
        node={selectedNode}
        edges={selectedEdges}
        currentUserId={currentUserId}
        onClose={closeModal}
      />
    </div>
  )
}

// ── ToolbarButton ─────────────────────────────────────────────────────────────

function ToolbarButton({ onClick, title, active = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
        active
          ? 'bg-brand-sidebar text-white'
          : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function IconLegend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <line x1="3" y1="6" x2="9" y2="6" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="3" y1="18" x2="9" y2="18" />
      <line x1="13" y1="6" x2="21" y2="6" />
      <line x1="13" y1="12" x2="21" y2="12" />
      <line x1="13" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconXSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3 h-3">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
