import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Video,
  Sparkles,
  Shield,
  Users,
  CheckCircle2,
  ArrowRight,
  MonitorUp,
  MessageSquare,
  Lock,
  ChevronDown,
  Layers,
  Zap,
  Globe2,
  FileText,
  Clock,
  Play,
  Check,
  Building,
  Sparkle,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'video' | 'ai' | 'transcript' | 'tasks'>('video')
  const [annualBilling, setAnnualBilling] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      q: 'How does IntellMeet differ from legacy video conferencing tools?',
      a: 'IntellMeet integrates ultra-low latency WebRTC peer-to-peer conferencing with client-side speech-to-text and autonomous AI meeting minutes extraction. Instead of taking manual notes, discussions are automatically transcribed and distilled into executive summaries, key decisions, and checkable action items in real time.',
    },
    {
      q: 'Is my audio and meeting data secure and private?',
      a: 'Yes. Video and audio streams use WebRTC with end-to-end encryption. Live subtitles are transcribed locally on-device using the HTML5 Web Speech API, meaning your live audio is never streamed to third-party transcription servers. Transcripts stored in your workspace are protected with AES-256 encryption.',
    },
    {
      q: 'Can I use IntellMeet with my existing Google Calendar or Outlook?',
      a: 'Yes. IntellMeet provides one-click calendar invitation links, ICS scheduling exports, and webhook notifications for Slack, Microsoft Teams, and Google Workspace.',
    },
    {
      q: 'What happens if our organization goes offline or has network dropouts?',
      a: 'IntellMeet has built-in resilient in-memory session buffering. Transcripts and meeting data are preserved locally and synced automatically once your connection resumes.',
    },
    {
      q: 'Do you offer Single Sign-On (SSO) and SCIM provisioning?',
      a: 'Yes, our Enterprise tier supports SAML 2.0, Okta, Azure AD, Google Workspace SSO, and automated SCIM directory synchronization for seamless employee onboarding.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#101828] font-sans overflow-x-hidden">
      {/* 1. Public Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#EAECF0] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-subtle">
              <Video className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-xl tracking-tight text-[#101828]">
                Intell<span className="text-[#2563EB]">Meet</span>
              </span>
              <span className="text-[10px] font-semibold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] px-1.5 py-0.5 rounded">
                ENTERPRISE
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#475467]">
            <a href="#features" className="hover:text-[#2563EB] transition-colors">
              Features
            </a>
            <a href="#ai-intelligence" className="hover:text-[#2563EB] transition-colors flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              AI Intelligence
            </a>
            <a href="#security" className="hover:text-[#2563EB] transition-colors">
              Security
            </a>
            <a href="#pricing" className="hover:text-[#2563EB] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#2563EB] transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" iconRight={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-gradient-to-b from-[#EFF8FF]/60 via-[#F8FAFC] to-[#F8FAFC]">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D0D5DD] shadow-subtle text-xs font-medium text-[#344054] animate-fade-in">
            <Badge variant="primary" size="sm" dot>
              IntellMeet 2.0
            </Badge>
            <span>Autonomous AI Meeting Intelligence is here</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#667085]" />
          </div>

          {/* Hero Headline */}
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#101828] tracking-tight leading-[1.15]">
            Make Every Meeting Matter.
          </h1>

          {/* Description */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#667085] leading-relaxed">
            Meet, collaborate and turn conversations into meaningful outcomes with intelligent meeting technology.
          </p>

          {/* Hero CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link to="/register">
              <Button variant="primary" size="lg" iconRight={<ArrowRight className="w-5 h-5" />}>
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">
                Explore Features
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#667085]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> 14-day enterprise trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#12B76A]" /> SOC-2 Type II certified
            </span>
          </div>
        </div>

        {/* 3. Product Showcase (Interactive High-Fidelity Preview) */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-16">
          <div className="rounded-2xl border border-[#EAECF0] bg-white p-2 sm:p-3 shadow-modal">
            {/* Window control bar */}
            <div className="h-10 bg-[#F8FAFC] border-b border-[#EAECF0] rounded-t-xl px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FDA29B]" />
                <span className="w-3 h-3 rounded-full bg-[#FEDF89]" />
                <span className="w-3 h-3 rounded-full bg-[#A6F4C5]" />
                <span className="text-xs font-mono text-[#98A2B3] ml-3 hidden sm:inline">
                  https://meet.intellmeet.com/sprint-q4-review
                </span>
              </div>
              {/* Tab Selector */}
              <div className="flex items-center gap-1">
                {(['video', 'ai', 'transcript', 'tasks'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveShowcaseTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      activeShowcaseTab === tab
                        ? 'bg-white text-[#2563EB] shadow-subtle border border-[#EAECF0] font-semibold'
                        : 'text-[#667085] hover:text-[#101828]'
                    }`}
                  >
                    {tab === 'video' && 'HD Video & Mesh'}
                    {tab === 'ai' && 'AI Executive Minutes'}
                    {tab === 'transcript' && 'Live Subtitles'}
                    {tab === 'tasks' && 'Action Board'}
                  </button>
                ))}
              </div>
            </div>

            {/* Showcase Stage Content */}
            <div className="bg-[#101828] rounded-b-xl p-4 sm:p-6 text-white min-h-[420px] flex flex-col justify-between">
              {activeShowcaseTab === 'video' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#98A2B3] border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A] animate-pulse" />
                      <span className="text-white font-medium">Sprint Q4 Architecture Review</span>
                      <span className="text-[#60A5FA] bg-[#60A5FA]/10 px-2 py-0.5 rounded border border-[#60A5FA]/20">
                        Room: sprint-q4
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#98A2B3]">Duration: 24:18</span>
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 text-[10px] font-semibold">
                        REC
                      </span>
                    </div>
                  </div>

                  {/* Video Tile Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="aspect-video bg-[#182235] rounded-xl border-2 border-[#12B76A] relative overflow-hidden flex items-center justify-center shadow-lg">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                        alt="Speaker"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-[#12B76A] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" /> Active Speaker
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-2">
                        <span>Sarah Chen (Lead Architect)</span>
                      </div>
                    </div>

                    <div className="aspect-video bg-[#182235] rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                        alt="Participant"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                        <span>David Miller (Engineering VP)</span>
                      </div>
                    </div>

                    <div className="aspect-video bg-[#182235] rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center">
                      <img
                        src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80"
                        alt="Participant"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 px-2.5 py-1 rounded-lg text-xs font-medium text-white">
                        <span>Elena Rostova (DevOps Lead)</span>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle Bar */}
                  <div className="bg-black/80 border border-white/10 rounded-xl p-3 text-center text-xs text-slate-200">
                    <span className="text-[#60A5FA] font-semibold">Sarah Chen: </span>
                    "We have migrated all peer signaling to Socket.io and verified 0ms Web Speech transcription."
                  </div>
                </div>
              )}

              {activeShowcaseTab === 'ai' && (
                <div className="space-y-4 max-w-3xl mx-auto py-2">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#60A5FA]" />
                      <h4 className="font-heading font-bold text-base text-white">
                        Autonomous AI Meeting Minutes
                      </h4>
                    </div>
                    <Badge variant="primary" size="sm">
                      Generated via OpenAI & Contextual NLP
                    </Badge>
                  </div>

                  <div className="bg-[#182235] rounded-xl p-4 border border-white/10 space-y-3">
                    <div className="text-xs font-semibold text-[#98A2B3] uppercase tracking-wider">
                      Executive Summary
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      The team completed sprint milestones for the WebRTC peer signaling mesh. All participants aligned on adopting the modern enterprise design system and verified 12 MongoDB schemas with automated fallback persistence.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#182235] rounded-xl p-4 border border-white/10 space-y-2">
                      <div className="text-xs font-semibold text-[#12B76A] flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Key Decisions (3)
                      </div>
                      <ul className="text-xs text-slate-300 space-y-1.5">
                        <li>• Adopted #2563EB primary palette & light dashboard theme</li>
                        <li>• Confirmed zero-latency client-side Web Speech STT</li>
                        <li>• Retained resilient fallback for offline resilience</li>
                      </ul>
                    </div>

                    <div className="bg-[#182235] rounded-xl p-4 border border-white/10 space-y-2">
                      <div className="text-xs font-semibold text-[#F79009] flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Extracted Action Items
                      </div>
                      <div className="text-xs text-slate-300 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded border-slate-700 text-[#2563EB]" readOnly />
                          <span>Finalize WebRTC signaling mesh (Elena)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded border-slate-700 text-[#2563EB]" readOnly />
                          <span>Verify 12 Mongoose collections (Sarah)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-slate-700 text-[#2563EB]" readOnly />
                          <span>Deploy Phase 2 UI release (David)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeShowcaseTab === 'transcript' && (
                <div className="space-y-3 max-w-2xl mx-auto py-2">
                  <div className="text-xs font-semibold text-[#98A2B3] flex items-center justify-between pb-2 border-b border-white/10">
                    <span>Live Searchable Transcript</span>
                    <span className="text-[#12B76A] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#12B76A]" /> Active SpeechRecognition
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-[#182235] border border-white/10 flex items-start gap-3">
                      <span className="text-[#60A5FA] font-mono text-[11px] shrink-0">10:04:12</span>
                      <div>
                        <div className="font-semibold text-white">Sarah Chen:</div>
                        <div className="text-slate-300">
                          "Good morning everyone. Today we are walking through the complete Phase 2 UI implementation."
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#182235] border border-white/10 flex items-start gap-3">
                      <span className="text-[#60A5FA] font-mono text-[11px] shrink-0">10:04:45</span>
                      <div>
                        <div className="font-semibold text-white">David Miller:</div>
                        <div className="text-slate-300">
                          "The response latency from the Socket.io signaling server is consistently under 12ms."
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-[#182235] border border-white/10 flex items-start gap-3">
                      <span className="text-[#60A5FA] font-mono text-[11px] shrink-0">10:05:18</span>
                      <div>
                        <div className="font-semibold text-white">Elena Rostova:</div>
                        <div className="text-slate-300">
                          "I'll package the production Docker containers right after we review the dashboard analytics."
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeShowcaseTab === 'tasks' && (
                <div className="space-y-4 max-w-3xl mx-auto py-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-sm font-semibold text-white">Action Items & Jira / Linear Sync</span>
                    <Badge variant="success" size="sm">
                      Synced
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-[#182235] p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="text-[11px] font-semibold text-[#98A2B3] uppercase">TO DO</div>
                      <div className="bg-[#101828] p-3 rounded-lg border border-white/5 space-y-1">
                        <div className="text-xs font-medium text-white">Implement SFU relay adapter</div>
                        <div className="text-[10px] text-[#60A5FA]">Assignee: Elena Rostova</div>
                      </div>
                    </div>
                    <div className="bg-[#182235] p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="text-[11px] font-semibold text-[#F79009] uppercase">IN PROGRESS</div>
                      <div className="bg-[#101828] p-3 rounded-lg border border-white/5 space-y-1">
                        <div className="text-xs font-medium text-white">Enterprise UI/UX Phase 2</div>
                        <div className="text-[10px] text-[#60A5FA]">Assignee: Frontend Team</div>
                      </div>
                    </div>
                    <div className="bg-[#182235] p-3.5 rounded-xl border border-white/10 space-y-2">
                      <div className="text-[11px] font-semibold text-[#12B76A] uppercase">DONE</div>
                      <div className="bg-[#101828] p-3 rounded-lg border border-white/5 space-y-1">
                        <div className="text-xs font-medium text-white">12 Mongoose Schemas & Tests</div>
                        <div className="text-[10px] text-[#12B76A]">Verified Phase 1</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Meeting Controls Bar */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Video className="w-4 h-4" />
                </div>
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <MonitorUp className="w-4 h-4" />
                </div>
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="h-9 px-4 rounded-full bg-[#F04438] text-white text-xs font-semibold flex items-center gap-1.5">
                  End Session
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-[#EAECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="primary" size="md">
              Enterprise Capabilities
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#101828] tracking-tight">
              Built for high-performance teams.
            </h2>
            <p className="text-base text-[#667085]">
              Everything you need for mission-critical video collaboration, live documentation, and execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverable className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                Ultra-Low Latency Video
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Direct WebRTC peer-to-peer streaming with adaptive bitrate control and crystal-clear audio quality.
              </p>
            </Card>

            <Card hoverable className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF3] text-[#027A48] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                On-Device Live Captions
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Speech-to-text running directly in your browser. Zero audio streaming fees, zero lag, zero data leakage.
              </p>
            </Card>

            <Card hoverable className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFFAEB] text-[#B54708] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                Autonomous Minutes
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Turn hours of discussion into concise executive summaries, agreed consensus decisions, and assigned tasks.
              </p>
            </Card>

            <Card hoverable className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] text-[#101828] border border-[#EAECF0] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                Enterprise Workspaces
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Multi-tenant organization architecture with SAML 2.0 SSO, role-based access control, and audit logs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. AI Intelligence Section */}
      <section id="ai-intelligence" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="primary" size="md">
                Meeting Intelligence
              </Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#101828] tracking-tight">
                Stop taking notes. <br />
                <span className="text-[#2563EB]">Start making decisions.</span>
              </h2>
              <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
                IntellMeet listens, understands context, and creates structured meeting minutes before the call even ends. Action items are extracted with designated owners and sync directly to your task trackers.
              </p>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#101828]">Context-Aware NLP Summarizer: </span>
                    <span className="text-[#667085]">Synthesizes dialogue lines into cohesive executive paragraphs.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#101828]">Automatic Task Assignment: </span>
                    <span className="text-[#667085]">Detects verbal commitments like "I will finalize the deployment" and assigns them to the speaker.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#ECFDF3] text-[#12B76A] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#101828]">Full Transcript Search: </span>
                    <span className="text-[#667085]">Jump straight to the exact second a topic, cost figure, or architecture decision was debated.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/register">
                  <Button variant="primary" size="md" iconRight={<ArrowRight className="w-4 h-4" />}>
                    Experience AI Intelligence
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Card representation */}
            <div className="bg-white border border-[#EAECF0] rounded-2xl p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-sm font-semibold text-[#101828]">Sample AI Minutes Card</span>
                </div>
                <Badge variant="success" size="sm">
                  100% Extracted
                </Badge>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold uppercase text-[#667085] tracking-wider">
                  Session Topic:
                </span>
                <p className="text-sm font-medium text-[#101828]">Q4 Infrastructure Scaling & SLA Commitments</p>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#EAECF0] text-xs text-[#344054] leading-relaxed">
                "The engineering leadership agreed to deploy regional WebRTC media bridges to support 150+ concurrent participants per room, with automated fallback in-memory caching."
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-semibold uppercase text-[#667085] tracking-wider">
                  Extracted Action Items
                </span>
                <div className="p-2.5 rounded-lg border border-[#EAECF0] text-xs flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                    <span className="text-[#101828]">Configure STUN/TURN clusters</span>
                  </div>
                  <Badge variant="primary" size="sm">David Miller</Badge>
                </div>
                <div className="p-2.5 rounded-lg border border-[#EAECF0] text-xs flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
                    <span className="text-[#101828]">Review SOC-2 audit requirements</span>
                  </div>
                  <Badge variant="warning" size="sm">Sarah Chen</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security Section */}
      <section id="security" className="py-20 bg-white border-y border-[#EAECF0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="gray" size="md">
              Bank-Grade Security
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#101828] tracking-tight">
              Enterprise-first privacy & compliance.
            </h2>
            <p className="text-base text-[#667085]">
              Built from day one to exceed the rigorous security and regulatory requirements of Fortune 500 enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                End-to-End Encryption
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                WebRTC streams encrypted with DTLS-SRTP. Stored transcripts, summaries, and audit logs encrypted with AES-256 at rest.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                SAML 2.0 & Okta SSO
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Centralized access management. Integrate with Okta, Azure AD, Ping, and Google Workspace with granular RBAC permissions.
              </p>
            </Card>

            <Card className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-semibold text-base text-[#101828]">
                Data Residency & GDPR
              </h3>
              <p className="text-xs text-[#667085] leading-relaxed">
                Complete compliance with GDPR, HIPAA, and CCPA. Choose US or EU data residency clusters for meeting metadata and recordings.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 7. Pricing Section */}
      <section id="pricing" className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <Badge variant="primary" size="md">
              Simple, Transparent Pricing
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#101828] tracking-tight">
              Invest in higher meeting velocity.
            </h2>
            <p className="text-base text-[#667085]">
              Choose the right plan for your team. Scale seamlessly as collaboration needs grow.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3 text-xs font-medium">
              <span className={!annualBilling ? 'text-[#101828] font-semibold' : 'text-[#667085]'}>
                Monthly billing
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  annualBilling ? 'bg-[#2563EB]' : 'bg-[#D0D5DD]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    annualBilling ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={annualBilling ? 'text-[#101828] font-semibold flex items-center gap-1.5' : 'text-[#667085]'}>
                Annual billing
                <span className="bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  SAVE 20%
                </span>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Starter Plan */}
            <Card className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-xl text-[#101828]">Starter</h3>
                  <p className="text-xs text-[#667085]">For small teams and individuals getting started.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#101828] font-heading">$0</span>
                  <span className="text-xs text-[#667085]">/ user / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#344054] pt-2 border-t border-[#EAECF0]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Up to 40 minutes per meeting
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Up to 50 participants
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Real-time Speech-to-Text
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> 3 AI summaries per month
                  </li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="secondary" size="md" className="w-full">
                  Start Free
                </Button>
              </Link>
            </Card>

            {/* Pro Plan (Highlighted) */}
            <Card className="flex flex-col justify-between space-y-6 border-2 border-[#2563EB] shadow-card relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="primary" size="sm" className="font-semibold">
                  MOST POPULAR
                </Badge>
              </div>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-xl text-[#101828]">Professional</h3>
                  <p className="text-xs text-[#667085]">For fast-paced teams requiring unlimited meeting intelligence.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#101828] font-heading">
                    {annualBilling ? '$15' : '$19'}
                  </span>
                  <span className="text-xs text-[#667085]">/ user / month</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#344054] pt-2 border-t border-[#EAECF0]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Unlimited meeting duration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Up to 150 participants per room
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Unlimited AI meeting summaries
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Action items & task board sync
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Searchable cloud meeting transcripts
                  </li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="primary" size="md" className="w-full">
                  Start 14-Day Pro Trial
                </Button>
              </Link>
            </Card>

            {/* Enterprise Plan */}
            <Card className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-xl text-[#101828]">Enterprise</h3>
                  <p className="text-xs text-[#667085]">For organizations requiring custom compliance, SLAs and SSO.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[#101828] font-heading">Custom</span>
                </div>
                <ul className="space-y-2.5 text-xs text-[#344054] pt-2 border-t border-[#EAECF0]">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Unlimited participants (1000+)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Dedicated media relay nodes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> SAML 2.0 & Okta SSO integration
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> 99.99% SLA uptime guarantee
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#12B76A]" /> Dedicated customer success manager
                  </li>
                </ul>
              </div>
              <Link to="/register">
                <Button variant="secondary" size="md" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-[#EAECF0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <Badge variant="gray" size="md">
              Frequently Asked Questions
            </Badge>
            <h2 className="font-heading text-3xl font-bold text-[#101828] tracking-tight">
              Got questions? We have answers.
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="rounded-xl border border-[#EAECF0] bg-white transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm text-[#101828] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#667085] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#2563EB]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#667085] leading-relaxed border-t border-[#EAECF0]/60 pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="py-16 bg-[#101828] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to upgrade your enterprise collaboration?
          </h2>
          <p className="max-w-xl mx-auto text-sm text-[#98A2B3]">
            Join thousands of modern product teams turning virtual discussions into automated execution.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In to Workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Public Footer */}
      <footer className="bg-[#101828] text-[#98A2B3] text-xs border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white">
                  <Video className="w-4 h-4" />
                </div>
                <span className="font-heading font-bold text-lg text-white">
                  Intell<span className="text-[#60A5FA]">Meet</span>
                </span>
              </div>
              <p className="text-xs text-[#98A2B3] max-w-sm leading-relaxed">
                Next-generation virtual collaboration with low-latency WebRTC streaming, on-device voice transcription, and autonomous AI meeting minutes extraction.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-[#A6F4C5]">
                <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
                <span>All Global Systems Operational</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Product</div>
              <ul className="space-y-1.5">
                <li><a href="#features" className="hover:text-white">HD Video</a></li>
                <li><a href="#ai-intelligence" className="hover:text-white">AI Summaries</a></li>
                <li><a href="#features" className="hover:text-white">Live Captions</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Enterprise</div>
              <ul className="space-y-1.5">
                <li><a href="#security" className="hover:text-white">Security & SSO</a></li>
                <li><a href="#security" className="hover:text-white">SOC-2 Type II</a></li>
                <li><a href="#security" className="hover:text-white">GDPR Compliance</a></li>
                <li><a href="#pricing" className="hover:text-white">Custom SLA</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Company</div>
              <ul className="space-y-1.5">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <span>© 2026 IntellMeet Inc. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white">Security</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Cookies</a>
              <a href="#" className="hover:text-white">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
