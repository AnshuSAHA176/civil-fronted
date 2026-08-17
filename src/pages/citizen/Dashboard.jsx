import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertCircle, CheckCircle2, Clock3, FileText, RefreshCw, XCircle } from 'lucide-react'
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { getCitizenDashboard } from '../../features/dashboard/dashboard.api'
import { formatDate, formatStatus, getComplaintDate, getComplaintId, getComplaintTitle, normalizeActivityPoint, normalizeCitizenDashboard, normalizePiePoint } from '../../features/dashboard/dashboard.utils'
import { getApiError } from '../../services/apiClient'
import { useAuth } from '../../features/auth/auth.context'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'

const STATUS_TONES = {
  pending: 'warning',
  assigned: 'info',
  accepted: 'info',
  inspection: 'info',
  in_progress: 'info',
  resolved: 'success',
  closed: 'success',
  rejected: 'danger',
  reopened: 'warning',
}

const chartCells = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#64748b']

function StatCard({ label, value, icon: Icon, tone = 'blue' }) {
  return (
    <article className={`dashboard-stat dashboard-stat-${tone}`}>
      <div className="dashboard-stat-icon"><Icon size={19} strokeWidth={2} /></div>
      <div className="dashboard-stat-copy">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {label && <strong>{label}</strong>}
      <span>{payload[0].value} complaints</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getCitizenDashboard()
      setDashboard(normalizeCitizenDashboard(response.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const pieData = useMemo(() => dashboard?.pieChart.map(normalizePiePoint).filter((item) => item.value > 0) || [], [dashboard])
  const activityData = useMemo(() => dashboard?.monthlyActivity.map(normalizeActivityPoint) || [], [dashboard])
  const recent = dashboard?.recentComplaint
  const recentId = getComplaintId(recent)
  const recentStatus = recent?.status || 'pending'
  const emailName = user?.name || user?.first_name || user?.email?.split('@')[0] || 'there'

  if (loading) {
    return <div className="dashboard-loading"><Spinner /><span>Loading your CivicAI dashboard…</span></div>
  }

  if (error) {
    return (
      <section className="dashboard-page">
        <DashboardHeader name={emailName} />
        <ErrorState title="Unable to load your dashboard" description={error.message} onRetry={loadDashboard} />
      </section>
    )
  }

  if (!dashboard || dashboard.isEmpty) {
    return (
      <section className="dashboard-page">
        <DashboardHeader name={emailName} />
        <EmptyState
          title="No complaints yet"
          description="You haven't reported any civic issues yet. When you create your first complaint, your activity and status summary will appear here."
          action={<Button onClick={() => navigate('/citizen/complaints/new')}>Report an issue</Button>}
        />
      </section>
    )
  }

  return (
    <section className="dashboard-page">
      <DashboardHeader name={emailName} onRefresh={loadDashboard} refreshing={loading} />

      <div className="dashboard-stats" aria-label="Complaint summary">
        <StatCard label="Total complaints" value={dashboard.cards.total} icon={FileText} />
        <StatCard label="Pending" value={dashboard.cards.pending} icon={Clock3} tone="warning" />
        <StatCard label="In progress" value={dashboard.cards.inProgress} icon={Activity} tone="info" />
        <StatCard label="Resolved" value={dashboard.cards.resolved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={dashboard.cards.rejected} icon={XCircle} tone="danger" />
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Activity</p><h2>Monthly complaints</h2></div>
          </div>
          {activityData.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 12, right: 12, left: -20, bottom: 4 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="chart-empty">Monthly activity is not available yet.</div>}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Breakdown</p><h2>Complaint status</h2></div>
          </div>
          {pieData.length ? (
            <div className="pie-layout">
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="78%" paddingAngle={3} strokeWidth={0}>
                      {pieData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={chartCells[index % chartCells.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Complaints']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                {pieData.map((entry, index) => (
                  <div className="legend-row" key={`${entry.name}-${index}`}>
                    <span className="legend-dot" style={{ background: chartCells[index % chartCells.length] }} />
                    <span>{formatStatus(entry.name)}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="chart-empty">Status breakdown is not available yet.</div>}
        </section>

        <section className="dashboard-panel dashboard-panel-wide recent-panel">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Latest</p><h2>Recent complaint</h2></div>
            <Button variant="secondary" onClick={() => navigate('/citizen/complaints')}>View complaints</Button>
          </div>
          {recent ? (
            <button type="button" className="recent-complaint" onClick={() => recentId && navigate(`/citizen/complaints/${recentId}`)} disabled={!recentId}>
              <div className="recent-main">
                <div className="recent-title-row"><h3>{getComplaintTitle(recent)}</h3><Badge tone={STATUS_TONES[recentStatus] || 'neutral'}>{formatStatus(recentStatus)}</Badge></div>
                <p>{recent?.description || 'No description provided.'}</p>
              </div>
              <div className="recent-meta">
                <span>{recentId ? `#${recentId}` : 'Complaint ID unavailable'}</span>
                <span>{formatDate(getComplaintDate(recent))}</span>
              </div>
            </button>
          ) : (
            <div className="recent-empty"><AlertCircle size={18} /><span>No recent complaint is available.</span></div>
          )}
        </section>
      </div>
    </section>
  )
}

function DashboardHeader({ name, onRefresh, refreshing }) {
  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">Citizen dashboard</p>
        <h1>Good to see you, {name}.</h1>
        <p>Track your civic complaints and see how they're progressing.</p>
      </div>
      {onRefresh && <Button variant="secondary" onClick={onRefresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} /> Refresh</Button>}
    </header>
  )
}
