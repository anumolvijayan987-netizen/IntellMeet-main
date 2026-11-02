import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Video, Mail, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { authService } from '../../services/authService'

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || 'sarah@company.com'

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(45)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-advance focus
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await authService.verifyEmail(email, code)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired verification code.')
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
          Verify your work email
        </h2>
        <p className="text-xs text-[#667085]">
          We have sent a 6-digit confirmation code to{' '}
          <span className="font-medium text-[#101828]">{email}</span>.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="space-y-6">
          {error && (
            <div className="p-3 bg-[#FEF3F2] border border-[#FECDCA] rounded-lg text-xs text-[#B42318]">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-12 text-center text-lg font-bold rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] focus:outline-none transition-colors"
                />
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center"
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Verify & Proceed
            </Button>
          </form>

          <div className="pt-2 border-t border-[#EAECF0] text-center text-xs text-[#667085]">
            Didn't receive the code?{' '}
            {timer > 0 ? (
              <span className="font-medium text-[#98A2B3]">Resend in {timer}s</span>
            ) : (
              <button
                onClick={() => setTimer(45)}
                className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                Click to resend
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
