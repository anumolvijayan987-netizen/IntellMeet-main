import React from 'react'
import { Link } from 'react-router-dom'
import { Video, Sparkles, Building2, Shield, Circle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useSocket } from '../../hooks/useSocket'
import { Badge } from '../ui/Badge'

export const Navbar: React.FC = () => {
  const { user, workspaceName } = useAuthStore()
  const { isConnected } = useSocket()

  return (
    <header className="h-16 border-b border-slate-800 bg-surface-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface-900 rounded-[10px] flex items-center justify-center">
              <Video className="w-5 h-5 text-brand-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Plus_Jakarta_Sans']">
                Intell<span className="text-brand-400">Meet</span>
              </span>
              <span className="text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.5 rounded">
                ENTERPRISE
              </span>
            </div>
          </div>
        </Link>

        {/* Workspace Pill */}
        <div className="hidden md:flex items-center gap-2 pl-6 border-l border-slate-800 text-sm text-slate-400">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-300">{workspaceName}</span>
        </div>
      </div>

      {/* Right Controls: Real-time status + User Profile */}
      <div className="flex items-center gap-4">
        {/* Real-time Socket Indicator */}
        <Badge
          variant={isConnected ? 'success' : 'warning'}
          className="hidden sm:inline-flex"
        >
          <Circle
            className={`w-2 h-2 fill-current ${
              isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
            }`}
          />
          {isConnected ? 'Real-time Mesh Active' : 'Connecting Mesh...'}
        </Badge>

        {/* AI Engine Status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Summarization Engine Ready</span>
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-brand-500/20"
          />
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-200">{user.name}</div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Shield className="w-3 h-3 text-brand-400" />
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
