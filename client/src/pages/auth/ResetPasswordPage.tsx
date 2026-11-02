import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Video, Lock, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { authService } from '../../services/authService'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || 'token_sample'

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isMatch = password.length > 0 && password === confirmPassword

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasMinLength || !hasNumber || !hasSpecial) {
      setError('Password does not meet enterprise security requirements.')
      return
    }
    if (!isMatch) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Password reset failed or token expired.')
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
          Set new password
        </h2>
        <p className="text-xs text-[#667085]">
          Your new password must be different from previous passwords.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF3] border border-[#A6F4C5] text-[#12B76A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#101828]">Password reset successful</h3>
                <p className="text-xs text-[#667085]">
                  Your credentials have been securely updated. You can now sign in.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                Sign In Now
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318]">
                  {error}
                </div>
              )}

              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#EAECF0] space-y-1.5 text-xs text-[#667085]">
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasMinLength ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#EAECF0] text-[#98A2B3]'}`}>
                    {hasMinLength ? '✓' : '•'}
                  </span>
                  <span>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isMatch ? 'bg-[#ECFDF3] text-[#12B76A]' : 'bg-[#EAECF0] text-[#98A2B3]'}`}>
                    {isMatch ? '✓' : '•'}
                  </span>
                  <span>Passwords match</span>
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
                Reset Password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
