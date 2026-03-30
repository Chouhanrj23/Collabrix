import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/formatters'
import { isManagerOrAbove } from '../../utils/designationUtils'

// ── Nav item definitions ─────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/dashboard',      label: 'Dashboard',      icon: IconDashboard,    end: true },
  { to: '/connections',    label: 'My Connections',  icon: IconConnections         },
  { to: '/add-connection', label: 'Add Connection',  icon: IconAddConnection       },
  { to: '/employees',      label: 'Employees',       icon: IconEmployees           },
  { to: '/feedback',       label: 'Feedback',        icon: IconFeedback            },
  { to: '/projects',       label: 'Projects',        icon: IconProjects, managerOnly: true },
]

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Sidebar
 * @param {boolean} open     - true = expanded on desktop, visible on mobile
 * @param {function} onToggle - toggles open state
 */
export default function Sidebar({ open, onToggle }) {
  const { user, logout } = useAuth()

  // Filter items: managerOnly items are hidden for non-managers
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.managerOnly || isManagerOrAbove(user?.designation)
  )

  return (
    <aside
      className={[
        // Layout
        'fixed md:relative inset-y-0 left-0 z-50 h-screen',
        'flex flex-col flex-shrink-0',
        // Brand color
        'bg-brand-sidebar',
        // Width transition
        'transition-all duration-300 ease-in-out',
        // Mobile: slide in/out; Desktop: always visible
        open
          ? 'w-64 translate-x-0'
          : 'w-16 -translate-x-full md:translate-x-0',
      ].join(' ')}
    >
      {/* ── Brand ── */}
      <div className="flex items-center h-16 px-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 font-bold text-white text-lg flex-shrink-0 shadow-sm">
          C
        </div>
        {open && (
          <span className="ml-3 text-white font-semibold tracking-widest text-sm uppercase whitespace-nowrap overflow-hidden">
            Collabrix
          </span>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150 hidden md:flex"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <IconChevronLeft /> : <IconChevronRight />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2" aria-label="Main navigation">
        <div className="space-y-0.5">
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!open ? label : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center px-3 py-2.5 rounded-xl',
                  'text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/10 hover:text-white',
                ].join(' ')
              }
            >
              <span className="flex-shrink-0 w-5 h-5">
                <Icon />
              </span>
              {open && (
                <span className="ml-3 truncate">{label}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── User footer ── */}
      {user && (
        <div className="flex-shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 text-white text-sm font-semibold shadow-sm">
              {getInitials(user.name)}
            </div>

            {open && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-white/50 text-xs truncate">
                  {user.designation?.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {open && (
              <button
                onClick={logout}
                title="Logout"
                className="flex-shrink-0 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150"
                aria-label="Logout"
              >
                <IconLogout />
              </button>
            )}
          </div>

          {/* Logout when collapsed: standalone button centered */}
          {!open && (
            <button
              onClick={logout}
              title="Logout"
              className="flex items-center justify-center w-full mt-2 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150"
              aria-label="Logout"
            >
              <IconLogout />
            </button>
          )}
        </div>
      )}
    </aside>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconConnections() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <circle cx="19" cy="7" r="2" />
      <path d="M23 21v-2a2 2 0 00-2-2h-1" />
    </svg>
  )
}

function IconAddConnection() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  )
}

function IconEmployees() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function IconFeedback() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

function IconProjects() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
