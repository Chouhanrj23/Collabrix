import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'
import { DESIGNATION_COLORS, RELATIONSHIP_TYPE_DISPLAY } from '../../utils/designationUtils'
import LoadingSpinner from '../common/LoadingSpinner'
import NodeDetailModal from './NodeDetailModal'
import EdgeDetailModal from './EdgeDetailModal.jsx'

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

// ── HTML escape helper (prevents XSS in vis-network tooltips) ────────────────
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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

// ── Role hierarchy levels (lower number = more senior) ───────────────────────
const HIERARCHY = {
  PARTNER: 1, DIRECTOR: 2, MANAGER: 3,
  SENIOR_CONSULTANT: 4, CONSULTANT: 5,
  ASSOCIATE: 6, ASSOCIATE_CONSULTANT: 6,
}

// ── Radial (circular) layout: center → direct ring → indirect ring ────────────
//
// vis-network canvas uses (0,0) as its logical origin; network.fit() then
// pans/zooms so every node is visible regardless of the pixel size.
//
function computeRadialPositions(filteredGraphData, currentUserId) {
  const RADIUS_DIRECT   = 150   // px from center to direct-connection ring
  const RADIUS_INDIRECT = 300   // px from center to indirect-connection ring

  const selfId = String(currentUserId)
  const { directIds, indirectIds } = filteredGraphData
  const pos = {}

  // Random rotation so the layout looks different on every render / refresh
  const rotationOffset = Math.random() * 2 * Math.PI

  // Center node
  pos[selfId] = { x: 0, y: 0 }

  // ── Direct ring — evenly spaced with a random starting angle ─────────────
  const directList = [...directIds]
  directList.forEach((id, i) => {
    const baseAngle = (2 * Math.PI * i) / directList.length + rotationOffset
    const jitter = (Math.random() - 0.5) * 0.4   // ±~11° angular jitter
    const radiusJitter = 1 + (Math.random() - 0.5) * 0.15  // ±7.5% radius jitter
    const angle = baseAngle + jitter
    pos[id] = {
      x: RADIUS_DIRECT * radiusJitter * Math.cos(angle),
      y: RADIUS_DIRECT * radiusJitter * Math.sin(angle),
    }
  })

  if (indirectIds.size === 0) return pos

  // ── Map each indirect node → its parent direct node ───────────────────────
  const parentOf = {}
  filteredGraphData.edges.forEach(edge => {
    const from = String(edge.from)
    const to   = String(edge.to)
    if (directIds.has(from) && indirectIds.has(to))   parentOf[to]   = from
    if (directIds.has(to)   && indirectIds.has(from)) parentOf[from] = to
  })

  // ── Group indirect nodes by their parent ──────────────────────────────────
  const groups = {}   // parentId → [childId, ...]
  indirectIds.forEach(id => {
    const parent = parentOf[id] ?? '__orphan__'
    if (!groups[parent]) groups[parent] = []
    groups[parent].push(id)
  })

  // Angular budget per parent sector (75 % of the sector to avoid overlap)
  const sectorAngle = directList.length > 0
    ? (2 * Math.PI) / directList.length * 0.75
    : Math.PI / 2

  Object.entries(groups).forEach(([parentId, children]) => {
    const parentPos = pos[parentId]
    const baseAngle = parentPos ? Math.atan2(parentPos.y, parentPos.x) : 0
    const spread    = children.length > 1
      ? Math.min(sectorAngle, (children.length - 1) * 0.35)
      : 0

    children.forEach((id, i) => {
      const offset = children.length > 1
        ? -spread / 2 + i * (spread / (children.length - 1))
        : 0
      const jitter = (Math.random() - 0.5) * 0.3
      const radiusJitter = 1 + (Math.random() - 0.5) * 0.18
      const angle = baseAngle + offset + jitter
      pos[id] = {
        x: RADIUS_INDIRECT * radiusJitter * Math.cos(angle),
        y: RADIUS_INDIRECT * radiusJitter * Math.sin(angle),
      }
    })
  })

  return pos
}

