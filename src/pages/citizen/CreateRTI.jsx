import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText, Upload, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { Input } from '../../components/common/Input'
import { Textarea } from '../../components/common/Textarea'
import { Alert } from '../../components/common/Alert'
import { Spinner } from '../../components/common/Spinner'
import { getCitizenComplaints } from '../../features/complaints/complaints.api'
import { createCitizenRTI } from '../../features/rti.api'
import { getApiError } from '../../services/apiClient'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_DESCRIPTION = 5000

function complaintIdOf(item) {
  return item?.complaint_id ?? item?.id ?? item?.complain_id ?? ''
}

function complaintTitleOf(item) {
  return item?.title ?? item?.complaint_title ?? item?.complain_titile ?? `Complaint ${complaintIdOf(item)}`
}

export default function CreateRTI() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loadingComplaints, setLoadingComplaints] = useState(true)
  const [complaintsError, setComplaintsError] = useState('')
  const [form, setForm] = useState({ complain: '', subject: '', description: '' })
  const [attachment, setAttachment] = useState(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const availableComplaints = useMemo(
    () => complaints.filter((item) => complaintIdOf(item)),
    [complaints],
  )

  const loadComplaints = async () => {
    setLoadingComplaints(true)
    setComplaintsError('')
    try {
      const response = await getCitizenComplaints()
      const data = Array.isArray(response.data) ? response.data : []
      setComplaints(data)
    } catch (requestError) {
      setComplaintsError(getApiError(requestError).message)
    } finally {
      setLoadingComplaints(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleAttachment = (event) => {
    const file = event.target.files?.[0] ?? null
    setAttachmentError('')
    setError('')

    if (!file) {
      setAttachment(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setAttachment(null)
      setAttachmentError('Attachment must be 10 MB or smaller.')
      event.target.value = ''
      return
    }

    setAttachment(file)
  }

  const removeAttachment = () => {
    setAttachment(null)
    setAttachmentError('')
    const input = document.getElementById('rti-attachment')
    if (input) input.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.complain) {
      setError('Select one of your complaints for this RTI request.')
      return
    }

    if (!form.subject.trim()) {
      setError('Subject is required.')
      return
    }

    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }

    if (form.description.trim().length > MAX_DESCRIPTION) {
      setError(`Description must be ${MAX_DESCRIPTION} characters or fewer.`)
      return
    }

    const payload = new FormData()
    payload.append('complain', form.complain)
    payload.append('subject', form.subject.trim())
    payload.append('description', form.description.trim())
    if (attachment) payload.append('attachment', attachment)

    setSubmitting(true)
    try {
      await createCitizenRTI(payload)
      setSuccess('Your RTI request was submitted successfully.')
      setForm({ complain: '', subject: '', description: '' })
      setAttachment(null)
      const input = document.getElementById('rti-attachment')
      if (input) input.value = ''
      window.setTimeout(() => navigate('/citizen/rti'), 700)
    } catch (requestError) {
      setError(getApiError(requestError).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rti-create-page">
      <div className="rti-create-header">
        <div>
          <button className="back-link" type="button" onClick={() => navigate('/citizen/rti')}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to RTI requests
          </button>
          <p className="eyebrow">Right to Information</p>
          <h1>Submit an RTI request</h1>
          <p>File an information request against one of your CivicAI complaints.</p>
        </div>
      </div>

      <div className="rti-create-layout">
        <form className="card rti-create-form" onSubmit={handleSubmit} noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <div className="rti-form-section">
            <div className="rti-form-section-heading">
              <span className="rti-form-step">01</span>
              <div>
                <h2>Choose a complaint</h2>
                <p>The backend associates each RTI with a complaint owned by your account.</p>
              </div>
            </div>

            {loadingComplaints ? (
              <div className="rti-inline-loading"><Spinner /> <span>Loading your complaints…</span></div>
            ) : complaintsError ? (
              <div className="rti-complaints-error">
                <p>{complaintsError}</p>
                <Button type="button" variant="secondary" onClick={loadComplaints}>Try again</Button>
              </div>
            ) : availableComplaints.length === 0 ? (
              <div className="rti-no-complaints">
                <FileText size={20} aria-hidden="true" />
                <div>
                  <strong>No eligible complaints found</strong>
                  <p>Create a complaint first, then you can associate an RTI request with it.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => navigate('/citizen/complaints/new')}>Create complaint</Button>
              </div>
            ) : (
              <label className="field">
                <span className="field-label">Complaint</span>
                <select className="input" name="complain" value={form.complain} onChange={handleChange} disabled={submitting} required>
                  <option value="">Select a complaint</option>
                  {availableComplaints.map((item) => {
                    const id = String(complaintIdOf(item))
                    return <option key={id} value={id}>#{id} — {complaintTitleOf(item)}</option>
                  })}
                </select>
                <span className="field-helper">Only complaints returned by your authenticated complaint endpoint are offered.</span>
              </label>
            )}
          </div>

          <div className="rti-form-section">
            <div className="rti-form-section-heading">
              <span className="rti-form-step">02</span>
              <div>
                <h2>Request details</h2>
                <p>State exactly what information you are requesting.</p>
              </div>
            </div>

            <Input label="Subject" name="subject" value={form.subject} onChange={handleChange} placeholder="Information requested about the complaint" disabled={submitting} required />
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Describe the information you want to receive…" rows={8} disabled={submitting} required />
            <div className="field-character-count">{form.description.length}/{MAX_DESCRIPTION}</div>
          </div>

          <div className="rti-form-section">
            <div className="rti-form-section-heading">
              <span className="rti-form-step">03</span>
              <div>
                <h2>Attachment</h2>
                <p>Attach supporting material if required.</p>
              </div>
            </div>

            <label className="rti-upload-zone" htmlFor="rti-attachment">
              <Upload size={22} aria-hidden="true" />
              <strong>{attachment ? 'Replace attachment' : 'Choose an attachment'}</strong>
              <span>Maximum 10 MB</span>
            </label>
            <input id="rti-attachment" className="sr-only" type="file" onChange={handleAttachment} disabled={submitting} />

            {attachmentError && <p className="field-error">{attachmentError}</p>}

            {attachment && (
              <div className="rti-attachment-row">
                <div>
                  <strong>{attachment.name}</strong>
                  <span>{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button type="button" className="icon-button" onClick={removeAttachment} disabled={submitting} aria-label="Remove attachment">
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="rti-create-footer">
            <p>After submission, the backend creates and manages the RTI request.</p>
            <Button type="submit" disabled={submitting || loadingComplaints || availableComplaints.length === 0}>
              {submitting ? <><Spinner /> Submitting…</> : 'Submit RTI request'}
            </Button>
          </div>
        </form>

        <aside className="card rti-create-side-panel">
          <div className="rti-side-icon"><FileText size={20} aria-hidden="true" /></div>
          <h2>Before you submit</h2>
          <ul>
            <li>Select a complaint that belongs to your account.</li>
            <li>Use a specific subject rather than a broad description.</li>
            <li>Describe the exact information you want disclosed.</li>
            <li>Attach supporting material only when it is useful.</li>
          </ul>
        </aside>
      </div>
    </section>
  )
}
