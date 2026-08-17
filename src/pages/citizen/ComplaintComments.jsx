import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, MessageCircle, Send, UserRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/common/Button'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'
import { Textarea } from '../../components/common/Textarea'
import { getApiError } from '../../services/apiClient'
import {
  createComplaintComment,
  getCitizenComplaintComments,
  getCitizenComplaintDetails,
} from '../../features/complaints/complaints.api'
import { formatDateTime } from '../../features/complaints/complaints.utils'

function normalizeComments(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export default function ComplaintComments() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const loadComments = useCallback(async () => {
    if (!complaintId) return
    setLoading(true)
    setError(null)
    try {
      const [complaintResponse, commentsResponse] = await Promise.all([
        getCitizenComplaintDetails(complaintId),
        getCitizenComplaintComments(complaintId),
      ])
      setComplaint(complaintResponse.data || null)
      setComments(normalizeComments(commentsResponse.data))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [complaintId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const submitComment = async (event) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) {
      setSubmitError({ message: 'Comment cannot be empty.' })
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await createComplaintComment(complaintId, { text: trimmed })
      if (response.data) {
        setComments((current) => [...current, response.data])
      } else {
        await loadComments()
      }
      setText('')
    } catch (requestError) {
      setSubmitError(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="complaint-comments-loading">
        <Spinner />
        <span>Loading comments…</span>
      </div>
    )
  }

  if (error) {
    return (
      <section className="complaint-comments-page">
        <Button variant="ghost" onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(complaintId)}`)}>
          <ArrowLeft size={17} aria-hidden="true" />
          Back to complaint
        </Button>
        <ErrorState title="Unable to load comments" description={error.message} onRetry={loadComments} />
      </section>
    )
  }

  return (
    <section className="complaint-comments-page">
      <Button variant="ghost" onClick={() => navigate(`/citizen/complaints/${encodeURIComponent(complaintId)}`)}>
        <ArrowLeft size={17} aria-hidden="true" />
        Back to complaint
      </Button>

      <header className="complaint-comments-header">
        <div>
          <p className="eyebrow">Complaint discussion</p>
          <p className="complaint-comments-id">#{complaint?.complaint_id || complaintId}</p>
          <h1>{complaint?.title || 'Comments'}</h1>
          <p>Follow the conversation around this complaint.</p>
        </div>
        <Link className="button button-secondary" to={`/citizen/complaints/${encodeURIComponent(complaintId)}`}>
          View complaint
        </Link>
      </header>

      <div className="complaint-comments-layout">
        <section className="complaint-comments-panel" aria-label="Complaint comments">
          <div className="complaint-comments-panel-heading">
            <div>
              <p className="panel-eyebrow">Discussion</p>
              <h2>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</h2>
            </div>
            <MessageCircle size={20} aria-hidden="true" />
          </div>

          {comments.length === 0 ? (
            <div className="complaint-comments-empty">
              <div className="complaint-comments-empty-icon" aria-hidden="true"><MessageCircle size={22} /></div>
              <h2>No comments yet</h2>
              <p>Be the first to add a useful update or clarification.</p>
            </div>
          ) : (
            <div className="complaint-comments-list">
              {comments.map((comment, index) => (
                <article className="complaint-comment" key={comment?.id || `${comment?.created_at || 'comment'}-${index}`}>
                  <div className="complaint-comment-avatar" aria-hidden="true"><UserRound size={17} /></div>
                  <div className="complaint-comment-body">
                    <div className="complaint-comment-meta">
                      <strong>{comment?.email || 'CivicAI user'}</strong>
                      <time dateTime={comment?.created_at || undefined}>{formatDateTime(comment?.created_at)}</time>
                    </div>
                    <p>{comment?.text || ''}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="complaint-comments-composer-panel">
          <div>
            <p className="panel-eyebrow">Add an update</p>
            <h2>Leave a comment</h2>
            <p className="complaint-comments-helper">Keep the discussion focused on useful information about this complaint.</p>
          </div>

          <form onSubmit={submitComment} className="complaint-comment-form">
            <Textarea
              id="complaint-comment"
              label="Comment"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Share an update or clarification…"
              rows={6}
              maxLength={2000}
              error={submitError?.message}
              disabled={submitting}
            />
            <div className="complaint-comment-form-footer">
              <span>{text.length}/2000</span>
              <Button type="submit" loading={submitting} disabled={!text.trim()}>
                <Send size={16} aria-hidden="true" />
                Comment
              </Button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  )
}
