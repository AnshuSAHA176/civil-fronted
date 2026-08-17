import { useCallback, useEffect, useState } from 'react'
import { Building2, CheckCircle2, Mail, MapPin, Phone, RefreshCw, ShieldCheck } from 'lucide-react'
import { getHodDepartment } from '../../features/hod/department.api'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'

const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function InfoItem({ icon: Icon, label, children }) {
  return <div className="hod-department-info-item"><div className="hod-department-info-icon"><Icon size={17} /></div><div><span>{label}</span><strong>{children || 'Not available'}</strong></div></div>
}

export default function Departments() {
  const [department, setDepartment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getHodDepartment()
      setDepartment(response.data)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="dashboard-loading"><Spinner /><span>Loading department information…</span></div>

  const header = <header className="dashboard-header"><div><p className="eyebrow">Department administration</p><h1>Department information</h1><p>Official information for your department.</p></div><div className="dashboard-header-actions"><Button variant="secondary" onClick={load}><RefreshCw size={16} />Refresh</Button></div></header>

  if (error) return <section className="dashboard-page hod-department-page">{header}<ErrorState title="Unable to load department information" description={error.message} onRetry={load} /></section>
  if (!department) return <section className="dashboard-page hod-department-page">{header}<EmptyState title="Department information is unavailable" description="The backend did not return a department for this account." /></section>

  return <section className="dashboard-page hod-department-page">
    {header}
    <div className="hod-department-hero">
      <div className="hod-department-hero-icon"><Building2 size={28} /></div>
      <div className="hod-department-hero-copy"><p className="eyebrow">Department</p><h2>{department.name}</h2><p>{department.code || 'Department code unavailable'}</p></div>
      <Badge tone={department.is_active ? 'success' : 'danger'}>{department.is_active ? 'Active' : 'Inactive'}</Badge>
    </div>

    <div className="hod-department-grid">
      <section className="dashboard-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Overview</p><h2>About the department</h2></div><Building2 size={20} /></div>
        <p className="hod-department-description">{department.description || 'No department description has been provided.'}</p>
        <div className="hod-department-meta"><span>Created</span><strong>{formatDate(department.created_at)}</strong><span>Last updated</span><strong>{formatDate(department.updated_at)}</strong></div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Contact</p><h2>Official contact</h2></div><Mail size={20} /></div>
        <div className="hod-department-info-list">
          <InfoItem icon={Mail} label="Email">{department.email}</InfoItem>
          <InfoItem icon={Phone} label="Phone">{department.phone_number}</InfoItem>
          <InfoItem icon={MapPin} label="Office address">{department.office_address}</InfoItem>
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Leadership</p><h2>Department head</h2></div><ShieldCheck size={20} /></div>
        <div className="hod-department-head-card"><div className="hod-department-head-avatar"><ShieldCheck size={20} /></div><div><span>Authenticated department head</span><strong>{department.head?.email || 'Not available'}</strong><p>The backend scopes this page to the authenticated department head.</p></div></div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Operational state</p><h2>Department status</h2></div><CheckCircle2 size={20} /></div>
        <div className="hod-department-status"><Badge tone={department.is_active ? 'success' : 'danger'}>{department.is_active ? 'Active department' : 'Inactive department'}</Badge><p>{department.is_active ? 'The department is currently active in CivicAI.' : 'The department is currently marked inactive by the backend.'}</p></div>
      </section>
    </div>
  </section>
}
