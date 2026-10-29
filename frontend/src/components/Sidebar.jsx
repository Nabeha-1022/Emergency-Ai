import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Mic, History, BarChart3, BookOpen,
  Settings, LogOut, Siren, Shield
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/live-call', icon: Mic, label: 'Live Call' },
  { path: '/call-history', icon: History, label: 'Call History' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/protocols', icon: BookOpen, label: 'Protocols' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { operator, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 min-h-screen bg-emergency-navy border-r border-emergency-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-emergency-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emergency-red/20 border border-emergency-red/40 flex items-center justify-center glow-red">
            <Siren className="w-5 h-5 text-emergency-red" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">EmergencyAI</h1>
            <p className="text-xs text-gray-500">Decision Support</p>
          </div>
        </div>
      </div>

      {/* Operator info */}
      <div className="p-4 border-b border-emergency-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emergency-blue/20 border border-emergency-blue/40 flex items-center justify-center">
            <Shield className="w-4 h-4 text-emergency-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{operator?.name || 'Operator'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="live-dot w-1.5 h-1.5" />
              <span className="text-xs text-green-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-emergency-border">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
