import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, MessageSquareText, Star } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../../components/common/Alert'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { Textarea } from '../../components/common/Textarea'
import { getApiError } from '../../services/apiClient'
import { getCitizenComplaintDetails, submitComplaintFeedback } from '../../features/complaints/complaints.api'
import { formatStatus, formatDateTime, normalizeComplaintDetails, STATUS_TONES } from '../../features/complaints/complaints.utils'
import { Badge } from '../../components/common/Badge'

const MAX_FEEDBACK_LENGTH = 2000
const VALID_FEEDBACK_STATUSES = new Set(['resolved', 'closed'])

function normalizeRating(value) {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= 1 && numeric <= 5 ? numeric : null
}

function RatingPicker({ value, onChange, disabled }) {
  return (
    <fieldset className="feedback-rating-fieldset">
      <legend>How would you rate the resolution?</legend>
      <div className="feedback-stars" role="radiogroup" aria-label="Resolution rating">
        {[1, 2, 3, 4, 5].map((rating) => {
          const active = rating <= value
          return (
            <button
              key={rating}
              type="button"
              className={`feedback-star${active ? ' is-active' : ''}`}
              aria-label={`${rating} out of 5 stars`}
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(rating)}
            >
              <Star size={28} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
          )
        })}
      </div>
      <p className="feedback-rating-caption">
        {value ? `${value} out of 5` : 'Select a rating'}
      </p>
    </fieldset>
  )
}

export default function ComplaintFeedback() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rating, setRating] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const loadComplaint = async () => {
    if (!complaintId) return
    setLoading(true)
    setError(null)
    try {
      const response = await getCitizenComplaintDetails(complaintId)
      const details = normalizeComplaintDetails(response.data)
      setComplaint(details)
      setRating(normalizeRating(details?.citizen_rating))
      setFeedback(typeof details?.citizen_feedback === 'string' ? details.citizen_feedback : '')
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaint()
  }, [complaintId])

  const status = String(complaint?.status || '').toLowerCase()
  const isEligible = VALID_FEEDBACK_STATUSES.has(status)
  const existingRating = normalizeRating(complaint?.citizen_rating)
  const existingFeedback = typeof complaint?.citizen_feedback === 'string' ? complaint.citizen_feedback.trim() : ''
  const alreadySubmitted = existingRating !== null || existingFeedback.length > 0 || submitted

  const statusMessage = useMemo(() => {
    if (!complaint) return ''
    if (status === 'resolved') return 'Your complaint has been marked resolved. You can rate the resolution below.'
    if (status === 'closed') return 'This complaint is closed. You can rate the resolution below.'
    return `Feedback becomes available after the complaint is resolved or closed. Current status: ${formatStatus(status)}.`
  }, [complaint, status])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldError('')
    setSubmitError(null)

    if (!rating) {
      setFieldError('Please select a rating from 1 to 5 stars.')
      return
    }
    if (feedback.length > MAX_FEEDBACK_LENGTH) {
      setFieldError(`Feedback must be ${MAX_FEEDBACK_LENGTH} characters or fewer.`)
      return
    }

    setSubmitting(true)
    try {
      const response = await submitComplaintFeedback(complaintId, {
        citizen_rating: rating,
        citizen_feedback: feedback.trim(),
      })
      const updated = normalizeComplaintDetails(response.data)
      if (updated) {
        setComplaint((current) => ({ ...current, ...updated }))
        setRating(normalizeRating(updated.citizen_rating) ?? rating)
        setFeedback(typeof updated.citizen_feedback === 'string' ? updated.citizen_feedback : feedback.trim())
      }
      setSubmitted(true)
    } catch (requestError) {
      setSubmitError(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="complaint-details-loading">
        <Spinner />
        <span>Loading feedback details…</span>
      </div>
    )
  }

  if (error || !complaint) {
    return (
      <section className="complaint-feedback-page">
        <Button variant="ghost" onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(complaintId)}`)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to complaint
        </Button>
        <ErrorState
          title="Unable to load feedback"
          description={error?.message || 'The complaint details are unavailable.'}
          onRetry={loadComplaint}
        />
      </section>
    )
  }

  return (
    <section className="complaint-feedback-page">
      <div className="complaint-details-navigation">
        <Button variant="ghost" onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(complaintId)}`)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to complaint
        </Button>
      </div>

      <header className="complaint-feedback-header">
        <div>
          <p className="eyebrow">Complaint feedback</p>
          <p className="complaint-details-id">#{complaint.complaint_id || complaintId}</p>
          <h1>How was the resolution?</h1>
          <p>{complaint.title || 'Your complaint'}</p>
        </div>
        <Badge tone={STATUS_TONES[status] || 'neutral'}>{formatStatus(status)}</Badge>
      </header>

      <div className="complaint-feedback-content">
        <section className="detail-panel">
          <div className="detail-panel-heading">
            <div>
              <p className="eyebrow">Resolution status</p>
              <h2>{isEligible ? 'Your feedback is available' : 'Feedback is not available yet'}</h2>
            </div>
            {isEligible ? <CheckCircle2 size={20} aria-hidden="true" /> : <MessageSquareText size={20} aria-hidden="true" />}
          </div>
          <p className="complaint-feedback-status-message">{statusMessage}</p>
          {complaint.resolved_at && <p className="complaint-feedback-meta">Resolved {formatDateTime(complaint.resolved_at)}</p>}
        </section>

        {alreadySubmitted ? (
          <section className="detail-panel">
            <div className="detail-panel-heading">
              <div>
                <p className="eyebrow">Submitted feedback</p>
                <h2>Thank you for your feedback</h2>
              </div>
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <RatingPicker value={rating || existingRating || 0} onChange={() => {}} disabled />
            {feedback.trim() && (
              <div className="detail-copy-block">
                <span>Your comment</span>
                <p>{feedback}</p>
              </div>
            )}
            <p className="complaint-feedback-meta">Feedback can only be submitted once for a complaint.</p>
          </section>
        ) : isEligible ? (
          <form className="detail-panel complaint-feedback-form" onSubmit={handleSubmit} noValidate>
            <div className="detail-panel-heading">
              <div>
                <p className="eyebrow">Your experience</p>
                <h2>Rate the resolution</h2>
              </div>
            </div>

            <RatingPicker value={rating || 0} onChange={setRating} disabled={submitting} />

            <Textarea
              id="citizen-feedback"
              label="Additional feedback (optional)"
              value={feedback}
              maxLength={MAX_FEEDBACK_LENGTH}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Tell us what went well or what could be improved."
              error={fieldError}
              disabled={submitting}
            />

            <div className="complaint-feedback-form-footer">
              <span>{feedback.length}/{MAX_FEEDBACK_LENGTH}</span>
              <Button type="submit" loading={submitting}>
                Submit feedback
              </Button>
            </div>

            {submitError && <Alert>{submitError.message}</Alert>}
          </form>
        ) : (
          <section className="detail-panel">
            <div className="complaint-feedback-unavailable">
              <MessageSquareText size={24} aria-hidden="true" />
              <div>
                <h2>Not ready for feedback</h2>
                <p>Once the complaint is resolved or closed, you will be able to rate the resolution and leave feedback.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </section>
  )
}
