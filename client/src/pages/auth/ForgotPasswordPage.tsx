import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Video, Mail, ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { authService } from '../../services/authService'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await authService.forgotPassword(email)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.')
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
          Reset your password
        </h2>
        <p className="text-xs text-[#667085]">
          Enter your registered work email and we'll send you recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-full bg-[#ECFDF3] border border-[#A6F4C5] text-[#12B76A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#101828]">Check your inbox</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  We've sent password reset instructions to <span className="font-medium text-[#101828]">{email}</span>.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <Link to="/reset-password">
                  <Button variant="primary" size="md" className="w-full">
                    Proceed to Set New Password
                  </Button>
                </Link>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-[#667085] hover:text-[#101828] font-medium"
                >
                  Didn't receive email? Click to try again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Work Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                loading={loading}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Instructions
              </Button>
            </form>
          )}

          <div className="pt-2 border-t border-[#EAECF0] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#667085] hover:text-[#101828]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
