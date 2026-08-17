import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, Clock3, FileWarning, RefreshCw, ShieldAlert, Users, XCircle } from 'lucide-react'
import { CartesianGrid, Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getHodDashboard } from '../../features/hod/dashboard.api'
import { getApiError } from '../../services/apiClient'
import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'

const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CATEGORY_COLORS=['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#64748b']
const PRIORITY_TONES={critical:'danger',high:'danger',medium:'warning',low:'neutral'}
const label=v=>String(v||'Unknown').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())
const formatDate=v=>{if(!v)return 'Date unavailable';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat(undefined,{dateStyle:'medium'}).format(d)}

function normalize(data){
  return {
    department:data?.department||null,
    counts:Object.fromEntries(['total','pending','in_progress','resolved','rejected','critical'].map(k=>[k,Number(data?.counts?.[k]||0)])),
    officers:Array.isArray(data?.officer_workload)?data.officer_workload:[],
    overdue:Array.isArray(data?.overdue_complaints)?data.overdue_complaints:[],
    monthly:Array.isArray(data?.monthly_data)?data.monthly_data:[],
    categories:Array.isArray(data?.complaints_by_category)?data.complaints_by_category:[],
  }
}

function Stat({label:statLabel,value,icon:Icon,tone}){
  return <article className={`hod-stat hod-stat-${tone}`}><div className="hod-stat-icon"><Icon size={19}/></div><div><p>{statLabel}</p><strong>{value}</strong></div></article>
}

