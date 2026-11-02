import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Video,
  History,
  LayoutDashboard,
  Settings,
  Layers,
  Database,
  Users,
} from 'lucide-react'
import { cn } from '../../utils/cn'

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Past Meetings', icon: History, path: '/history' },
    { label: 'Workspaces', icon: Layers, path: '/#workspaces' },
    { label: 'Team Members', icon: Users, path: '/#team' },
    { label: 'Schema Models', icon: Database, path: '/#schemas' },
    { label: 'Settings', icon: Settings, path: '/#settings' },
  ]

  return (
    <aside className="w-64 border-r border-slate-800 bg-surface-900/50 backdrop-blur-sm flex flex-col justify-between p-4 hidden md:flex shrink-0">
      <div className="space-y-6">
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive && item.path === '/'
                      ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* System Status Footnote */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span>IntellMeet v1.0</span>
          <span className="text-emerald-400 text-[11px] font-semibold">ONLINE</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          WebRTC mesh, Socket.io signaling & AI summarization engine active.
        </p>
      </div>
    </aside>
  )
}
