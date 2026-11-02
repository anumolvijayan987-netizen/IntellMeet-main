import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video, Lock, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUser, setUserName } = useAuthStore()

  const [email, setEmail] = useState('architect@intellmeet.io')
  const [password, setPassword] = useState('password123')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await authService.login({ email, password })
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatarUrl: response.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        status: response.user.status || 'active',
        organizationId: response.user.organizationId,
        workspaceId: response.user.workspaceId,
      })
      navigate('/app')
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-subtle">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight text-[#101828]">
            Intell<span className="text-[#2563EB]">Meet</span>
          </span>
        </Link>
        <h2 className="font-heading text-2xl font-bold text-[#101828] tracking-tight">
          Sign in to your enterprise workspace
        </h2>
        <p className="text-xs text-[#667085]">
          Welcome back! Please enter your credentials to access meetings.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="space-y-6">
          {/* SSO Quick Button */}
          <div>
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center text-xs text-[#344054] font-medium"
              onClick={() => {
                setUserName('Enterprise User')
                navigate('/app')
              }}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              }
            >
              Continue with Google Workspace
            </Button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#EAECF0] w-full" />
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-[#98A2B3] absolute">
              Or with work email
            </span>
          </div>

          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318] flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
              />
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-[#475467] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#D0D5DD] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Remember me for 30 days</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* 1-Click Demo Profiles */}
          <div className="pt-2 border-t border-[#EAECF0] space-y-2">
            <div className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider">
              Quick 1-Click Demo Profiles (Distinct Names)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUser({
                    id: 'usr_sarah',
                    name: 'Sarah Chen',
                    email: 'sarah@intellmeet.io',
                    role: 'org_admin',
                    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
                  })
                  navigate('/app')
                }}
                className="p-2 text-left rounded-lg border border-[#EAECF0] hover:border-[#2563EB] hover:bg-[#EFF8FF] transition-all text-xs"
              >
                <div className="font-semibold text-[#101828]">Sarah Chen</div>
                <div className="text-[10px] text-[#667085]">Host / Admin</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUser({
                    id: 'usr_alex',
                    name: 'Alex Rivera',
                    email: 'alex@intellmeet.io',
                    role: 'member',
                    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
                  })
                  navigate('/app')
                }}
                className="p-2 text-left rounded-lg border border-[#EAECF0] hover:border-[#2563EB] hover:bg-[#EFF8FF] transition-all text-xs"
              >
                <div className="font-semibold text-[#101828]">Alex Rivera</div>
                <div className="text-[10px] text-[#667085]">Sprint Lead</div>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#EAECF0] text-center text-xs text-[#667085]">
            Don't have an enterprise workspace?{' '}
            <Link to="/register" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
              Create an account
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-center text-[11px] text-[#98A2B3]">
          Protected by enterprise multi-tenant isolation and AES-256 encryption.
        </p>
      </div>
    </div>
  )
}
