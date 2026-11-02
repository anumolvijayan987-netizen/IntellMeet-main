import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Video, Lock, Mail, User, Building, ArrowRight, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../stores/authStore'
import { authService } from '../../services/authService'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password rules validation
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isPasswordValid = hasMinLength && hasNumber && hasSpecial

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) {
      setError('Please agree to the Terms of Service to continue.')
      return
    }
    if (!isPasswordValid) {
      setError('Please ensure password satisfies all security requirements.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await authService.register({
        name,
        email,
        password,
        organizationName: company,
        role: 'org_admin',
      })
      setUser({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
        avatarUrl: response.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        status: 'active',
      })
      navigate('/app')
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check information.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
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
          Create your enterprise account
        </h2>
        <p className="text-xs text-[#667085]">
          Start your 14-day full-featured enterprise trial. No credit card required.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="space-y-5">
          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318]">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Chen"
              icon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@company.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Company / Organization Name"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Global Inc."
              icon={<Building className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                icon={<Lock className="w-4 h-4" />}
                required
              />

              {/* Password strength checklist */}
              <div className="mt-2.5 p-3 rounded-lg bg-[#F8FAFC] border border-[#EAECF0] space-y-1.5 text-xs text-[#667085]">
                <div className="text-[11px] font-semibold text-[#344054]">Security Requirements:</div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#EAECF0] text-[#98A2B3]'}`}>
                    {hasMinLength ? '✓' : '•'}
                  </span>
                  <span className={hasMinLength ? 'text-[#101828]' : ''}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasNumber ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#EAECF0] text-[#98A2B3]'}`}>
                    {hasNumber ? '✓' : '•'}
                  </span>
                  <span className={hasNumber ? 'text-[#101828]' : ''}>Contains at least 1 number</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasSpecial ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#EAECF0] text-[#98A2B3]'}`}>
                    {hasSpecial ? '✓' : '•'}
                  </span>
                  <span className={hasSpecial ? 'text-[#101828]' : ''}>Contains at least 1 special character</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded border-[#D0D5DD] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <label htmlFor="terms" className="text-xs text-[#475467] leading-relaxed cursor-pointer">
                I agree to the <a href="#" className="text-[#2563EB] hover:underline">Terms of Service</a>,{' '}
                <a href="#" className="text-[#2563EB] hover:underline">Privacy Policy</a>, and enterprise SLA.
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>

          <div className="pt-2 border-t border-[#EAECF0] text-center text-xs text-[#667085]">
            Already have an enterprise account?{' '}
            <Link to="/login" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
