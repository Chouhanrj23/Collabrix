import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES = {
  '/dashboard':      'Collaboration Graph',
  '/connections':    'My Connections',
  '/add-connection': 'Add Connection',
  '/employees':      'Employees',
  '/feedback':       'Feedback',
}

export default function AppLayout() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Collabrix'

  // Shared sidebar open state: on desktop = wide/narrow, on mobile = visible/hidden
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const toggle = () => setSidebarOpen((v) => !v)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile backdrop — closes sidebar when clicking outside */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={toggle}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onToggle={toggle} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={toggle} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
