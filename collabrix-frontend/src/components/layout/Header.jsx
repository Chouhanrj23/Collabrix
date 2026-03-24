import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { connectionService } from '../../api/connectionService'
import { DesignationBadge } from '../common/Badge'
import { getInitials } from '../../utils/formatters'

/**
 * Header
 * @param {string}   title       - Current page title (from AppLayout)
 * @param {function} onMenuClick - Toggles sidebar open state
 */
export default function Header({ title, onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [pendingList, setPendingList] = useState([])
  const [notifOpen,   setNotifOpen]   = useState(false)
  const notifRef = useRef(null)

  // Load pending connection requests once on mount
  useEffect(() => {
    connectionService.getPending().then(setPendingList).catch(() => {})
  }, [])

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return
    function handleOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [notifOpen])

  function goToConnections() {
    setNotifOpen(false)
    navigate('/connections')
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-200/80 flex-shrink-0">

      {/* ── Left: hamburger + page title ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
          aria-label="Toggle navigation"
        >
          <IconMenu />
        </button>
        <h1 className="text-[15px] font-semibold text-gray-800 truncate tracking-tight">{title}</h1>
      </div>

      {/* ── Right: notifications + user ── */}
      <div className="flex items-center gap-1.5">

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150"
            aria-label={`Notifications${pendingList.length > 0 ? ` (${pendingList.length} pending)` : ''}`}
          >
            <IconBell />
            {pendingList.length > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
                {pendingList.length > 9 ? '9+' : pendingList.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Pending Requests</span>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-150"
                  aria-label="Close"
                >
                  <IconX />
                </button>
              </div>

              {pendingList.length === 0 ? (
                <p className="px-4 py-8 text-sm text-gray-400 text-center">
                  No pending requests
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {pendingList.slice(0, 5).map((req) => (
                      <li
                        key={req.id}
                        className="px-4 py-3 hover:bg-gray-50/80 cursor-pointer transition-colors duration-150"
                        onClick={goToConnections}
                      >
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-800">{req.fromEmployee?.name}</span>
                          {' wants to connect as '}
                          <span className="text-brand-light font-medium">
                            {req.relationshipType?.replace(/_/g, ' ')}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                  {pendingList.length > 5 && (
                    <button
                      onClick={goToConnections}
                      className="w-full px-4 py-2.5 text-sm text-brand-light font-medium hover:bg-gray-50 transition-colors duration-150 text-center border-t border-gray-100"
                    >
                      See all {pendingList.length} requests
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200/80 mx-2" />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-sidebar text-white text-sm font-semibold flex-shrink-0 shadow-sm">
              {getInitials(user.name)}
            </div>

            {/* Name + designation badge — hidden on small screens */}
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                {user.name}
              </span>
              <DesignationBadge designation={user.designation} />
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 ml-1 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
              aria-label="Logout"
            >
              <IconLogout />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────────

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
