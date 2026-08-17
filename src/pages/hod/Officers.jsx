import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, UserPlus, UserRound } from 'lucide-react'
import { assignOfficerToDepartment, getHodOfficers } from '../../features/hod/officers.api'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Badge } from '../../components/common/Badge'
import { Alert } from '../../components/common/Alert'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { getApiError } from '../../services/apiClient'

function displayStatus(inWork) {
  return inWork ? 'Busy' : 'Available'
}

export default function Officers() {
  const [officers, setOfficers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [employeeId, setEmployeeId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')
  const [assignSuccess, setAssignSuccess] = useState('')

  const handleAssign = async (event) => {
    event.preventDefault()
    const trimmed = employeeId.trim()
    if (!trimmed) return

    setAssignError('')
    setAssignSuccess('')
    setAssigning(true)
    try {
      await assignOfficerToDepartment(trimmed)
      setAssignSuccess('Officer added to your department.')
      setEmployeeId('')
      await load()
    } catch (requestError) {
      setAssignError(getApiError(requestError).message)
    } finally {
      setAssigning(false)
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getHodOfficers()
      const data = response?.data
      setOfficers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Unable to load officers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return officers
    return officers.filter((officer) =>
      [officer.email, officer.designation, officer.employee_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
  }, [officers, search])

  return (
    <section className="page-section">
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Department operations</p>
          <h1>Officers</h1>
          <p className="page-subtitle">Officers assigned to your department.</p>
        </div>
        <Button type="button" variant="secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" /> Refresh
        </Button>
      </div>

      <form className="card hod-assign-officer-form" onSubmit={handleAssign}>
        <div className="hod-assign-officer-heading">
          <UserPlus size={18} aria-hidden="true" />
          <div>
            <strong>Add an officer to your department</strong>
            <p className="muted">Enter an officer's employee ID to bring them into your department. They must not already belong to another department.</p>
          </div>
        </div>
        <div className="hod-assign-officer-row">
          <Input
            aria-label="Officer employee ID"
            placeholder="Officer employee ID"
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            disabled={assigning}
            required
          />
          <Button type="submit" loading={assigning} disabled={assigning || !employeeId.trim()}>Add officer</Button>
        </div>
        {assignError && <Alert tone="danger">{assignError}</Alert>}
        {assignSuccess && <Alert tone="success">{assignSuccess}</Alert>}
      </form>

      <div className="filter-bar">
        <div className="search-field">
          <Search size={17} aria-hidden="true" />
          <Input
            aria-label="Search officers"
            placeholder="Search email, designation, or employee ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="center-state"><Spinner /><span>Loading officers…</span></div>
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={officers.length ? 'No matching officers' : 'No officers in this department'}
          description={officers.length ? 'Try changing your search.' : 'Officers belonging to your department will appear here.'}
        />
      ) : (
        <div className="officer-grid">
          {filtered.map((officer) => (
            <article className="officer-card" key={officer.employee_id}>
              <div className="officer-card-head">
                <div className="officer-avatar" aria-hidden="true"><UserRound size={21} /></div>
                <div className="officer-card-identity">
                  <h2>{officer.email || 'Officer'}</h2>
                  <p>{officer.designation || 'Designation not provided'}</p>
                </div>
                <Badge tone={officer.in_work ? 'warning' : 'success'}>
                  {displayStatus(officer.in_work)}
                </Badge>
              </div>

              <dl className="officer-meta">
                <div>
                  <dt>Employee ID</dt>
                  <dd>{officer.employee_id || 'Not available'}</dd>
                </div>
                <div>
                  <dt>Work status</dt>
                  <dd>{officer.in_work ? 'Handling an active complaint' : 'Available for assignment'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