export default function HodStatistics(){
  const [data,setData]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState(null)

  const load=useCallback(async()=>{
    setLoading(true);setError(null)
    try { const response=await getHodDashboard(); setData(normalize(response.data)) }
    catch (e) { setError(getApiError(e)) }
    finally { setLoading(false) }
  },[])

  useEffect(()=>{load()},[load])

  const monthly=useMemo(()=>data?.monthly.map(item=>({
    month:MONTHS[Number(item.month)-1]||item.month,
    received:Number(item.received||0),
    resolved:Number(item.resolved||0),
  }))||[],[data])

  const categories=useMemo(()=>data?.categories.map(item=>({
    name:label(item.category),
    value:Number(item.count||0),
  })).filter(item=>item.value>0)||[],[data])

  const officers=useMemo(()=>data?.officers.map(item=>({
    email:item.user__email||'Officer',
    active:Number(item.active_complaints||0),
    critical:Number(item.critical_complaints||0),
    resolved:Number(item.resolved||0),
  })).sort((a,b)=>b.active-a.active)||[],[data])

  const resolutionRate=data?.counts.total ? Math.round((data.counts.resolved/data.counts.total)*100) : 0
  const activeCount=data ? data.counts.pending+data.counts.in_progress : 0

  if(loading) return <div className="dashboard-loading"><Spinner/><span>Loading department statistics…</span></div>

  const header=<header className="dashboard-header"><div><p className="eyebrow">Department analytics</p><h1>Statistics</h1><p>{data?.department?.name ? `${data.department.name} · ${data.department.code||'Department'}` : 'Department performance overview.'}</p></div><div className="dashboard-header-actions"><Button variant="secondary" onClick={load}><RefreshCw size={16}/>Refresh</Button></div></header>

  if(error) return <section className="dashboard-page hod-statistics-page">{header}<ErrorState title="Unable to load department statistics" description={error.message} onRetry={load}/></section>
  if(!data) return <section className="dashboard-page hod-statistics-page">{header}<EmptyState title="Statistics are unavailable" description="No department statistics were returned by the backend."/></section>

  return <section className="dashboard-page hod-statistics-page">
    {header}

    <div className="hod-statistics-summary">
      <Stat label="Total complaints" value={data.counts.total} icon={FileWarning} tone="neutral"/>
      <Stat label="Active complaints" value={activeCount} icon={Clock3} tone="warning"/>
      <Stat label="Resolved" value={data.counts.resolved} icon={CheckCircle2} tone="success"/>
      <Stat label="Critical" value={data.counts.critical} icon={ShieldAlert} tone="critical"/>
      <Stat label="Rejected" value={data.counts.rejected} icon={XCircle} tone="danger"/>
      <Stat label="Resolution rate" value={`${resolutionRate}%`} icon={BarChart3} tone="info"/>
    </div>

    <div className="hod-statistics-grid">
      <section className="dashboard-panel hod-statistics-panel hod-statistics-wide">
        <div className="panel-heading"><div><p className="panel-eyebrow">Monthly trend</p><h2>Received vs resolved</h2></div></div>
        {monthly.length ? <div className="hod-stat-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly} margin={{top:10,right:10,left:-10,bottom:0}}><CartesianGrid vertical={false} stroke="#e2e8f0"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip/><Line type="monotone" dataKey="received" name="Received" stroke="#2563eb" strokeWidth={2.5}/><Line type="monotone" dataKey="resolved" name="Resolved" stroke="#16a34a" strokeWidth={2.5}/></LineChart></ResponsiveContainer></div> : <div className="chart-empty">Monthly activity is not available yet.</div>}
      </section>

      <section className="dashboard-panel hod-statistics-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Category mix</p><h2>Complaint distribution</h2></div></div>
        {categories.length ? <div className="hod-stat-pie-layout"><div className="hod-stat-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="78%" paddingAngle={3} strokeWidth={0}>{categories.map((item,index)=><Cell key={`${item.name}-${index}`} fill={CATEGORY_COLORS[index%CATEGORY_COLORS.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="chart-legend">{categories.map((item,index)=><div className="legend-row" key={`${item.name}-${index}`}><span className="legend-dot" style={{background:CATEGORY_COLORS[index%CATEGORY_COLORS.length]}}/><span>{item.name}</span><strong>{item.value}</strong></div>)}</div></div> : <div className="chart-empty">Category data is not available yet.</div>}
      </section>

      <section className="dashboard-panel hod-statistics-panel hod-statistics-wide">
        <div className="panel-heading"><div><p className="panel-eyebrow">Officer workload</p><h2>Active workload by officer</h2></div><Users size={20}/></div>
        {officers.length ? <div className="hod-stat-chart hod-stat-chart-bar"><ResponsiveContainer width="100%" height="100%"><BarChart data={officers} layout="vertical" margin={{top:5,right:20,left:10,bottom:5}}><CartesianGrid horizontal={false} stroke="#e2e8f0"/><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="email" width={150} axisLine={false} tickLine={false} tick={{fontSize:11}}/><Tooltip/><Bar dataKey="active" name="Active complaints" fill="#2563eb" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div> : <div className="chart-empty">No officer workload data is available yet.</div>}
      </section>

      <section className="dashboard-panel hod-statistics-panel">
        <div className="panel-heading"><div><p className="panel-eyebrow">Officer detail</p><h2>Workload breakdown</h2></div></div>
        {officers.length ? <div className="hod-officer-table-wrap"><table className="hod-officer-table"><thead><tr><th>Officer</th><th>Active</th><th>Critical</th><th>Resolved</th></tr></thead><tbody>{officers.map((item,index)=><tr key={`${item.email}-${index}`}><td title={item.email}>{item.email}</td><td>{item.active}</td><td>{item.critical}</td><td>{item.resolved}</td></tr>)}</tbody></table></div> : <div className="chart-empty">No officer data is available yet.</div>}
      </section>

      <section className="dashboard-panel hod-statistics-panel hod-statistics-wide">
        <div className="panel-heading"><div><p className="panel-eyebrow">Operational risk</p><h2>Overdue complaints</h2></div></div>
        {data.overdue.length ? <div className="hod-statistics-overdue">{data.overdue.map(item=><article className="hod-list-item" key={item.complaint_id}><div><span className="complaint-id">#{item.complaint_id}</span><h3>{item.title}</h3><p>{item.officer_email||'Unassigned officer'} · {item.days_overdue} day{item.days_overdue===1?'':'s'} overdue</p></div><Badge tone={PRIORITY_TONES[item.priority]||'neutral'}>{label(item.priority)}</Badge></article>)}</div> : <div className="recent-empty"><CheckCircle2 size={18}/><span>No overdue complaints are currently reported.</span></div>}
      </section>
    </div>
  </section>
}
