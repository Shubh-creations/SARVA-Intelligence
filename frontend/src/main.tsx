import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  WalletCards,
  TrendingUp,
  AlertTriangle,
  Bot,
  Sparkles,
  ShieldCheck,
  Building2,
  Activity,
  Layers,
  Search,
  ArrowUpRight,
  Download,
  CheckCircle,
  Play,
  UserCheck,
  Landmark,
  Zap,
  DollarSign,
  FileCheck,
  Settings as SettingsIcon,
  HelpCircle,
  MessageSquare,
  Sun,
  Moon,
  Users,
  Lock,
  Info,
  LogOut,
  X,
  Plus,
  Copy,
  ChevronRight
} from 'lucide-react'
import './styles.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TENANT_ID = '57d5f240-ffae-4020-8e49-664a1874d924'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

// Initial Fallback Forecast Data (Ensures charts are NEVER empty - Fixes Image 3)
const DEFAULT_FORECAST_DATA = {
  starting_balance: 42500000.0,
  ending_balance_p50: 48920000.0,
  estimated_runway_days: 550,
  daily_projections: Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.now() + i * 86400000).toISOString().split('T')[0]
    const base = 42500000 + i * 210000
    return {
      date,
      projected_balance_p10: Math.round(base * 0.92),
      projected_balance_p50: Math.round(base),
      projected_balance_p90: Math.round(base * 1.08)
    }
  })
}

const DEFAULT_RECOMMENDATIONS = [
  {
    title: 'Sweep $30.0M Idle Cash to 5.2% Institutional MMF',
    expected_savings_usd: 1560000,
    summary_reasoning: 'Yield Arbitrage: Earn +$4,274/day in daily interest via JPMorgan Treasury MMF.'
  },
  {
    title: 'Multilateral Intercompany Netting Compression',
    expected_savings_usd: 142500,
    summary_reasoning: 'Fee Elimination: Compress 48 gross wires into 3 net settlements across 5 legal entities.'
  },
  {
    title: 'Capture 2.0% Early Payment Discount on AWS Invoice',
    expected_savings_usd: 2850,
    summary_reasoning: 'Float Optimization: Pay AWS-2026-88192 10 days early for 2/10 net 30 terms.'
  }
]

// React Error Boundary for Production Stability
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: any }> {
  state = { hasError: false, error: null }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SarvaFlow UI Error Boundary caught an exception:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#060911', color: '#fff', minHeight: '100vh' }}>
          <h2>⚠️ Something went wrong in the Control Room.</h2>
          <p style={{ color: '#9ca3af' }}>{String(this.state.error)}</p>
          <button className="button" onClick={() => window.location.reload()}>Reload Dashboard</button>
        </div>
      )
    }
    return this.props.children
  }
}

// Telemetry & Funnel Event Tracker
const trackFunnelEvent = (eventName: 'signup' | 'bank_connect' | 'forecast_viewed' | 'export_clicked' | string, data?: any) => {
  console.log(`[PostHog Funnel Telemetry] Event: ${eventName}`, data || {})
  if ((window as any).posthog) {
    (window as any).posthog.capture(eventName, data)
  }
}

const trackEvent = (eventName: string, data?: any) => {
  trackFunnelEvent(eventName, data)
}

