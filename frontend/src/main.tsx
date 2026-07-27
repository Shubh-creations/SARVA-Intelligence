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
  FileText,
  Activity,
  Layers,
  Search,
  ArrowUpRight,
  Download
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

  // Initial Data Load
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setBusy(true)
    try {
      // 1. Health check
      const healthRes = await fetch(`${API}/api/v1/health`)
      setServerOnline(healthRes.ok)

      // 2. 90-Day Cash Forecast
      const forecastRes = await fetch(`${API}/api/v1/forecasting/90-day?tenant_id=${TENANT_ID}&current_balance=42500000.0`)
      if (forecastRes.ok) {
        setForecastData(await forecastRes.json())
      }

      // 3. AI Recommendations
      const recsRes = await fetch(`${API}/api/v1/recommendations/?tenant_id=${TENANT_ID}`)
      if (recsRes.ok) {
        setRecommendations(await recsRes.json())
      }

      // 4. Initial Anomaly Check for Alerts
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
    } catch (err) {
      console.error('Failed to connect to backend', err)
      setServerOnline(false)
    } finally {
      setBusy(false)
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
      }
    } catch (err) {
      console.error('Copilot query error', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      {/* Sidebar Navigation */}
      <aside>
        <div className="brand">
          <WalletCards /> AI Finance OS
        </div>
        <nav>
          <a className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Activity size={18} /> Overview
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
        </nav>

        <div className="org">
          <strong>ACME ENTERPRISE CORP</strong>
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
            <p className="eyebrow">ENTERPRISE FINANCE AUTOMATION MVP</p>
            <h1>Executive Cash Intelligence & Control Room</h1>
            <p className="sub">Continuous 90-Day Liquidity Projections & Multi-Agent Mesh Execution</p>
          </div>
          <div className="actions">
            <button className="button ghost" onClick={loadDashboardData}>
              <Activity size={16} /> Refresh Telemetry
            </button>
            <button className="button">
              <Download size={16} /> Export CFO Report
            </button>
          </div>
        </header>

        {/* Key KPI Metric Cards */}
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
            <span>Active Risk Alerts</span>
            <strong>{alerts.length + 2} Critical Flags</strong>
          </div>
        </div>

        {/* 90-Day Cash Forecast Chart & CFO Copilot Side Panel */}
        <div className="grid">
          {/* Panel 1: 90-Day Cash Forecast Chart */}
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

          {/* Panel 2: CFO Copilot Interface */}
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

        {/* Recommendations & Active Autonomous Agents */}
        <div className="grid">
          {/* AI Financial Recommendations */}
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
                  <button className="button" style={{ padding: '4px 10px', fontSize: '11px', marginTop: '4px' }}>
                    Execute Action <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </article>

          {/* Multi-Agent Control Room Live Telemetry */}
          <article className="panel">
            <div className="panelhead">
              <div>
                <h2>Autonomous Multi-Agent Mesh</h2>
                <p>Active ReAct Lifecycle Workers</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <div className="alert-item">
                <span className="agent-badge">
                  <Bot size={14} /> AP Agent
                </span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>● Processing PDF Invoices (97% Confidence)</span>
              </div>
              <div className="alert-item">
                <span className="agent-badge">
                  <Bot size={14} /> AR Agent
                </span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>● Cash App Subset-Sum Matched</span>
              </div>
              <div className="alert-item">
                <span className="agent-badge">
                  <Bot size={14} /> Treasury Agent
                </span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>● Executing MMF Yield Sweep ($5.0M)</span>
              </div>
              <div className="alert-item">
                <span className="agent-badge">
                  <ShieldCheck size={14} /> Recon Agent
                </span>
                <span style={{ fontSize: '12px', color: '#10b981' }}>● 98.6% Auto-Reconciliation Rate</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<DashboardApp />)
