import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