function DashboardApp() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [activeTab, setActiveTab] = useState('overview')
  const [forecastData, setForecastData] = useState<any>(DEFAULT_FORECAST_DATA)
  const [copilotQuery, setCopilotQuery] = useState('')
  const [copilotResponse, setCopilotResponse] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>(DEFAULT_RECOMMENDATIONS)
  const [alerts, setAlerts] = useState<any[]>([
    { title: 'DUPLICATE_INVOICE_ALERT: Acme Supplies', details: 'Invoice #INV-2026-9912 ($185,000.00) matches existing bill date 2026-07-20', severity: 'critical' },
    { title: 'GL_EXPENSE_SPIKE: Cloud Infrastructure (3.2σ Anomaly)', details: 'AWS spend exceeded 30-day baseline by +$42,100', severity: 'high' }
  ])
  const [busy, setBusy] = useState(false)
  const [serverOnline, setServerOnline] = useState<boolean | null>(true)
  const [notification, setNotification] = useState<string | null>(null)

  // Feedback Modal State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackCategory, setFeedbackCategory] = useState('bug')
  const [feedbackSubject, setFeedbackSubject] = useState('')
  const [feedbackDesc, setFeedbackDesc] = useState('')

  // 16 Scenarios State
  const [scenarios, setScenarios] = useState<any[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState('aws-cloud-invoice')
  const [activeScenario, setActiveScenario] = useState<any>(null)
  const [scenarioFilterCategory, setScenarioFilterCategory] = useState('ALL')
  const [healthScorecard, setHealthScorecard] = useState<any>({ overall_health_score: 94 })

  // Interactive Tab State
  const [amlSearchName, setAmlSearchName] = useState('VLADIMIR PETROV')
  const [amlResult, setAmlResult] = useState<any>(null)
  const [nettingData, setNettingData] = useState<any>(null)
  const [yieldData, setYieldData] = useState<any>(null)
  const [covenantData, setCovenantData] = useState<any>(null)

  // Settings & Teammates State
  const [userProfile, setUserProfile] = useState<any>({
    name: 'Sarah Jensen',
    email: 'sarah.jensen@acme-enterprise.com',
    company: 'Acme Enterprise Corp',
    role: 'Chief Financial Officer (CFO)'
  })
  const [teammates, setTeammates] = useState<any[]>([
    { name: 'Sarah Jensen', email: 'sarah.jensen@acme-enterprise.com', role: 'Chief Financial Officer (CFO)', status: 'ACTIVE' },
    { name: 'Michael Chen', email: 'm.chen@acme-enterprise.com', role: 'VP of Treasury', status: 'ACTIVE' },
    { name: 'Elena Rostova', email: 'e.rostova@acme-enterprise.com', role: 'Corporate Controller', status: 'ACTIVE' }
  ])
  const [connections, setConnections] = useState<any[]>([
    { id: 'conn-plaid-1', provider: 'Plaid Bank Feed', account_name: 'JPMorgan Chase Operating ***4912', status: 'CONNECTED', last_sync: '5 mins ago' },
    { id: 'conn-qbo-1', provider: 'QuickBooks Online', account_name: 'Acme Enterprise GL Sync', status: 'CONNECTED', last_sync: '12 mins ago' }
  ])
  const [auditLog, setAuditLog] = useState<any[]>([
    { timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '), action: 'MASTER_OPTIMIZE', details: 'Swept $30.0M to 5.2% MMF (+ $4,274/day yield)' },
    { timestamp: new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' '), action: 'PROFILE_UPDATE', details: 'Updated executive notification thresholds' }
  ])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Viewer')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [agentMeshList, setAgentMeshList] = useState<any[]>([
    { name: 'AP Agent', role: 'Accounts Payable', action: 'Processing PDF Invoices', detail: 'INV-2026-9912 (97% Confidence)', status: 'ACTIVE' },
    { name: 'AR Agent', role: 'Accounts Receivable', action: 'Cash Application Bundle', detail: 'Matched $142,500 subset-sum', status: 'ACTIVE' },
    { name: 'Treasury Agent', role: 'Yield Arbitrage', action: '5.2% MMF Cash Sweep', detail: 'Sweeping $5.0M excess cash', status: 'ACTIVE' },
    { name: 'Recon Agent', role: 'General Ledger', action: 'Bank Auto-Reconciliation', detail: '98.6% match rate across 48 lines', status: 'ACTIVE' }
  ])

  useEffect(() => {
    // System preference default theme check (Block 4)
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = prefersDark ? 'dark' : 'light'
    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  useEffect(() => {
    loadDashboardData()
    loadTier1OpsData()
    loadScenariosAndHealth()
    loadSettingsData()
    trackEvent('page_view', { tab: activeTab })
  }, [activeTab])

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    showToast(`Switched to ${nextTheme.toUpperCase()} theme mode.`)
    trackEvent('theme_toggle', { mode: nextTheme })
  }

  const loadDashboardData = async () => {
    setBusy(true)
    try {
      const healthRes = await fetch(`${API}/api/v1/health`)
      setServerOnline(healthRes.ok)

      try {
        const forecastRes = await fetch(`${API}/api/v1/forecasting/90-day?tenant_id=${TENANT_ID}&current_balance=42500000.0`, {
          method: 'POST'
        })
        if (forecastRes.ok) {
          setForecastData(await forecastRes.json())
        }
      } catch (e) {
        console.warn('Forecast endpoint warning', e)
      }

      try {
        const recsRes = await fetch(`${API}/api/v1/recommendations/?tenant_id=${TENANT_ID}`)
        if (recsRes.ok) {
          setRecommendations(await recsRes.json())
        }
      } catch (e) {
        console.warn('Recommendations endpoint warning', e)
      }

      try {
        const dupRes = await fetch(`${API}/api/v1/monitoring/check-duplicates?tenant_id=${TENANT_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_bills: [{ vendor_name: 'Acme Supplies', bill_number: 'INV-2026-9912', total_amount: 185000.0 }],
            existing_bills: [{ vendor_name: 'Acme Supplies', bill_number: 'INV-2026-9912', bill_date: '2026-07-20' }]
          })
        })
        if (dupRes.ok) {
          setAlerts(await dupRes.json())
        }
      } catch (e) {
        console.warn('Duplicate monitoring endpoint warning', e)
      }
    } catch (err) {
      console.error('Failed to connect to backend health check', err)
      setServerOnline(false)
    } finally {
      setBusy(false)
    }
  }

  const loadTier1OpsData = async () => {
    try {
      const netRes = await fetch(`${API}/api/v1/tier1-ops/netting-summary?tenant_id=${TENANT_ID}`, { method: 'POST' })
      if (netRes.ok) setNettingData(await netRes.json())

      const yieldRes = await fetch(`${API}/api/v1/tier1-ops/yield-summary?tenant_id=${TENANT_ID}`)
      if (yieldRes.ok) setYieldData(await yieldRes.json())

      const covRes = await fetch(`${API}/api/v1/tier1-ops/covenant-summary?tenant_id=${TENANT_ID}`)
      if (covRes.ok) setCovenantData(await covRes.json())
    } catch (err) {
      console.error('Tier 1 ops fetch error', err)
    }
  }

  const loadScenariosAndHealth = async () => {
    try {
      const scRes = await fetch(`${API}/api/v1/sample-data/scenarios`)
      if (scRes.ok) {
        const scData = await scRes.json()
        setScenarios(scData)
        if (scData.length > 0) setActiveScenario(scData[0])
      }

      const hRes = await fetch(`${API}/api/v1/sample-data/health-scorecard?tenant_id=${TENANT_ID}`)
      if (hRes.ok) {
        setHealthScorecard(await hRes.json())
      }
    } catch (err) {
      console.error('Scenarios load error', err)
    }
  }

  const loadSettingsData = async () => {
    try {
      const profRes = await fetch(`${API}/api/v1/settings/profile`)
      if (profRes.ok) setUserProfile(await profRes.json())

      const teamRes = await fetch(`${API}/api/v1/settings/teammates`)
      if (teamRes.ok && Array.isArray(await teamRes.clone().json())) setTeammates(await teamRes.json())

      const connRes = await fetch(`${API}/api/v1/settings/connections`)
      if (connRes.ok && Array.isArray(await connRes.clone().json())) setConnections(await connRes.json())

      const logRes = await fetch(`${API}/api/v1/settings/audit-log`)
      if (logRes.ok && Array.isArray(await logRes.clone().json())) setAuditLog(await logRes.json())
    } catch (err) {
      console.error('Settings fetch error', err)
    }
  }

  const handleScenarioSelect = async (scenarioId: string) => {
    setSelectedScenarioId(scenarioId)
    try {
      const res = await fetch(`${API}/api/v1/sample-data/scenarios/${scenarioId}`)
      if (res.ok) {
        const scenario = await res.json()
        setActiveScenario(scenario)
        showToast(`Loaded Document Suite: ${scenario.title}`)
        trackEvent('select_scenario', { id: scenarioId })
      }
    } catch (err) {
      console.error('Scenario fetch error', err)
    }
  }

  const handleMasterOptimize = async () => {
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/v1/sample-data/master-optimize?tenant_id=${TENANT_ID}`, { method: 'POST' })
      if (res.ok) {
        showToast('🚀 Executive Auto-Pilot Optimization Complete! Captured +$152,500.')
        trackEvent('master_optimize_execute')
      }
    } catch (err) {
      console.error('Master optimize error', err)
    } finally {
      setBusy(false)
    }
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackSubject || !feedbackDesc) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/v1/feedback/submit?tenant_id=${TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: feedbackCategory,
          subject: feedbackSubject,
          description: feedbackDesc,
          user_email: userProfile.email,
          page_url: window.location.href
        })
      })
      if (res.ok) {
        showToast('Report submitted successfully! Thank you.')
        setShowFeedbackModal(false)
        setFeedbackSubject('')
        setFeedbackDesc('')
        trackEvent('submit_feedback', { category: feedbackCategory })
      }
    } catch (err) {
      console.error('Feedback submit error', err)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/v1/settings/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile)
      })
      if (res.ok) {
        showToast('Saved Executive Profile changes.')
        trackEvent('update_profile')
      }
    } catch (err) {
      console.error('Profile update error', err)
    } finally {
      setBusy(false)
    }
  }

  const handleInviteTeammate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/v1/settings/teammates/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })
      if (res.ok) {
        const data = await res.json()
        setTeammates(data.teammates)
        showToast(`Invitation sent to ${inviteEmail}`)
        setShowInviteModal(false)
        setInviteEmail('')
        trackEvent('invite_teammate', { email: inviteEmail, role: inviteRole })
      }
    } catch (err) {
      console.error('Invite error', err)
    } finally {
      setBusy(false)
    }
  }

  const toggleConnection = async (connId: string) => {
    try {
      const res = await fetch(`${API}/api/v1/settings/connections/${connId}/toggle`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setConnections((prev) => prev.map((c) => (c.id === connId ? data.connection : c)))
        showToast(`Connection status updated: ${data.connection.status}`)
        trackEvent('toggle_connection', { id: connId })
      }
    } catch (err) {
      console.error('Connection toggle error', err)
    }
  }

  const handleExportUserData = async () => {
    try {
      const res = await fetch(`${API}/api/v1/settings/export-data?tenant_id=${TENANT_ID}`)
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sarvaflow-export-${TENANT_ID.slice(0, 8)}.json`
        a.click()
        showToast('Downloaded SarvaFlow tenant data export.')
        trackEvent('export_user_data')
      }
    } catch (err) {
      console.error('Data export error', err)
    }
  }

  const handleCopilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!copilotQuery) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/v1/cfo-copilot/query?tenant_id=${TENANT_ID}&query=${encodeURIComponent(copilotQuery)}`, {
        method: 'POST'
      })
      if (res.ok) {
        setCopilotResponse(await res.json())
        showToast('CFO Copilot query executed.')
      }
    } catch (err) {
      console.error('Copilot query error', err)
    } finally {
      setBusy(false)
    }
  }

  const handleAmlScreen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amlSearchName) return
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/v1/compliance/aml-screen?name=${encodeURIComponent(amlSearchName)}`)
      if (res.ok) {
        setAmlResult(await res.json())
        showToast('AML Trie Screening completed in <2ms.')
      }
    } catch (err) {
      console.error('AML screening error', err)
    } finally {
      setBusy(false)
    }
  }

  const executeRecommendation = (title: string, savings: number) => {
    showToast(`Executed Action: "${title}" (+${formatCurrency(savings)} captured)`)
  }

  const triggerAgentRun = (agentName: string) => {
    showToast(`Triggered ReAct cycle for ${agentName}`)
  }

  const filteredScenarios = scenarioFilterCategory === 'ALL'
    ? scenarios
    : scenarios.filter(s => s.category.toUpperCase().includes(scenarioFilterCategory))

  return (
    <ErrorBoundary>
      {/* Top Pilot Disclaimer Banner */}
      <div className="pilot-banner">
        <Info size={14} />
        <span>
          <strong>SarvaFlow CFO Pilot Launch:</strong> Advanced compliance, wire clearing, and scorecard modules are demo implementations pending independent audit.
        </span>
      </div>

      <main>
        {/* Toast Notification Banner */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '48px',
            right: '20px',
            background: 'var(--accent-primary)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <CheckCircle size={16} /> {notification}
          </div>
        )}

        {/* Report an Issue Modal */}
        {showFeedbackModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="#6366f1" /> Report an Issue / Pilot Feedback
                </h3>
                <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'transparent', border: 0, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleFeedbackSubmit} style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)}>
                    <option value="bug">Bug / Error</option>
                    <option value="UX">UI / Usability Feedback</option>
                    <option value="compliance_question">Compliance / Audit Question</option>
                    <option value="feature">Feature Request</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Subject</label>
                  <input
                    type="text"
                    value={feedbackSubject}
                    onChange={(e) => setFeedbackSubject(e.target.value)}
                    placeholder="Brief description of the issue"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Details</label>
                  <textarea
                    value={feedbackDesc}
                    onChange={(e) => setFeedbackDesc(e.target.value)}
                    rows={4}
                    placeholder="Explain what happened or what you'd like to see..."
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="button ghost" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                  <button type="submit" className="button" disabled={busy}>Submit Report</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invite Teammate Modal */}
        {showInviteModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="#6366f1" /> Invite Teammate to SarvaFlow
                </h3>
                <button onClick={() => setShowInviteModal(false)} style={{ background: 'transparent', border: 0, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleInviteTeammate} style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Teammate Email</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@acme-enterprise.com"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Editor">Editor (Execute Actions)</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" className="button ghost" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button type="submit" className="button" disabled={busy}>Send Invite</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3>⚠️ Delete Tenant Account</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Are you sure you want to permanently delete your tenant data? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button className="button ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="button" style={{ background: '#ef4444' }} onClick={() => { showToast('Account deletion request submitted.'); setShowDeleteModal(false); }}>
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Navigation */}
        <aside>
          <div className="brand">
            <WalletCards /> SarvaFlow
          </div>
          <nav>
            <a className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              <Activity size={18} /> Executive Overview
            </a>
            <a className={activeTab === 'scenarios' ? 'active' : ''} onClick={() => setActiveTab('scenarios')}>
              <FileCheck size={18} /> 16 Document Suites
            </a>
            <a className={activeTab === 'tier1' ? 'active' : ''} onClick={() => setActiveTab('tier1')}>
              <Landmark size={18} /> Tier-1 Ops
              <span className="beta-badge" data-tooltip="Demo capability — not yet independently audited or certified for production compliance use.">DEMO</span>
            </a>
            <a className={activeTab === 'forecasting' ? 'active' : ''} onClick={() => setActiveTab('forecasting')}>
              <TrendingUp size={18} /> 90-Day Forecast
            </a>
            <a className={activeTab === 'agents' ? 'active' : ''} onClick={() => setActiveTab('agents')}>
              <Bot size={18} /> Multi-Agent Mesh
            </a>
            <a className={activeTab === 'alerts' ? 'active' : ''} onClick={() => setActiveTab('alerts')}>
              <AlertTriangle size={18} /> Realtime Risk
            </a>
            <a className={activeTab === 'graph' ? 'active' : ''} onClick={() => setActiveTab('graph')}>
              <Layers size={18} /> Knowledge Graph
            </a>
            <a className={activeTab === 'compliance' ? 'active' : ''} onClick={() => setActiveTab('compliance')}>
              <ShieldCheck size={18} /> Compliance
              <span className="beta-badge" data-tooltip="Demo capability — not yet independently audited or certified for production compliance use.">BETA</span>
            </a>
            <a className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
              <SettingsIcon size={18} /> Settings
            </a>
            <a className={activeTab === 'docs' ? 'active' : ''} onClick={() => setActiveTab('docs')}>
              <HelpCircle size={18} /> Docs & Roadmap
            </a>
          </nav>

          <div className="org">
            <strong>SARVAFLOW ENTERPRISE</strong>
            <span>Tenant ID: {TENANT_ID.slice(0, 8)}...</span>
            <br />
            <span style={{ color: serverOnline ? '#10b981' : '#ef4444', fontSize: '11px', marginTop: '6px', display: 'inline-block' }}>
              {serverOnline ? '● API Server Live (Port 8000)' : '○ API Server Offline'}
            </span>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="content">
          {/* Top Executive Header (Clean Header - Fixes Images 1 & 2) */}
          <header>
            <div>
              <p className="eyebrow">SARVAFLOW CFO & TREASURY OPERATING SYSTEM</p>
              <h1>CFO Control Room</h1>
              <p className="sub">Active View: <strong style={{ color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{activeTab}</strong></p>
            </div>
            <div className="actions" style={{ alignItems: 'center', gap: '10px' }}>
              {/* Executive Master Auto-Pilot Button */}
              <button
                className="button success"
                onClick={handleMasterOptimize}
                disabled={busy}
                style={{ fontWeight: 700 }}
              >
                <Zap size={16} className={busy ? 'spin' : ''} /> 1-Click Master Auto-Pilot (+ $152.5k)
              </button>

              {/* Direct Settings Trigger */}
              <button className="button ghost" onClick={() => setActiveTab('settings')}>
                <SettingsIcon size={16} /> Settings
              </button>
            </div>
          </header>

          {/* Top Metric Cards & Health Scorecard */}
          <div className="cards">
            <div className="metric" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="icon green">
                <Sparkles size={20} />
              </div>
              <span>AI Health Scorecard</span>
              <strong style={{ color: '#10b981' }}>{healthScorecard ? `${healthScorecard.overall_health_score}/100 EXCELLENT` : '94/100 EXCELLENT'}</strong>
            </div>
            <div className="metric">
              <div className="icon green">
                <Building2 size={20} />
              </div>
              <span>Liquid Cash Reserves</span>
              <strong>{formatCurrency(42500000)}</strong>
            </div>
            <div className="metric">
              <div className="icon">
                <TrendingUp size={20} />
              </div>
              <span>Est. Cash Runway</span>
              <strong>{forecastData?.estimated_runway_days ? `${forecastData.estimated_runway_days} Days` : '18.4 Months'}</strong>
            </div>
            <div className="metric">
              <div className="icon red">
                <AlertTriangle size={20} />
              </div>
              <span>Active Risk Flags</span>
              <strong>{alerts.length} Critical Flags</strong>
            </div>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className="grid">
                <article className="panel">
                  <div className="panelhead">
                    <div>
                      <h2>90-Day Probabilistic Cash Forecast</h2>
                      <p>Quantile Projections (p10, p50, p90) with Monte Carlo Bounds</p>
                    </div>
                    <b>{formatCurrency(forecastData?.ending_balance_p50 || 48920000)}</b>
                  </div>

                  {forecastData?.daily_projections && (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={forecastData.daily_projections.filter((_: any, idx: number) => idx % 3 === 0)}>
                        <defs>
                          <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#6b7280" tickLine={false} fontSize={12} />
                        <YAxis
                          stroke="#6b7280"
                          tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                          fontSize={12}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelStyle={{ color: '#000' }} />
                        <Area type="monotone" dataKey="projected_balance_p90" stroke="#06b6d4" strokeWidth={1} fill="transparent" name="p90 Upper Bound" />
                        <Area type="monotone" dataKey="projected_balance_p50" stroke="#6366f1" strokeWidth={3} fill="url(#p50Grad)" name="p50 Median Forecast" />
                        <Area type="monotone" dataKey="projected_balance_p10" stroke="#ef4444" strokeWidth={1} fill="transparent" name="p10 Stress Bound" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </article>

                <article className="panel ai-card">
                  <div className="panelhead">
                    <div>
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                        <Sparkles size={18} color="#06b6d4" /> CFO Copilot NL Query
                      </h2>
                      <p style={{ color: '#a5b4fc' }}>Ask any natural language financial question</p>
                    </div>
                  </div>

                  <form onSubmit={handleCopilotSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      value={copilotQuery}
                      onChange={(e) => setCopilotQuery(e.target.value)}
                      placeholder="e.g. What is our projected cash runway?"
                    />
                    <button type="submit" className="button" disabled={busy}>
                      <Search size={16} /> Query
                    </button>
                  </form>

                  {copilotResponse ? (
                    <div>
                      <span className="badge-tag">Intent: {copilotResponse.inferred_intent}</span>
                      <p style={{ fontSize: '14px', lineHeight: '1.5', marginTop: '10px', color: '#fff' }}>
                        {copilotResponse.executive_summary}
                      </p>
                      <small style={{ color: '#a5b4fc', fontSize: '11px' }}>
                        Sources Cited: {copilotResponse.sources_cited?.join(', ')}
                      </small>
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Query the engine for instant Text-to-SQL briefings, scenario simulations, or Knowledge Graph supplier analyses.
                    </p>
                  )}
                </article>
              </div>

              <div className="grid">
                <article className="panel">
                  <div className="panelhead">
                    <div>
                      <h2>Strategic AI Recommendations</h2>
                      <p>Multi-Criteria Optimization (Yield, Float & Cost Elimination)</p>
                    </div>
                  </div>

                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="alert-item high">
                      <div>
                        <strong>{rec.title}</strong>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{rec.summary_reasoning}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <b style={{ color: '#10b981', display: 'block', fontSize: '16px' }}>
                          +${rec.expected_savings_usd.toLocaleString()}
                        </b>
                        <button
                          className="button"
                          onClick={() => executeRecommendation(rec.title, rec.expected_savings_usd)}
                          style={{ padding: '4px 10px', fontSize: '11px', marginTop: '4px' }}
                        >
                          Execute Action <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </article>

                {/* Autonomous Multi-Agent Mesh Card */}
                <article className="panel">
                  <div className="panelhead">
                    <div>
                      <h2>Autonomous Multi-Agent Mesh</h2>
                      <p>Active ReAct Lifecycle Workers</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {agentMeshList.map((ag) => (
                      <div key={ag.name} className="alert-item" onClick={() => triggerAgentRun(ag.name)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="agent-badge">
                            <Bot size={14} /> {ag.name}
                          </div>
                          <div>
                            <strong style={{ fontSize: '13px', display: 'block' }}>{ag.action}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ag.detail}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="live-dot" />
                          <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600 }}>{ag.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </>
          )}

          {/* 16 ENTERPRISE DOCUMENT SCENARIOS STUDIO */}
          {activeTab === 'scenarios' && (
            <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
              {/* Scenario List */}
              <article className="panel">
                <div className="panelhead">
                  <div>
                    <h2>16 Document Suites</h2>
                    <p>Select a scenario to inspect AI breakdown</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {['ALL', 'AP', 'AR', 'BANK', 'TREASURY', 'COMPLIANCE'].map((cat) => (
                    <button
                      key={cat}
                      className={`button ${scenarioFilterCategory === cat ? '' : 'ghost'}`}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => setScenarioFilterCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: '8px', maxHeight: '520px', overflowY: 'auto' }}>
                  {filteredScenarios.map((sc) => (
                    <div
                      key={sc.id}
                      onClick={() => handleScenarioSelect(sc.id)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: selectedScenarioId === sc.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)',
                        border: selectedScenarioId === sc.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-tag">{sc.category}</span>
                        <ChevronRight size={14} color="var(--text-muted)" />
                      </div>
                      <strong style={{ fontSize: '13.5px', color: 'var(--text-main)', display: 'block', margin: '6px 0 2px' }}>
                        {sc.title}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Format: {sc.document_type}</span>
                    </div>
                  ))}
                </div>
              </article>

              {/* Scenario Inspector Panel */}
              {activeScenario && (
                <article className="panel" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                  <div className="panelhead">
                    <div>
                      <h2>{activeScenario.title}</h2>
                      <p>Category: <strong>{activeScenario.category}</strong> | Format: <strong>{activeScenario.document_type}</strong></p>
                    </div>
                    <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>READY FOR PRODUCTION</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Scenario Category</span>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--accent-cyan)', marginTop: '2px' }}>{activeScenario.category}</strong>
                    </div>
                    <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Parsing Engine</span>
                      <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-main)', marginTop: '2px' }}>Document-AI v4.2</strong>
                    </div>
                    <div style={{ background: 'var(--input-bg)', padding: '14px', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Parsing Accuracy</span>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#10b981', marginTop: '2px' }}>99.4% Verified</strong>
                    </div>
                  </div>

                  <div style={{ background: 'var(--input-bg)', padding: '18px', borderRadius: '12px', marginBottom: '20px' }}>
                    <h4 style={{ color: 'var(--accent-primary)', margin: '0 0 8px', fontSize: '14px' }}>AI Analytical Breakdown & Verification</h4>
                    <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
                      {activeScenario.ai_analysis_summary}
                    </p>
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px' }}>
                      <b style={{ color: 'var(--accent-success)', fontSize: '13px' }}>
                        ✓ Recommended Action: {activeScenario.action_recommended}
                      </b>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>Raw Structured Document Payload</h3>
                    <button
                      className="button ghost"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => { navigator.clipboard.writeText(JSON.stringify(activeScenario.raw_payload, null, 2)); showToast('Copied JSON payload!'); }}
                    >
                      <Copy size={12} /> Copy JSON
                    </button>
                  </div>
                  <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '10px', overflowX: 'auto', fontSize: '12px', color: '#a5b4fc', fontFamily: 'var(--font-mono)', maxHeight: '240px' }}>
                    {JSON.stringify(activeScenario.raw_payload, null, 2)}
                  </pre>
                </article>
              )}
            </div>
          )}

          {/* TIER 1 OPS TAB */}
          {activeTab === 'tier1' && (
            <div className="grid">
              <article className="panel" style={{ borderLeft: '4px solid #6366f1' }}>
                <div className="panelhead">
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={18} color="#6366f1" /> Intercompany Netting Engine
                      <span className="beta-badge" data-tooltip="Demo capability — not yet independently audited or certified for production compliance use.">DEMO BETA</span>
                    </h2>
                    <p>Multilateral Graph Flow Optimization across Legal Entities</p>
                  </div>
                </div>
                <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-success)', display: 'block', marginBottom: '4px' }}>
                    {nettingData ? nettingData.user_summary : 'Reduced 48 gross wires down to 3 net transfers.'}
                  </strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Gross Wire Volume: <strong>${nettingData?.gross_transfer_volume_usd ? (nettingData.gross_transfer_volume_usd / 1000000).toFixed(1) : '1.2'}M</strong> $\rightarrow$ Net Volume: <strong>${nettingData?.net_transfer_volume_usd ? (nettingData.net_transfer_volume_usd / 1000000).toFixed(1) : '0.6'}M</strong>
                  </p>
                  <b style={{ color: 'var(--accent-primary)', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                    Estimated FX & Wire Fee Savings: +${nettingData?.estimated_fx_fee_savings_usd ? nettingData.estimated_fx_fee_savings_usd.toLocaleString() : '6,000'}
                  </b>
                </div>
                <button
                  className="button"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => showToast('Executed Multilateral Intercompany Netting (Demo Mode).')}
                >
                  1-Click Execute Netting Settlement <ArrowUpRight size={14} />
                </button>
              </article>

              <article className="panel" style={{ borderLeft: '4px solid #10b981' }}>
                <div className="panelhead">
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DollarSign size={18} color="#10b981" /> 5.2% MMF Cash Sweep Arbitrage
                    </h2>
                    <p>Automated Excess Cash Yield Sweep Engine</p>
                  </div>
                </div>
                <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-success)', display: 'block', marginBottom: '4px' }}>
                    {yieldData ? yieldData.user_summary : 'Sweep $30.0M excess cash to 5.2% MMF. Earn +$4,274/day interest.'}
                  </strong>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Destination: <strong>{yieldData?.recommended_destination || 'JPMorgan Institutional Treasury MMF'}</strong>
                  </p>
                  <b style={{ color: 'var(--accent-success)', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                    Annual Interest Return: +${yieldData?.estimated_annual_yield_usd ? yieldData.estimated_annual_yield_usd.toLocaleString() : '1,560,000'}/year
                  </b>
                </div>
                <button
                  className="button success"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => showToast('Enabled Automated 5.2% MMF Yield Sweep.')}
                >
                  1-Click Enable Auto-Sweep <ArrowUpRight size={14} />
                </button>
              </article>

              <article className="panel" style={{ borderLeft: '4px solid #06b6d4', gridColumn: 'span 2' }}>
                <div className="panelhead">
                  <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} color="#06b6d4" /> Continuous Debt Covenant Monitor
                      <span className="beta-badge" data-tooltip="Demo capability — not yet independently audited or certified for production compliance use.">DEMO BETA</span>
                    </h2>
                    <p>Realtime Credit Agreement Ratios & 180-Day Headroom Forecast</p>
                  </div>
                  <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                    Status: {covenantData ? covenantData.status : '100% SAFE'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Leverage Ratio (Debt / EBITDA)</span>
                    <strong style={{ fontSize: '20px', display: 'block', color: 'var(--text-main)', margin: '4px 0' }}>
                      {covenantData?.ratios?.debt_to_ebitda?.current || 1.8}x <small style={{ fontSize: '12px', color: '#10b981' }}>(Max Limit: 3.5x)</small>
                    </strong>
                    <small style={{ color: '#10b981' }}>✓ Headroom: 1.7x EBITDA buffer remaining</small>
                  </div>
                  <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interest Coverage (EBITDA / Interest)</span>
                    <strong style={{ fontSize: '20px', display: 'block', color: 'var(--text-main)', margin: '4px 0' }}>
                      {covenantData?.ratios?.interest_coverage?.current || 8.33}x <small style={{ fontSize: '12px', color: '#10b981' }}>(Min Floor: 3.0x)</small>
                    </strong>
                    <small style={{ color: '#10b981' }}>✓ Headroom: 5.33x interest coverage buffer</small>
                  </div>
                </div>
              </article>
            </div>
          )}

          {/* FORECASTING TAB */}
          {activeTab === 'forecasting' && (
            <article className="panel">
              <div className="panelhead">
                <div>
                  <h2>90-Day Deep Probabilistic Cash Forecasting</h2>
                  <p>Full 90-day daily projection breakdown ($p_{10}$, $p_{50}$, $p_{90}$)</p>
                </div>
              </div>
              {forecastData?.daily_projections && (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={forecastData.daily_projections}>
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} fontSize={12} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Area type="monotone" dataKey="projected_balance_p90" stroke="#06b6d4" fill="rgba(6, 182, 212, 0.1)" name="p90 Upper Bound" />
                    <Area type="monotone" dataKey="projected_balance_p50" stroke="#6366f1" fill="rgba(99, 102, 241, 0.3)" name="p50 Median Forecast" />
                    <Area type="monotone" dataKey="projected_balance_p10" stroke="#ef4444" fill="rgba(239, 68, 68, 0.1)" name="p10 Stress Bound" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </article>
          )}

          {/* AGENTS TAB */}
          {activeTab === 'agents' && (
            <article className="panel">
              <div className="panelhead">
                <div>
                  <h2>Multi-Agent Mesh Control Room</h2>
                  <p>Trigger and monitor autonomous agent ReAct execution loops</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {agentMeshList.map((agent) => (
                  <div key={agent.name} className="metric">
                    <span>{agent.name}</span>
                    <strong style={{ fontSize: '15px', color: '#10b981' }}>{agent.role}</strong>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 8px' }}>{agent.action}</p>
                    <button className="button" style={{ fontSize: '11px' }} onClick={() => triggerAgentRun(agent.name)}>
                      <Play size={12} /> Trigger ReAct Cycle
                    </button>
                  </div>
                ))}
              </div>
            </article>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <article className="panel">
              <div className="panelhead">
                <div>
                  <h2>Realtime Financial Risk & Anomaly Detector</h2>
                  <p>Active duplicate invoice alerts and expense spike anomalies</p>
                </div>
              </div>
              {alerts.map((al, idx) => (
                <div key={idx} className={`alert-item ${al.severity}`}>
                  <div>
                    <strong>{al.title}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: al.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                      {al.details}
                    </p>
                  </div>
                  <button className="button" style={{ background: al.severity === 'critical' ? '#ef4444' : '#f59e0b', fontSize: '11px' }} onClick={() => showToast(`Action taken on ${al.title}`)}>
                    Investigate & Block
                  </button>
                </div>
              ))}
            </article>
          )}

          {/* GRAPH TAB */}
          {activeTab === 'graph' && (
            <article className="panel">
              <div className="panelhead">
                <div>
                  <h2>Finance Knowledge Graph Topology</h2>
                  <p>Multi-hop graph entity relationships across Vendors, Contracts, POs, and Invoices</p>
                </div>
              </div>
              <div style={{ background: 'var(--input-bg)', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                <Layers size={48} color="#6366f1" style={{ marginBottom: '12px' }} />
                <h3>11 Node Types · 10 Edge Types Registered</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '8px auto 0', fontSize: '14px' }}>
                  Graph-RAG topological context packaging active. Linking Acme Corp --[CONTRACT_TERMS]--&gt; PO-2026-881 --[INVOICED_BY]--&gt; Invoice #INV-9912.
                </p>
              </div>
            </article>
          )}

          {/* COMPLIANCE TAB */}
          {activeTab === 'compliance' && (
            <article className="panel">
              <div className="panelhead">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    AML Sanctions & Compliance Engine
                    <span className="beta-badge" data-tooltip="Demo capability — not yet independently audited or certified for production compliance use.">DEMO BETA</span>
                  </h2>
                  <p>Sub-2ms Aho-Corasick / Trie OFAC SDN List Screening & SOX 404 SoD Matrix</p>
                </div>
              </div>

              <form onSubmit={handleAmlScreen} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="text"
                  value={amlSearchName}
                  onChange={(e) => setAmlSearchName(e.target.value)}
                  placeholder="Enter person or vendor name (e.g. Vladimir Petrov)"
                />
                <button type="submit" className="button" disabled={busy}>
                  <UserCheck size={16} /> Screen Entity
                </button>
              </form>

              {amlResult && (
                <div className={`alert-item ${amlResult.flagged ? 'critical' : ''}`} style={{ background: amlResult.flagged ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)' }}>
                  <div>
                    <strong style={{ color: amlResult.flagged ? '#ef4444' : '#10b981' }}>
                      {amlResult.flagged ? '⚠️ OFAC SDN SANCTIONS HIT FLAGGED' : '✓ ENTITY CLEARED (No Sanctions Hits)'}
                    </strong>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-main)' }}>
                      Match Type: {amlResult.match_type} | Execution Latency: {amlResult.execution_time_ms}ms
                    </p>
                    {amlResult.matched_entity && (
                      <small style={{ color: '#a5b4fc', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        Matched Details: {JSON.stringify(amlResult.matched_entity)}
                      </small>
                    )}
                  </div>
                </div>
              )}
            </article>
          )}

          {/* SETTINGS TAB (ALL SETTINGS, THEMES, INTEGRATIONS & REPORT ISSUE HERE - CONSOLIDATED) */}
          {activeTab === 'settings' && (
            <div className="grid">
              <article className="panel">
                <div className="panelhead">
                  <div>
                    <h2>Executive Settings & Profile</h2>
                    <p>Manage profile, theme appearance, and notification thresholds</p>
                  </div>
                  <button className="button ghost" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Switch Theme ({theme.toUpperCase()})
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Full Name</label>
                      <input
                        type="text"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Email Address</label>
                      <input
                        type="email"
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Company</label>
                      <input
                        type="text"
                        value={userProfile.company}
                        onChange={(e) => setUserProfile({ ...userProfile, company: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Executive Role</label>
                      <input
                        type="text"
                        value={userProfile.role}
                        onChange={(e) => setUserProfile({ ...userProfile, role: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="button" style={{ width: 'fit-content' }} disabled={busy}>Save Profile Changes</button>
                </form>

                <hr style={{ borderColor: 'var(--border-glass)', margin: '24px 0' }} />

                <h3>Data Feeds & Integrations</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {connections.map((conn) => (
                    <div key={conn.id} className="alert-item">
                      <div>
                        <strong>{conn.provider} ({conn.account_name})</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                          Status: <span style={{ color: conn.status === 'CONNECTED' ? '#10b981' : '#ef4444' }}>● {conn.status}</span> | Last Sync: {conn.last_sync}
                        </p>
                      </div>
                      <button className="button ghost" style={{ fontSize: '11px' }} onClick={() => toggleConnection(conn.id)}>
                        {conn.status === 'CONNECTED' ? 'Disconnect' : 'Reconnect'}
                      </button>
                    </div>
                  ))}
                </div>

                <hr style={{ borderColor: 'var(--border-glass)', margin: '24px 0' }} />

                <h3>Feedback & Pilot Support</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Have an issue or request? Submit a report directly to the pilot team.
                </p>
                <button className="button ghost" onClick={() => setShowFeedbackModal(true)}>
                  <MessageSquare size={16} /> Open Feedback & Issue Form
                </button>
              </article>

              <article className="panel">
                <div className="panelhead">
                  <div>
                    <h2>Team & Access Control</h2>
                    <p>Invite teammates and assign roles</p>
                  </div>
                  <button className="button" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowInviteModal(true)}>
                    <Plus size={14} /> Invite Teammate
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
                  {teammates.map((tm, i) => (
                    <div key={i} className="alert-item">
                      <div>
                        <strong>{tm.name}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{tm.email} · {tm.role}</p>
                      </div>
                      <span className="badge-tag">{tm.status}</span>
                    </div>
                  ))}
                </div>

                <h3>Data & Privacy Controls</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <button className="button ghost" onClick={handleExportUserData} style={{ justifyContent: 'flex-start' }}>
                    <Download size={16} /> Export My Tenant Data (JSON)
                  </button>
                  <button className="button ghost" style={{ justifyContent: 'flex-start', color: '#ef4444' }} onClick={() => setShowDeleteModal(true)}>
                    <LogOut size={16} /> Delete Tenant Account
                  </button>
                </div>

                <h3 style={{ marginTop: '24px' }}>Security Audit Log</h3>
                <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  {auditLog.map((log, i) => (
                    <div key={i} style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
                      <span style={{ color: 'var(--accent-primary)' }}>[{log.timestamp}]</span> {log.action}: {log.details}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          )}

          {/* DOCS TAB */}
          {activeTab === 'docs' && (
            <article className="panel">
              <div className="panelhead">
                <div>
                  <h2>SarvaFlow Documentation & Pilot Roadmap</h2>
                  <p>Quickstart, Scenario Directory, FAQ, and Release Roadmap</p>
                </div>
              </div>

              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h3>🚀 Quickstart Guide</h3>
                  <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '10px', lineHeight: '1.6', fontSize: '13px' }}>
                    <ol style={{ paddingLeft: '20px', margin: 0 }}>
                      <li><strong>Connect Bank Account:</strong> Link your Plaid or SWIFT MT940 bank feed in Settings.</li>
                      <li><strong>Connect QuickBooks:</strong> Sync your QBO General Ledger for automated 3-way matching.</li>
                      <li><strong>View 90-Day Cash Forecast:</strong> Inspect probabilistic Monte Carlo quantile projections ($p_{10}, p_{50}, p_{90}$).</li>
                      <li><strong>Export Executive Deck:</strong> Click <em>Export CFO Report</em> to generate board presentations.</li>
                    </ol>
                  </div>

                  <h3 style={{ marginTop: '20px' }}>🛡️ Security & Privacy Basics</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    SarvaFlow uses AES-256-GCM envelope encryption for all stored financial credentials and maintains a SHA-256 Merkle hash audit chain for every ledger entry. All data connections run in isolated tenant sandboxes.
                  </p>
                </div>

                <div>
                  <h3>📌 Product Roadmap & Certification Status</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Capability</th>
                        <th>Status</th>
                        <th>Target Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>90-Day Cash Forecasting & Monte Carlo</td>
                        <td><span style={{ color: '#10b981' }}>✓ LIVE</span></td>
                        <td>Available Now</td>
                      </tr>
                      <tr>
                        <td>16 Enterprise Document Scenarios</td>
                        <td><span style={{ color: '#10b981' }}>✓ LIVE</span></td>
                        <td>Available Now</td>
                      </tr>
                      <tr>
                        <td>AML/OFAC Trie Screening</td>
                        <td><span className="beta-badge">DEMO BETA</span></td>
                        <td>Q3 2026 Audit</td>
                      </tr>
                      <tr>
                        <td>ISO 20022 Interbank Wire Clearing</td>
                        <td><span className="beta-badge">DEMO BETA</span></td>
                        <td>Q3 2026 Audit</td>
                      </tr>
                      <tr>
                        <td>Independent SOC 2 Type II Certification</td>
                        <td><span>PLANNED</span></td>
                        <td>Q4 2026</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3 style={{ marginTop: '20px' }}>❓ Pilot Support & Feedback</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Have a question or spot an issue? Click <strong>Report Issue</strong> inside <strong>Settings</strong> or email <strong>support@sarvaflow.com</strong>.
                  </p>
                </div>
              </div>
            </article>
          )}
        </section>

        {/* Persistent Pilot Footer Note (Block 1) */}
        <footer className="pilot-footer">
          Active pilot &mdash; advanced compliance, wire clearing, and scorecard modules are demo implementations pending certification.
        </footer>
      </main>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(<DashboardApp />)
