import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building, Layers, Users, ArrowRight, Check, Video, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../stores/authStore'
import { apiRequest } from '../../services/apiClient'

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUserName } = useAuthStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [orgName, setOrgName] = useState('Acme Corporation')
  const [teamSize, setTeamSize] = useState('11-50')
  const [workspaceName, setWorkspaceName] = useState('Engineering & Product')
  const [workspaceSlug, setWorkspaceSlug] = useState('eng-product')
  const [invites, setInvites] = useState([
    { email: 'alex@company.com', role: 'member' },
    { email: 'michael@company.com', role: 'member' },
  ])
  const [newEmail, setNewEmail] = useState('')

  const handleAddInvite = () => {
    if (newEmail && newEmail.includes('@')) {
      setInvites([...invites, { email: newEmail, role: 'member' }])
      setNewEmail('')
    }
  }

  const handleRemoveInvite = (idx: number) => {
    setInvites(invites.filter((_, i) => i !== idx))
  }

  const handleFinish = async () => {
    try {
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)
      await apiRequest('/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: orgName,
          slug,
          tier: 'enterprise',
        }),
      })
    } catch {
      // Continue to dashboard
    }
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Stepper */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center space-y-4">
        <div className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-subtle">
            <Video className="w-5 h-5" />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight text-[#101828]">
            Intell<span className="text-[#2563EB]">Meet</span>
          </span>
        </div>

        {/* Progress Pills */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              step >= 1 ? 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]' : 'bg-[#EAECF0] text-[#98A2B3]'
            }`}
          >
            <span>1. Organization</span>
          </div>
          <span className="text-[#D0D5DD]">/</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              step >= 2 ? 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]' : 'bg-[#EAECF0] text-[#98A2B3]'
            }`}
          >
            <span>2. Workspace</span>
          </div>
          <span className="text-[#D0D5DD]">/</span>
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              step === 3 ? 'bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF]' : 'bg-[#EAECF0] text-[#98A2B3]'
            }`}
          >
            <span>3. Team</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="space-y-6">
          {/* STEP 1: Organization Profile */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-xl text-[#101828]">
                  Set up your organization profile
                </h3>
                <p className="text-xs text-[#667085]">
                  This establishes the parent domain and enterprise billing profile for your team.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Organization Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Global Inc."
                  icon={<Building className="w-4 h-4" />}
                  required
                />

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-[#344054]">
                    Company Size
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['1-10', '11-50', '51-200', '201+'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTeamSize(size)}
                        className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                          teamSize === size
                            ? 'bg-[#EFF8FF] border-[#2563EB] text-[#175CD3] font-semibold'
                            : 'border-[#D0D5DD] text-[#344054] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {size} people
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAECF0] flex justify-end">
                <Button
                  variant="primary"
                  size="md"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep(2)}
                >
                  Continue to Workspace
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Workspace Setup */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-xl text-[#101828]">
                  Create your first team workspace
                </h3>
                <p className="text-xs text-[#667085]">
                  Workspaces group meetings, transcripts, and AI insights by department or project.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Workspace Name"
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value)
                    setWorkspaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }}
                  placeholder="e.g. Core Engineering"
                  icon={<Layers className="w-4 h-4" />}
                  required
                />

                <div>
                  <label className="block text-xs font-medium text-[#344054] mb-1">
                    Workspace URL
                  </label>
                  <div className="flex items-center rounded-lg border border-[#D0D5DD] bg-[#F8FAFC] px-3 py-2 text-xs text-[#667085]">
                    <span>https://meet.intellmeet.com/ws/</span>
                    <span className="font-semibold text-[#101828] ml-0.5">{workspaceSlug || 'workspace'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                  onClick={() => setStep(3)}
                >
                  Continue to Team Invites
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Invite Team Members */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-xl text-[#101828]">
                  Invite your colleagues
                </h3>
                <p className="text-xs text-[#667085]">
                  Collaborate in real time with automated transcripts and shared meeting minutes.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="colleague@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    icon={<Users className="w-4 h-4" />}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleAddInvite}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {invites.map((inv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[#EAECF0] bg-[#F8FAFC] text-xs"
                    >
                      <span className="font-medium text-[#101828]">{inv.email}</span>
                      <div className="flex items-center gap-2">
                        <span className="bg-white border border-[#D0D5DD] px-2 py-0.5 rounded text-[11px] text-[#667085]">
                          Member
                        </span>
                        <button
                          onClick={() => handleRemoveInvite(idx)}
                          className="text-[#98A2B3] hover:text-[#F04438]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="text-xs text-[#667085] hover:text-[#101828] font-medium"
                >
                  Skip for now
                </button>
                <Button
                  variant="primary"
                  size="md"
                  iconRight={<Check className="w-4 h-4" />}
                  onClick={handleFinish}
                >
                  Launch IntellMeet Dashboard
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