// ── vis-network configuration — radial layout, physics off ───────────────────
const GRAPH_OPTIONS = {
  autoResize: true,
  height: '100%',
  width: '100%',
  layout: {
    improvedLayout: false,   // pre-computed positions supplied; no auto-layout
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
    smooth: { enabled: true, type: 'dynamic' },
    chosen: {
      edge: (values) => {
        values.width = 3
        values.color = '#2563EB'
      },
    },
    hoverWidth: 0.5,
  },
  physics: {
    enabled: false,  // positions are pre-computed via computeRadialPositions
  },
  interaction: {
    hover: true,
    tooltipDelay: 200,
    zoomView: true,
    zoomSpeed: 0.8,
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
export default function CollaborationGraph({ graphData, loading, currentUserId, currentUserDesignation, isDirectOnly = false }) {
  // ── DOM / network refs ───────────────────────────────────────────────────
  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const networkRef = useRef(null)
  const rawEdgesRef = useRef([])
  const nodesDataSetRef = useRef(null)
  const edgesDataSetRef = useRef(null)
  const flashTimerRef = useRef(null)
  const searchRef = useRef(null)

  // ── Node modal state ───────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdges, setSelectedEdges] = useState([])
  const [modalOpen, setModalOpen] = useState(false)

  // ── Edge modal state ──────────────────────────────────────────────────
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [edgeModalOpen, setEdgeModalOpen] = useState(false)

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

  // ── Layout randomization key — increment to force a new random layout ──
  const [layoutKey, setLayoutKey] = useState(0)

  // ── Filter state ───────────────────────────────────────────────────────
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    relationshipTypes: new Set(),
    departments: new Set(),
    accounts: new Set(),
    projects: new Set(),
  })

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

  // ── Visibility filter — BFS-based hierarchy expansion ────────────────────
  const filteredGraphData = useMemo(() => {
    if (!graphData?.nodes || !graphData?.edges || currentUserId == null) {
      return { nodes: [], edges: [], directIds: new Set(), indirectIds: new Set(), nodeMap: {} }
    }

    const nodeMap = {}
    graphData.nodes.forEach(n => { nodeMap[n.id] = n })

    const selfId = String(currentUserId)
    const currentLevel = HIERARCHY[currentUserDesignation] ?? 99

    // 1. Identify direct connections (always visible — no hierarchy filter on direct)
    const directIds = new Set()
    graphData.edges.forEach((e) => {
      if (e.from == null || e.to == null) return
      const from = String(e.from)
      const to = String(e.to)
      if (from === selfId) directIds.add(to)
      if (to === selfId) directIds.add(from)
    })

    // 2. isDirectOnly mode: self + direct connections only
    if (isDirectOnly) {
      const visibleIds = new Set([selfId, ...directIds])
      return {
        nodes: graphData.nodes.filter(n => visibleIds.has(String(n.id))),
        edges: graphData.edges.filter(e =>
          String(e.from) === selfId || String(e.to) === selfId
        ),
        directIds,
        indirectIds: new Set(),
        nodeMap,
      }
    }

    // 3. BFS — seed queue with junior/equal directs only; senior directs are visible but not expanded.
    //    Each hop after that adds a neighbor only when nodeLevel >= currentLevel,
    //    which prevents any upward (more-senior) indirect traversal.
    const allowedIds = new Set([selfId, ...directIds])
    const seniorDirectIds = new Set()
    const visited = new Set([selfId, ...directIds])
    const queue = []

    directIds.forEach(id => {
      const node = nodeMap[id]
      const nodeLevel = HIERARCHY[node?.designation] ?? 99
      if (nodeLevel >= currentLevel) {
        queue.push(id)        // junior/equal — expand further
      } else {
        seniorDirectIds.add(id) // senior — visible as node, connections hidden
      }
    })

    while (queue.length > 0) {
      const nodeId = queue.shift()

      graphData.edges.forEach((e) => {
        if (e.from == null || e.to == null) return
        const from = String(e.from)
        const to = String(e.to)
        const neighbor = from === nodeId ? to : (to === nodeId ? from : null)
        if (!neighbor || visited.has(neighbor)) return

        visited.add(neighbor)
        const node = nodeMap[neighbor]
        if (!node) return

        const nodeLevel = HIERARCHY[node.designation] ?? 99
        if (nodeLevel >= currentLevel) {
          allowedIds.add(neighbor)
          queue.push(neighbor)
        }
      })
    }

    // 4. Filter edges — both endpoints must be in allowed set,
    //    and senior direct connections' edges are hidden (except the direct edge to self)
    const filteredEdges = graphData.edges.filter(e => {
      const from = String(e.from), to = String(e.to)
      if (!allowedIds.has(from) || !allowedIds.has(to)) return false
      if (seniorDirectIds.has(from) && to !== selfId) return false
      if (seniorDirectIds.has(to) && from !== selfId) return false
      return true
    })

    // 5. Second-layer designation guard — drop any non-direct edge whose
    //    source node (edge.from) is more senior than the current user.
    //    Direct edges (one endpoint is self) are always preserved.
    const finalEdges = filteredEdges.filter(e => {
      const from = String(e.from), to = String(e.to)
      if (from === selfId || to === selfId) return true
      const sourceLevel = HIERARCHY[nodeMap[e.from]?.designation] ?? 99
      return sourceLevel >= currentLevel
    })

    // 6. Separate indirect IDs for visual styling (dimmed nodes)
    const indirectIds = new Set()
    allowedIds.forEach(id => {
      if (id !== selfId && !directIds.has(id)) indirectIds.add(id)
    })

    return {
      nodes: graphData.nodes.filter(n => allowedIds.has(String(n.id))),
      edges: finalEdges,
      directIds,
      indirectIds,
      nodeMap,
    }

  }, [graphData, currentUserId, currentUserDesignation, isDirectOnly])

  // ── Available filter options (derived from hierarchy-filtered data) ────
  const availableOptions = useMemo(() => {
    const relTypes = new Set()
    const departments = new Set()
    const accounts = new Set()
    const projects = new Set()
    filteredGraphData.edges.forEach(e => {
      if (e.relationshipType) relTypes.add(e.relationshipType)
      if (e.account) accounts.add(e.account)
      if (e.project) {
        e.project.split(',').map(p => p.trim()).filter(Boolean).forEach(p => projects.add(p))
      }
    })
    filteredGraphData.nodes.forEach(n => {
      if (n.department) departments.add(n.department)
    })
    return {
      relTypes: [...relTypes].sort(),
      departments: [...departments].sort(),
      accounts: [...accounts].sort(),
      projects: [...projects].sort(),
    }
  }, [filteredGraphData])

  // ── Apply active filters on top of hierarchy-filtered data ────────────
  const filterAppliedGraphData = useMemo(() => {
    const hasRelFilter  = activeFilters.relationshipTypes.size > 0
    const hasDeptFilter = activeFilters.departments.size > 0
    const hasAccFilter  = activeFilters.accounts.size > 0
    const hasProjFilter = activeFilters.projects.size > 0
    if (!hasRelFilter && !hasDeptFilter && !hasAccFilter && !hasProjFilter) return filteredGraphData

    const selfId = String(currentUserId)

    let edges = filteredGraphData.edges

    if (hasRelFilter) {
      edges = edges.filter(e => activeFilters.relationshipTypes.has(e.relationshipType))
    }
    if (hasAccFilter) {
      edges = edges.filter(e => e.account && activeFilters.accounts.has(e.account))
    }
    if (hasProjFilter) {
      edges = edges.filter(e => {
        if (!e.project) return false
        return [...activeFilters.projects].some(p => e.project.includes(p))
      })
    }

    // Nodes visible after edge filtering
    const visibleNodeIds = new Set([selfId])
    edges.forEach(e => {
      visibleNodeIds.add(String(e.from))
      visibleNodeIds.add(String(e.to))
    })

    let nodes = filteredGraphData.nodes.filter(n => {
      if (String(n.id) === selfId) return true
      if (!visibleNodeIds.has(String(n.id))) return false
      if (hasDeptFilter) return activeFilters.departments.has(n.department)
      return true
    })

    // Re-filter edges if department removed some nodes
    if (hasDeptFilter) {
      const nodeIdSet = new Set(nodes.map(n => String(n.id)))
      edges = edges.filter(e => nodeIdSet.has(String(e.from)) && nodeIdSet.has(String(e.to)))
    }

    // Rebuild directIds / indirectIds
    const directIds = new Set()
    edges.forEach(e => {
      if (String(e.from) === selfId) directIds.add(String(e.to))
      if (String(e.to) === selfId) directIds.add(String(e.from))
    })
    const indirectIds = new Set()
    nodes.forEach(n => {
      const id = String(n.id)
      if (id !== selfId && !directIds.has(id)) indirectIds.add(id)
    })

    return { nodes, edges, directIds, indirectIds, nodeMap: filteredGraphData.nodeMap }
  }, [filteredGraphData, activeFilters, currentUserId])

  // ── Helpers for toggling individual filter values ─────────────────────
  function toggleFilter(category, value) {
    setActiveFilters(prev => {
      const next = new Set(prev[category])
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return { ...prev, [category]: next }
    })
  }

  function clearAllFilters() {
    setActiveFilters({ relationshipTypes: new Set(), departments: new Set(), accounts: new Set(), projects: new Set() })
  }

  const activeFilterCount =
    activeFilters.relationshipTypes.size +
    activeFilters.departments.size +
    activeFilters.accounts.size +
    activeFilters.projects.size

  // ── Memoized node transformations (with hierarchy level) ───────────────
  const visNodeItems = useMemo(() => {
    if (!filterAppliedGraphData.nodes.length) return []
    return filterAppliedGraphData.nodes.map((n) => {
      const colors = DESIGNATION_COLORS[n.designation] ?? { bg: '#64748B', border: '#475569' }
      const isCenter = String(n.id) === String(currentUserId)
      const isDirect = filterAppliedGraphData.directIds.has(String(n.id))
      const isIndirect = filterAppliedGraphData.indirectIds.has(String(n.id))
      const hasImage = !!n.profileImageUrl

      const fullName = n.label ?? n.name
      const initials = getNodeInitials(fullName)

      const desigLabel = designationLabel(n.designation)

      // Indirect connections get slight transparency for visual hierarchy
      const bgHex = colors.bg
      const borderHex = colors.border
      const opacitySuffix = isIndirect ? 'B3' : '' // ~70% opacity for indirect

      const bgColor = isIndirect ? bgHex + opacitySuffix : bgHex
      const borderColor = isCenter ? '#FFFFFF' : (isIndirect ? borderHex + opacitySuffix : borderHex)

      const nodeBase = {
        id: n.id,
        label: initials,
        shape: isCenter ? 'star' : 'circle',
        title: `<div style="font:13px Inter,sans-serif;padding:6px 10px;line-height:1.5;max-width:220px">
                  <strong>${escapeHtml(fullName)}${isCenter ? ' (You)' : ''}</strong><br/>
                  <span style="color:#64748B">${escapeHtml(n.designation?.replace(/_/g, ' ') ?? '')}</span>
                  ${n.department ? `<br/><span style="color:#94A3B8;font-size:11px">${escapeHtml(n.department)}</span>` : ''}
                  ${isIndirect ? `<br/><span style="color:#F59E0B;font-size:11px;font-weight:600;margin-top:4px;display:block">Indirect Connection</span>` : ''}
                </div>`,
        color: {
          background: bgColor,
          border: borderColor,
          highlight: { background: bgHex, border: '#FFFFFF' },
          hover: { background: bgHex, border: '#E2E8F0' },
        },
        size: isCenter ? 35 : (isDirect ? 28 : 24),
        borderWidth: isCenter ? 3 : 2,
        borderWidthSelected: 4,
        shadow: isCenter
          ? { enabled: true, color: 'rgba(37,99,235,0.35)', size: 22, x: 0, y: 0 }
          : { enabled: true, color: 'rgba(0,0,0,0.08)', size: 10, x: 0, y: 4 },
        font: {
          color: '#FFFFFF',
          size: isCenter ? 13 : (isDirect ? 15 : 12),
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

      if (!isCenter && hasImage) {
        nodeBase.shape = 'circularImage'
        nodeBase.image = n.profileImageUrl
        nodeBase.brokenImage = generateAvatarDataUrl(n.label ?? n.name, bgHex)
      }

      return nodeBase
    })
  }, [filterAppliedGraphData, currentUserId])

  // ── Memoized edge transformations (labels hidden, hover shows tooltip) ─
  const visEdgeItems = useMemo(() => {
    if (!filterAppliedGraphData.edges.length) return []

    const hierarchy = {
      PARTNER: 1,
      DIRECTOR: 2,
      MANAGER: 3,
      SENIOR_CONSULTANT: 4,
      CONSULTANT: 5,
      ASSOCIATE: 6,
      ASSOCIATE_CONSULTANT: 6
    }

    return filterAppliedGraphData.edges.map((edge, i) => {
      const edgeColor = RELATIONSHIP_EDGE_COLORS[edge.relationshipType] ?? '#CBD5E1'

      const isDirectEdge = edge.from === currentUserId || edge.to === currentUserId
      const opacity = isDirectEdge ? 'C0' : '60' // 75% for direct, 38% for indirect

      const sourceNode = filterAppliedGraphData.nodeMap[edge.from]
      const targetNode = filterAppliedGraphData.nodeMap[edge.to]

      let from = edge.from
      let to = edge.to

      // Apply ONLY for reporting relationships
      if (sourceNode && targetNode && edge.relationshipType.includes('REPORTING')) {
        const sourceLevel = hierarchy[sourceNode.designation] || 99
        const targetLevel = hierarchy[targetNode.designation] || 99

        if (sourceLevel > targetLevel) {
          // source is junior → correct
          from = edge.from
          to = edge.to
        } else {
          // reverse
          from = edge.to
          to = edge.from
        }

      }

      let edgeArrows = undefined
      if (sourceNode && targetNode) {
        const sourceLvl = hierarchy[sourceNode.designation] || 99
        const targetLvl = hierarchy[targetNode.designation] || 99
        
        // If peers, no arrows. Else if reporting, show arrow.
        if (sourceLvl === targetLvl) {
          edgeArrows = { to: { enabled: false } }
        } else if (edge.relationshipType.includes('REPORTING')) {
          edgeArrows = { to: { enabled: true } }
        }
      } else if (edge.relationshipType.includes('REPORTING')) {
        edgeArrows = { to: { enabled: true } }
      }

      const curveTypes = ['curvedCW', 'curvedCCW', 'continuous', 'curvedCW', 'curvedCCW']
      const smoothType = curveTypes[Math.floor(Math.random() * curveTypes.length)]
      const roundness  = 0.2 + Math.random() * 0.5   // 0.2 – 0.7

      return {
        id: edge.id ?? i,
        from,
        to,
        label: formatRelationship(edge.relationshipType),
        title: RELATIONSHIP_TYPE_DISPLAY[edge.relationshipType] ?? edge.label ?? '',
        color: {
          color: edgeColor + opacity,
          highlight: '#2563EB',
          hover: edgeColor,
        },
        width: isDirectEdge ? 2 : 1,
        arrows: edgeArrows,
        dashes: edge.relationshipType === 'PEER',
        smooth: { enabled: true, type: smoothType, roundness },
        relationshipType: edge.relationshipType,
        department: edge.department,
        account: edge.account,
        project: edge.project,
        startDate: edge.startDate,
        endDate: edge.endDate,
        _raw: edge,
      }
    })
  }, [filterAppliedGraphData, currentUserId, layoutKey])

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

    // Assign radial positions: center node → direct ring → indirect ring
    const posMap = currentUserId != null
      ? computeRadialPositions(filterAppliedGraphData, currentUserId)
      : {}

    const positionedNodes = visNodeItems.map(n => {
      const p = posMap[String(n.id)]
      return p ? { ...n, x: p.x, y: p.y } : n
    })

    const nodes = new DataSet(positionedNodes)
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

    // Fit once after the first draw — physics is off so there is no stabilization event
    network.once('afterDrawing', () => {
      network.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } })
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
      // ── Node click ──
      if (params.nodes.length > 0) {
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
        return
      }

      // ── Edge click ──
      if (params.edges.length > 0 && params.nodes.length === 0) {
        const edgeId = params.edges[0]
        const edge = rawEdgesRef.current.find((e) => String(e.id) === String(edgeId)) || edges.get(edgeId)

        if (!edge) return

        const fromNode = nodes.get(edge.from)
        const toNode = nodes.get(edge.to)

        setSelectedEdge({
          ...edge,
          relationshipType: edge.relationshipType || null,
          department: edge.department || null,
          account: edge.account || null,
          project: edge.project || null,
          startDate: edge.startDate || null,
          endDate: edge.endDate || null,
          fromName: fromNode?._fullName ?? 'Unknown',
          fromDesignation: fromNode?._raw?.designation,
          toName: toNode?._fullName ?? 'Unknown',
          toDesignation: toNode?._raw?.designation,
        })
        setEdgeModalOpen(true)
      }
    })

    return () => {
      network.off('click')
      network.off('afterDrawing')
      window.removeEventListener('resize', handleResize)
    }
  }, [visNodeItems, visEdgeItems, filterAppliedGraphData, currentUserId, loading, layoutKey])

  // ── Destroy on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(flashTimerRef.current)
      networkRef.current?.destroy()
      networkRef.current = null
    }
  }, [])

  // ── Zoom controls ──────────────────────────────────────────────────────
  function handleZoomIn() {
    const network = networkRef.current
    if (!network) return
    const scale = network.getScale()
    network.moveTo({ scale: scale * 1.3, animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
  }

  function handleZoomOut() {
    const network = networkRef.current
    if (!network) return
    const scale = network.getScale()
    network.moveTo({ scale: scale * 0.75, animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
  }

  function handleFitView() {
    networkRef.current?.fit({ animation: { duration: 300, easingFunction: 'easeInOutQuad' } })
  }

  // ── Reset view + randomize layout ─────────────────────────────────────
  function handleReset() {
    setFocusedNodeId(null)
    setLayoutKey((k) => k + 1)
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

  const closeEdgeModal = useCallback(() => {
    setEdgeModalOpen(false)
    setSelectedEdge(null)
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
          <ToolbarButton onClick={handleZoomIn} title="Zoom in"><IconZoomIn /></ToolbarButton>
          <ToolbarButton onClick={handleZoomOut} title="Zoom out"><IconZoomOut /></ToolbarButton>
          <ToolbarButton onClick={handleFitView} title="Fit all nodes in view"><IconFitView /></ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-0.5 flex-shrink-0" />

          <ToolbarButton onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}><IconExpand /></ToolbarButton>

          <div className="w-px h-4 bg-gray-200 mx-0.5 flex-shrink-0" />

          <ToolbarButton
            onClick={() => setShowRelLegend((v) => !v)}
            title={showRelLegend ? 'Hide relationship legend' : 'Show relationship legend'}
            active={showRelLegend}
          >
            <IconLegend />
          </ToolbarButton>

          {/* Filter button with active-count badge */}
          <div className="relative">
            <ToolbarButton
              onClick={() => setShowFilterPanel((v) => !v)}
              title="Filter graph"
              active={showFilterPanel || activeFilterCount > 0}
            >
              <IconFilter />
            </ToolbarButton>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>

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

      {/* ── Filter panel ── */}
      {showFilterPanel && (
        <div className="border-b border-gray-100 bg-white flex-shrink-0 shadow-sm">
          <div className="px-4 py-3 flex items-start gap-6 flex-wrap">

            {/* Relationship Type */}
            {availableOptions.relTypes.length > 0 && (
              <div className="min-w-[160px]">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Relationship Type</p>
                <div className="flex flex-col gap-1.5">
                  {availableOptions.relTypes.map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activeFilters.relationshipTypes.has(type)}
                        onChange={() => toggleFilter('relationshipTypes', type)}
                      />
                      <span className={[
                        'w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors flex-shrink-0',
                        activeFilters.relationshipTypes.has(type)
                          ? 'border-transparent'
                          : 'border-gray-300 bg-white group-hover:border-gray-400',
                      ].join(' ')}
                        style={activeFilters.relationshipTypes.has(type)
                          ? { backgroundColor: RELATIONSHIP_EDGE_COLORS[type] ?? '#94A3B8' }
                          : {}}
                      >
                        {activeFilters.relationshipTypes.has(type) && (
                          <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" />
                          </svg>
                        )}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RELATIONSHIP_EDGE_COLORS[type] ?? '#94A3B8' }} />
                        {formatRelationship(type)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {availableOptions.relTypes.length > 0 && availableOptions.departments.length > 0 && (
              <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
            )}

            {/* Department */}
            {availableOptions.departments.length > 0 && (
              <div className="min-w-[120px]">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Department</p>
                <div className="flex flex-col gap-1.5">
                  {availableOptions.departments.map(dept => (
                    <label key={dept} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activeFilters.departments.has(dept)}
                        onChange={() => toggleFilter('departments', dept)}
                      />
                      <span className={[
                        'w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors flex-shrink-0',
                        activeFilters.departments.has(dept)
                          ? 'bg-brand-sidebar border-brand-sidebar'
                          : 'border-gray-300 bg-white group-hover:border-gray-400',
                      ].join(' ')}>
                        {activeFilters.departments.has(dept) && (
                          <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-600">{dept}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {availableOptions.departments.length > 0 && availableOptions.accounts.length > 0 && (
              <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
            )}

            {/* Account */}
            {availableOptions.accounts.length > 0 && (
              <div className="min-w-[120px]">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                <div className="flex flex-col gap-1.5">
                  {availableOptions.accounts.map(acc => (
                    <label key={acc} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activeFilters.accounts.has(acc)}
                        onChange={() => toggleFilter('accounts', acc)}
                      />
                      <span className={[
                        'w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors flex-shrink-0',
                        activeFilters.accounts.has(acc)
                          ? 'bg-cyan-500 border-cyan-500'
                          : 'border-gray-300 bg-white group-hover:border-gray-400',
                      ].join(' ')}>
                        {activeFilters.accounts.has(acc) && (
                          <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-600">{acc}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            {availableOptions.accounts.length > 0 && availableOptions.projects.length > 0 && (
              <div className="w-px self-stretch bg-gray-100 flex-shrink-0" />
            )}

            {/* Project */}
            {availableOptions.projects.length > 0 && (
              <div className="min-w-[140px]">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Project</p>
                <div className="flex flex-col gap-1.5">
                  {availableOptions.projects.map(proj => (
                    <label key={proj} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={activeFilters.projects.has(proj)}
                        onChange={() => toggleFilter('projects', proj)}
                      />
                      <span className={[
                        'w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors flex-shrink-0',
                        activeFilters.projects.has(proj)
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 bg-white group-hover:border-gray-400',
                      ].join(' ')}>
                        {activeFilters.projects.has(proj) && (
                          <svg viewBox="0 0 10 10" className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" />
                          </svg>
                        )}
                      </span>
                      <span className="text-[11px] text-gray-600">{proj}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Clear all — only shown when something is active */}
            {activeFilterCount > 0 && (
              <div className="ml-auto self-start flex-shrink-0">
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pb-2.5">
              {[...activeFilters.relationshipTypes].map(type => (
                <FilterChip
                  key={`rel-${type}`}
                  label={formatRelationship(type)}
                  color={RELATIONSHIP_EDGE_COLORS[type]}
                  onRemove={() => toggleFilter('relationshipTypes', type)}
                />
              ))}
              {[...activeFilters.departments].map(dept => (
                <FilterChip key={`dept-${dept}`} label={dept} onRemove={() => toggleFilter('departments', dept)} />
              ))}
              {[...activeFilters.accounts].map(acc => (
                <FilterChip key={`acc-${acc}`} label={acc} color="#06B6D4" onRemove={() => toggleFilter('accounts', acc)} />
              ))}
              {[...activeFilters.projects].map(proj => (
                <FilterChip key={`proj-${proj}`} label={proj} color="#10B981" onRemove={() => toggleFilter('projects', proj)} />
              ))}
            </div>
          )}
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
        currentUserDesignation={currentUserDesignation}
        onClose={closeModal}
      />

      {/* ── Edge detail modal ── */}
      <EdgeDetailModal
        isOpen={edgeModalOpen}
        edge={selectedEdge}
        onClose={closeEdgeModal}
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

function IconZoomIn() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function IconZoomOut() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

function FilterChip({ label, color, onRemove }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
      style={{ backgroundColor: color ?? '#6366F1' }}
    >
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:opacity-70 transition-opacity" aria-label={`Remove ${label} filter`}>
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-2 h-2">
          <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </span>
  )
}

function IconFitView() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}
