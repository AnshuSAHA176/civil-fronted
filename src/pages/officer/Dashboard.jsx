import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getOfficerDashboard } from '../../features/officer/dashboard.api'
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

const PRIORITY_TONES = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
}

const CATEGORY_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#64748b']

const STATUS_LABELS = {
  pending: 'Pending',
  assigned: 'Assigned',
  accepted: 'Accepted',
  inspection: 'Inspection',
  in_progress: 'In progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  reopened: 'Reopened',
}

const CATEGORY_LABELS = {
  road: 'Road',
  water: 'Water',
  garbage: 'Garbage',
  electricity: 'Electricity',
  sanitation: 'Sanitation',
  street_light: 'Street light',
  other: 'Other',
}

function formatStatus(value) {
  return STATUS_LABELS[value] || String(value || 'Unknown').replace(/_/g, ' ')
}

function formatPriority(value) {
  return String(value || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCategory(value) {
  return CATEGORY_LABELS[value] || String(value || 'Unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function normalizeDashboard(data) {
  return {
    counts: {
      pending: Number(data?.counts?.pending || 0),
      inProgress: Number(data?.counts?.In_Progress || 0),
      resolved: Number(data?.counts?.Resolved || 0),
      rejected: Number(data?.counts?.Rejected || 0),
    },
    monthlyData: Array.isArray(data?.monthly_data) ? data.monthly_data : [],
    urgentComplaints: Array.isArray(data?.urgent_complaints) ? data.urgent_complaints : [],
    recentlyAssigned: data?.recently_assigned || null,
    complaintsByCategory: Array.isArray(data?.complaints_by_category) ? data.complaints_by_category : [],
  }
}

function StatCard({ label, value, icon: Icon, tone }) {
  return (
    <article className={`officer-stat officer-stat-${tone}`}>
      <div className="officer-stat-icon"><Icon size={19} strokeWidth={2} /></div>
      <div className="officer-stat-copy">
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

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getOfficerDashboard()
      setDashboard(normalizeDashboard(response.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const categoryData = useMemo(
    () => dashboard?.complaintsByCategory.map((item) => ({
      name: formatCategory(item.category),
      value: Number(item.total_count || 0),
    })).filter((item) => item.value > 0) || [],
    [dashboard],
  )

  const monthlyData = useMemo(
    () => dashboard?.monthlyData.map((item) => ({
      month: item.month,
      count: Number(item.count || 0),
    })) || [],
    [dashboard],
  )

  const officerName = user?.name || user?.first_name || user?.email?.split('@')[0] || 'Officer'
  const hasAnyComplaint = Object.values(dashboard?.counts || {}).some((value) => value > 0) || Boolean(dashboard?.recentlyAssigned) || dashboard?.urgentComplaints?.length > 0

  if (loading) {
    return <div className="dashboard-loading"><Spinner /><span>Loading your officer dashboard…</span></div>
  }

  if (error) {
    return (
      <section className="dashboard-page officer-dashboard-page">
        <DashboardHeader name={officerName} onRefresh={loadDashboard} refreshing={loading} />
        <ErrorState title="Unable to load your dashboard" description={error.message} onRetry={loadDashboard} />
      </section>
    )
  }

  if (!dashboard || !hasAnyComplaint) {
    return (
      <section className="dashboard-page officer-dashboard-page">
        <DashboardHeader name={officerName} onRefresh={loadDashboard} refreshing={loading} />
        <EmptyState
          title="No assigned complaints yet"
          description="Complaints assigned to you will appear here with their status, urgency, and category breakdown."
        />
      </section>
    )
  }

  return (
    <section className="dashboard-page officer-dashboard-page">
      <DashboardHeader name={officerName} onRefresh={loadDashboard} refreshing={loading} />

      <div className="officer-stats" aria-label="Assigned complaint summary">
        <StatCard label="Pending" value={dashboard.counts.pending} icon={Clock3} tone="warning" />
        <StatCard label="In progress" value={dashboard.counts.inProgress} icon={BarChart3} tone="info" />
        <StatCard label="Resolved" value={dashboard.counts.resolved} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={dashboard.counts.rejected} icon={XCircle} tone="danger" />
      </div>

      <div className="dashboard-grid officer-dashboard-grid">
        <section className="dashboard-panel dashboard-panel-wide">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Workload</p><h2>Monthly assigned complaints</h2></div>
          </div>
          {monthlyData.length ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 12, right: 12, left: -20, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="chart-empty">Monthly assignment activity is not available yet.</div>}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Categories</p><h2>Complaint distribution</h2></div>
          </div>
          {categoryData.length ? (
            <div className="pie-layout">
              <div className="pie-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="78%" paddingAngle={3} strokeWidth={0}>
                      {categoryData.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Complaints']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                {categoryData.map((entry, index) => (
                  <div className="legend-row" key={`${entry.name}-${index}`}>
                    <span className="legend-dot" style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} />
                    <span>{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="chart-empty">Category distribution is not available yet.</div>}
        </section>

        <section className="dashboard-panel dashboard-panel-wide">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Priority queue</p><h2>Urgent complaints</h2></div>
          </div>
          {dashboard.urgentComplaints.length ? (
            <div className="officer-complaint-list">
              {dashboard.urgentComplaints.map((complaint) => (
                <article className="officer-complaint-row" key={complaint.complaint_id}>
                  <div className="officer-complaint-main">
                    <div className="officer-complaint-title-row">
                      <span className="complaint-id">#{complaint.complaint_id}</span>
                      <Badge tone={PRIORITY_TONES[complaint.priority] || 'neutral'}>{formatPriority(complaint.priority)}</Badge>
                      <Badge tone={STATUS_TONES[complaint.status] || 'neutral'}>{formatStatus(complaint.status)}</Badge>
                    </div>
                    <h3>{complaint.title}</h3>
                    <p>{formatDate(complaint.created_at)}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="recent-empty"><AlertCircle size={18} /><span>No urgent complaints are currently assigned.</span></div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><p className="panel-eyebrow">Latest assignment</p><h2>Recently assigned</h2></div>
          </div>
          {dashboard.recentlyAssigned ? (
            <article className="officer-recent-card">
              <div className="officer-recent-icon"><FileText size={18} /></div>
              <span className="complaint-id">#{dashboard.recentlyAssigned.complaint_id}</span>
              <h3>{dashboard.recentlyAssigned.title}</h3>
              <div className="officer-recent-badges">
                <Badge tone={STATUS_TONES[dashboard.recentlyAssigned.status] || 'neutral'}>{formatStatus(dashboard.recentlyAssigned.status)}</Badge>
                <Badge tone={PRIORITY_TONES[dashboard.recentlyAssigned.priority] || 'neutral'}>{formatPriority(dashboard.recentlyAssigned.priority)}</Badge>
              </div>
              <p>{formatDate(dashboard.recentlyAssigned.created_at)}</p>
            </article>
          ) : (
            <div className="recent-empty"><AlertCircle size={18} /><span>No recent assignment is available.</span></div>
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
        <p className="eyebrow">Officer dashboard</p>
        <h1>Good to see you, {name}.</h1>
        <p>Monitor your assigned complaints, workload, and priority queue.</p>
      </div>
      <Button variant="secondary" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
        Refresh
      </Button>
    </header>
  )
}
