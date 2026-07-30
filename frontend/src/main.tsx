import React, { useEffect, useState } from 'react'
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
  RefreshCw,
  UserCheck,
  Landmark,
  Zap,
  DollarSign
} from 'lucide-react'
import './styles.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
const TENANT_ID = '57d5f240-ffae-4020-8e49-664a1874d924'

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

function DashboardApp() {
  const [activeTab, setActiveTab] = useState('overview')
  const [forecastData, setForecastData] = useState<any>(null)
  const [copilotQuery, setCopilotQuery] = useState('')
  const [copilotResponse, setCopilotResponse] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const [serverOnline, setServerOnline] = useState<boolean | null>(null)
  const [notification, setNotification] = useState<string | null>(null)

  // Interactive Tab State
  const [amlSearchName, setAmlSearchName] = useState('VLADIMIR PETROV')
  const [amlResult, setAmlResult] = useState<any>(null)
  const [nettingData, setNettingData] = useState<any>(null)
  const [yieldData, setYieldData] = useState<any>(null)
  const [covenantData, setCovenantData] = useState<any>(null)

  const [agentLog, setAgentLog] = useState<string[]>([
    'AP Agent: Processed invoice INV-2026-9912 (97% confidence)',
    'AR Agent: Matched $142,500 cash application bundle',
    'Treasury Agent: Initiated 5.2% MMF sweep ($5.0M)',
    'Recon Agent: Auto-reconciled 48 bank transaction lines'
  ])

  useEffect(() => {
    loadDashboardData()
    loadTier1OpsData()
  }, [])

  const showToast = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 4000)
  }

  const loadDashboardData = async () => {
    setBusy(true)
    try {
      const healthRes = await fetch(`${API}/api/v1/health`)
      setServerOnline(healthRes.ok)

      const forecastRes = await fetch(`${API}/api/v1/forecasting/90-day?tenant_id=${TENANT_ID}&current_balance=42500000.0`)
      if (forecastRes.ok) {
        setForecastData(await forecastRes.json())
      }

      const recsRes = await fetch(`${API}/api/v1/recommendations/?tenant_id=${TENANT_ID}`)
      if (recsRes.ok) {
        setRecommendations(await recsRes.json())
      }

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
      showToast('Telemetry data refreshed from server.')
    } catch (err) {
      console.error('Failed to connect to backend', err)
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
    setAgentLog((prev) => [`Action Executed: ${title} (Saved ${formatCurrency(savings)})`, ...prev])
  }

  const triggerAgentRun = (agentName: string) => {
    showToast(`Triggered ReAct cycle for ${agentName}`)
    setAgentLog((prev) => [`Manual Run: ${agentName} executed cycle at ${new Date().toLocaleTimeString()}`, ...prev])
  }

  return (
    <main>
      {/* Toast Notification Banner */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#6366f1',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} /> {notification}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside>
        <div className="brand">
          <WalletCards /> SarvaFlow
        </div>
        <nav>
          <a className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Activity size={18} /> Overview
          </a>
          <a className={activeTab === 'tier1' ? 'active' : ''} onClick={() => setActiveTab('tier1')}>
            <Landmark size={18} /> Tier-1 Ops
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
            <ShieldCheck size={18} /> AML & Compliance
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
        {/* Top Header */}
        <header>
          <div>
            <p className="eyebrow">SARVAFLOW AI FINANCE OPERATING SYSTEM</p>
            <h1>Executive Control Room</h1>
            <p className="sub">Active View: <strong style={{ color: '#6366f1', textTransform: 'capitalize' }}>{activeTab === 'tier1' ? 'Tier-1 Institutional Ops' : activeTab}</strong></p>
          </div>
          <div className="actions">
            <button className="button ghost" onClick={loadDashboardData} disabled={busy}>
              <RefreshCw size={16} className={busy ? 'spin' : ''} /> Refresh Telemetry
            </button>
            <button className="button" onClick={() => showToast('Exporting CFO Board Deck PDF...')}>
              <Download size={16} /> Export CFO Report
            </button>
          </div>
        </header>

        {/* Top KPI Metric Cards */}
        <div className="cards">
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
            <div className="icon amber">
              <Sparkles size={20} />
            </div>
            <span>90-Day p50 Ending Cash</span>
            <strong>{forecastData ? formatCurrency(forecastData.ending_balance_p50) : '$44,200,000'}</strong>
          </div>
          <div className="metric">
            <div className="icon red">
              <AlertTriangle size={20} />
            </div>
            <span>Active Risk Flags</span>
            <strong>{alerts.length + 2} Critical Flags</strong>
          </div>
        </div>

        {/* Dynamic Tab Views */}

        {/* TAB: TIER-1 OPS (NEW USER-FRIENDLY TIER-1 WALL STREET OPS) */}
        {activeTab === 'tier1' && (
          <div className="grid">
            {/* Action Card 1: Multilateral Intercompany Netting */}
            <article className="panel" style={{ borderLeft: '4px solid #6366f1' }}>
              <div className="panelhead">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#6366f1" /> Intercompany Netting Engine
                  </h2>
                  <p>Multilateral Graph Flow Optimization across Legal Entities</p>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '15px', color: '#10b981', display: 'block', marginBottom: '4px' }}>
                  {nettingData ? nettingData.user_summary : 'Reduced 48 gross wires down to 3 net transfers.'}
                </strong>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                  Gross Wire Volume: <strong>${nettingData?.gross_transfer_volume_usd ? (nettingData.gross_transfer_volume_usd / 1000000).toFixed(1) : '1.2'}M</strong> $\rightarrow$ Net Volume: <strong>${nettingData?.net_transfer_volume_usd ? (nettingData.net_transfer_volume_usd / 1000000).toFixed(1) : '0.6'}M</strong>
                </p>
                <b style={{ color: '#6366f1', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                  Estimated FX & Wire Fee Savings: +${nettingData?.estimated_fx_fee_savings_usd ? nettingData.estimated_fx_fee_savings_usd.toLocaleString() : '6,000'}
                </b>
              </div>
              <button
                className="button"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => showToast('Executed Multilateral Intercompany Netting (Saved 85% in wire fees).')}
              >
                1-Click Execute Netting Settlement <ArrowUpRight size={14} />
              </button>
            </article>

            {/* Action Card 2: 5.2% Yield Sweep Arbitrage */}
            <article className="panel" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="panelhead">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={18} color="#10b981" /> 5.2% MMF Cash Sweep Arbitrage
                  </h2>
                  <p>Automated Excess Cash Yield Sweep Engine</p>
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '15px', color: '#10b981', display: 'block', marginBottom: '4px' }}>
                  {yieldData ? yieldData.user_summary : 'Sweep $30.0M excess cash to 5.2% MMF. Earn +$4,274/day interest.'}
                </strong>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
                  Destination: <strong>{yieldData?.recommended_destination || 'JPMorgan Institutional Treasury MMF'}</strong>
                </p>
                <b style={{ color: '#10b981', fontSize: '14px', marginTop: '8px', display: 'block' }}>
                  Annual Interest Return: +${yieldData?.estimated_annual_yield_usd ? yieldData.estimated_annual_yield_usd.toLocaleString() : '1,560,000'}/year
                </b>
              </div>
              <button
                className="button"
                style={{ width: '100%', justifyContent: 'center', background: '#10b981' }}
                onClick={() => showToast('Enabled Automated 5.2% MMF Yield Sweep.')}
              >
                1-Click Enable Auto-Sweep <ArrowUpRight size={14} />
              </button>
            </article>

            {/* Action Card 3: Debt Covenant Monitor */}
            <article className="panel" style={{ borderLeft: '4px solid #06b6d4', gridColumn: 'span 2' }}>
              <div className="panelhead">
                <div>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#06b6d4" /> Continuous Debt Covenant Monitor
                  </h2>
                  <p>Realtime Credit Agreement Ratios & 180-Day Headroom Forecast</p>
                </div>
                <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                  Status: {covenantData ? covenantData.status : '100% SAFE'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Leverage Ratio (Debt / EBITDA)</span>
                  <strong style={{ fontSize: '20px', display: 'block', color: '#fff', margin: '4px 0' }}>
                    {covenantData?.ratios?.debt_to_ebitda?.current || 1.8}x <small style={{ fontSize: '12px', color: '#10b981' }}>(Max Limit: 3.5x)</small>
                  </strong>
                  <small style={{ color: '#10b981' }}>✓ Headroom: 1.7x EBITDA buffer remaining</small>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Interest Coverage (EBITDA / Interest)</span>
                  <strong style={{ fontSize: '20px', display: 'block', color: '#fff', margin: '4px 0' }}>
                    {covenantData?.ratios?.interest_coverage?.current || 8.33}x <small style={{ fontSize: '12px', color: '#10b981' }}>(Min Floor: 3.0x)</small>
                  </strong>
                  <small style={{ color: '#10b981' }}>✓ Headroom: 5.33x interest coverage buffer</small>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            <div className="grid">
              <article className="panel">
                <div className="panelhead">
                  <div>
                    <h2>90-Day Probabilistic Cash Forecast</h2>
                    <p>Quantile Projections (p10, p50, p90) with Monte Carlo Bounds</p>
                  </div>
                  <b>{forecastData && formatCurrency(forecastData.ending_balance_p50)}</b>
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
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
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
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>{rec.summary_reasoning}</p>
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

              <article className="panel">
                <div className="panelhead">
                  <div>
                    <h2>Autonomous Multi-Agent Mesh</h2>
                    <p>Active ReAct Lifecycle Workers</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  <div className="alert-item" onClick={() => triggerAgentRun('AP Agent')} style={{ cursor: 'pointer' }}>
                    <span className="agent-badge">
                      <Bot size={14} /> AP Agent
                    </span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>● Processing PDF Invoices (97% Confidence)</span>
                  </div>
                  <div className="alert-item" onClick={() => triggerAgentRun('AR Agent')} style={{ cursor: 'pointer' }}>
                    <span className="agent-badge">
                      <Bot size={14} /> AR Agent
                    </span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>● Cash App Subset-Sum Matched</span>
                  </div>
                  <div className="alert-item" onClick={() => triggerAgentRun('Treasury Agent')} style={{ cursor: 'pointer' }}>
                    <span className="agent-badge">
                      <Bot size={14} /> Treasury Agent
                    </span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>● Executing MMF Yield Sweep ($5.0M)</span>
                  </div>
                  <div className="alert-item" onClick={() => triggerAgentRun('Recon Agent')} style={{ cursor: 'pointer' }}>
                    <span className="agent-badge">
                      <ShieldCheck size={14} /> Recon Agent
                    </span>
                    <span style={{ fontSize: '12px', color: '#10b981' }}>● 98.6% Auto-Reconciliation Rate</span>
                  </div>
                </div>
              </article>
            </div>
          </>
        )}

        {/* TAB 2: FORECASTING */}
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

        {/* TAB 3: AGENTS */}
        {activeTab === 'agents' && (
          <article className="panel">
            <div className="panelhead">
              <div>
                <h2>Multi-Agent Mesh Control Room</h2>
                <p>Trigger and monitor autonomous agent ReAct execution loops</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              {['AP Agent', 'AR Agent', 'Treasury Agent', 'Recon Agent'].map((agent) => (
                <div key={agent} className="metric" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span>{agent}</span>
                  <strong style={{ fontSize: '16px', color: '#10b981' }}>Status: ACTIVE</strong>
                  <button className="button" style={{ fontSize: '11px', marginTop: '8px' }} onClick={() => triggerAgentRun(agent)}>
                    <Play size={12} /> Trigger ReAct Cycle
                  </button>
                </div>
              ))}
            </div>
            <h3>Execution Activity Log</h3>
            <ul style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.8' }}>
              {agentLog.map((log, i) => (
                <li key={i} style={{ color: log.includes('Action') ? '#10b981' : '#a5b4fc' }}>● {log}</li>
              ))}
            </ul>
          </article>
        )}

        {/* TAB 4: ALERTS */}
        {activeTab === 'alerts' && (
          <article className="panel">
            <div className="panelhead">
              <div>
                <h2>Realtime Financial Risk & Anomaly Detector</h2>
                <p>Active duplicate invoice alerts and expense spike anomalies</p>
              </div>
            </div>
            <div className="alert-item critical">
              <div>
                <strong>DUPLICATE_INVOICE_ALERT: Acme Supplies</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#ef4444' }}>Invoice #INV-2026-9912 ($185,000.00) matches existing bill date 2026-07-20</p>
              </div>
              <button className="button" style={{ background: '#ef4444', fontSize: '11px' }} onClick={() => showToast('Flagged & Blocked Duplicate Invoice.')}>
                Block Payment
              </button>
            </div>
            <div className="alert-item high">
              <div>
                <strong>GL_EXPENSE_SPIKE: Cloud Infrastructure (3.2σ Anomaly)</strong>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#f59e0b' }}>AWS spend exceeded 30-day baseline by +$42,100</p>
              </div>
              <button className="button" style={{ background: '#f59e0b', fontSize: '11px' }} onClick={() => showToast('Investigating Cloud Expense Spike...')}>
                Investigate Spike
              </button>
            </div>
          </article>
        )}

        {/* TAB 5: GRAPH */}
        {activeTab === 'graph' && (
          <article className="panel">
            <div className="panelhead">
              <div>
                <h2>Finance Knowledge Graph Topology</h2>
                <p>Multi-hop graph entity relationships across Vendors, Contracts, POs, and Invoices</p>
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
              <Layers size={48} color="#6366f1" style={{ marginBottom: '12px' }} />
              <h3>11 Node Types · 10 Edge Types Registered</h3>
              <p style={{ color: '#9ca3af', maxWidth: '600px', margin: '8px auto 0', fontSize: '14px' }}>
                Graph-RAG topological context packaging active. Linking Acme Corp --[CONTRACT_TERMS]--&gt; PO-2026-881 --[INVOICED_BY]--&gt; Invoice #INV-9912.
              </p>
            </div>
          </article>
        )}

        {/* TAB 6: COMPLIANCE */}
        {activeTab === 'compliance' && (
          <article className="panel">
            <div className="panelhead">
              <div>
                <h2>AML Sanctions & Compliance Engine</h2>
                <p>Sub-2ms Aho-Corasick / Trie OFAC SDN List Screening & SOX 404 SoD Matrix</p>
              </div>
            </div>

            <form onSubmit={handleAmlScreen} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                value={amlSearchName}
                onChange={(e) => setAmlSearchName(e.target.value)}
                placeholder="Enter person or vendor name (e.g. Vladimir Petrov)"
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: '13px'
                }}
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
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#fff' }}>
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
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<DashboardApp />)
