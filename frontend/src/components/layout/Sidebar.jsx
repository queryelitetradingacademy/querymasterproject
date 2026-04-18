import { NavLink, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard', always: true },
  { to: '/queries', icon: '👥', label: 'Queries', segment: 'queries' },
  { to: '/tasks', icon: '✓', label: 'Tasks', segment: 'tasks' },
  { to: '/finance', icon: '₹', label: 'Finance & ITR', segment: 'finance' },
  { to: '/admin', icon: '⚙', label: 'Admin Panel', adminOnly: true },
]

export default function Sidebar({ onClose }) {
  const { can, isAdmin } = useAuthStore()

  const visible = navItems.filter(item => {
    if (item.always) return true
    if (item.adminOnly) return isAdmin()
    if (item.segment) return can(item.segment, 'view')
    return true
  })

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-slate-700/50 w-[260px]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">Q</div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">QueryMaster</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Management Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-3 mb-2 uppercase tracking-wider">Menu</div>
        {visible.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="w-5 text-center text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700/50">
        <div className="text-xs text-center text-slate-400 dark:text-slate-500">QueryMaster v1.0</div>
      </div>
    </div>
  )
}
