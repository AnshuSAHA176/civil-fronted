import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

import { Badge } from '../../components/common/Badge'
import { Button } from '../../components/common/Button'
import LikeButton from '../../components/complaint/LikeButton'
import { ErrorState } from '../../components/common/ErrorState'
import { Spinner } from '../../components/common/Spinner'

import { getApiError } from '../../services/apiClient'

import {
  getCitizenComplaintDetails,
  getCitizenLikedComplaints,
  toggleComplaintLike,
} from '../../features/complaints/complaints.api'

import {
  formatConfidence,
  formatDateTime,
  formatPriority,
  formatStatus,
  mediaUrl,
  normalizeComplaintDetails,
  normalizeLikeToggleResponse,
  normalizeLikedComplaints,
  PRIORITY_TONES,
  STATUS_TONES,
} from '../../features/complaints/complaints.utils'


function DetailItem({ label, value, icon: Icon }) {
  return (
    <div className="complaint-detail-item">
      <div className="complaint-detail-item-label">
        {Icon && <Icon size={15} aria-hidden="true" />}
        <span>{label}</span>
      </div>

      <strong>{value || 'Not available'}</strong>
    </div>
  )
}


function LifecycleRow({ label, value, active }) {
  return (
    <div
      className={`complaint-lifecycle-row${
        active ? ' is-active' : ''
      }`}
    >
      <span
        className="complaint-lifecycle-dot"
        aria-hidden="true"
      />

      <div>
        <strong>{label}</strong>

        <span>
          {value ? formatDateTime(value) : 'Not reached'}
        </span>
      </div>
    </div>
  )
}


export default function ComplaintDetails() {
  const { complaintId } = useParams()
  const navigate = useNavigate()

  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeLoading, setLikeLoading] = useState(false)
  const [likeError, setLikeError] = useState(null)


  const loadComplaint = useCallback(async () => {
    if (!complaintId) return

    setLoading(true)
    setError(null)

    try {
      const [
        detailsResponse,
        likesResponse,
      ] = await Promise.all([
        getCitizenComplaintDetails(complaintId),
        getCitizenLikedComplaints(),
      ])

      const details = normalizeComplaintDetails(
        detailsResponse.data
      )

      const likedComplaints = normalizeLikedComplaints(
        likesResponse.data
      )

      const currentId = String(
        details?.complaint_id || complaintId
      )

      const likedItem = likedComplaints.find(
        (item) =>
          String(
            item?.complaint_id || item?.id
          ) === currentId
      )

      const isLiked = Boolean(likedItem)

      setComplaint(details)
      setLiked(isLiked)

      setLikeCount(
        Number(
          likedItem?.like_count ??
          details?.like_count ??
          details?.vote_count ??
          0
        ) || 0
      )
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [complaintId])


  useEffect(() => {
    loadComplaint()
  }, [loadComplaint])


  /*
   * Backend currently returns:
   *
   * images: [
   *   "http://res.cloudinary.com/..."
   * ]
   *
   * This also supports:
   *
   * images: [
   *   {
   *     image: "http://res.cloudinary.com/..."
   *   }
   * ]
   */
  const images = useMemo(() => {
    if (!Array.isArray(complaint?.images)) {
      return []
    }

    return complaint.images
      .map((item) => {
        if (typeof item === 'string') {
          return item
        }

        if (
          item &&
          typeof item === 'object' &&
          typeof item.image === 'string'
        ) {
          return item.image
        }

        return ''
      })
      .filter(Boolean)
  }, [complaint])


  if (loading) {
    return (
      <div className="complaint-details-loading">
        <Spinner />
        <span>Loading complaint details…</span>
      </div>
    )
  }


  if (error || !complaint) {
    return (
      <section className="complaint-details-page">
        <Button
          variant="ghost"
          onClick={() => navigate('/citizen/complaints')}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to complaints
        </Button>

        <ErrorState
          title="Unable to load this complaint"
          description={
            error?.message ||
            'The complaint details are unavailable.'
          }
          onRetry={loadComplaint}
        />
      </section>
    )
  }


  const status = complaint.status || 'pending'
  const priority = complaint.priority || ''

  const isResolved = [
    'resolved',
    'closed',
  ].includes(status)

  const assigned = Boolean(
    complaint.assigned_officer
  )


  const handleLike = async () => {
    if (!complaintId || likeLoading) return

    setLikeLoading(true)
    setLikeError(null)

    try {
      const response =
        await toggleComplaintLike(complaintId)

      const result =
        normalizeLikeToggleResponse(
          response.data,
          liked
        )

      setLiked(result.liked)

      if (result.likeCount !== null) {
        setLikeCount(result.likeCount)
      }
    } catch (requestError) {
      setLikeError(getApiError(requestError))
    } finally {
      setLikeLoading(false)
    }
  }


  return (
    <section className="complaint-details-page">

      {/* Navigation */}

      <div className="complaint-details-navigation">

        <Button
          variant="ghost"
          onClick={() =>
            navigate('/citizen/complaints')
          }
        >
          <ArrowLeft
            size={17}
            aria-hidden="true"
          />

          Back to complaints
        </Button>


        <div className="complaint-details-navigation-actions">

          <Button
            variant="secondary"
            onClick={() =>
              navigate(
                `/citizen/complaints/${encodeURIComponent(
                  complaintId
                )}/comments`
              )
            }
          >
            Comments
          </Button>


          <Button
            variant="secondary"
            onClick={() =>
              navigate(
                `/citizen/complaints/${encodeURIComponent(
                  complaintId
                )}/history`
              )
            }
          >
            View history
          </Button>


          {isResolved &&
            complaint.citizen_rating == null &&
            !complaint.citizen_feedback && (

              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `/citizen/complaints/${encodeURIComponent(
                      complaintId
                    )}/feedback`
                  )
                }
              >
                Give feedback
              </Button>

            )}

        </div>
      </div>


      {/* Header */}

      <header className="complaint-details-header">

        <div>

          <p className="eyebrow">
            Complaint details
          </p>

          <p className="complaint-details-id">
            #{complaint.complaint_id || complaintId}
          </p>

          <h1>
            {complaint.title ||
              'Untitled complaint'}
          </h1>

          <p>
            Submitted{' '}
            {formatDateTime(
              complaint.created_at ||
              complaint.reported_at
            )}
          </p>

        </div>


        <div className="complaint-details-header-actions">

          <div className="complaint-details-badges">

            <Badge
              tone={
                STATUS_TONES[status] ||
                'neutral'
              }
            >
              {formatStatus(status)}
            </Badge>


            {priority && (
              <Badge
                tone={
                  PRIORITY_TONES[priority] ||
                  'neutral'
                }
              >
                {formatPriority(priority)}
                {' '}priority
              </Badge>
            )}

          </div>


          <LikeButton
            liked={liked}
            count={likeCount}
            loading={likeLoading}
            onClick={handleLike}
          />


          {likeError && (
            <p
              className="complaint-like-error"
              role="alert"
            >
              {likeError.message}
            </p>
          )}

        </div>

      </header>


      <div className="complaint-details-grid">

        <main className="complaint-details-main">

          {/* Description */}

          <section className="detail-panel">

            <div className="detail-panel-heading">

              <div>

                <p className="eyebrow">
                  Reported issue
                </p>

                <h2>Description</h2>

              </div>

            </div>


            <p className="complaint-description">
              {complaint.description ||
                'No description provided.'}
            </p>

          </section>


          {/* Evidence */}

          {images.length > 0 && (

            <section className="detail-panel">

              <div className="detail-panel-heading">

                <div>

                  <p className="eyebrow">
                    Evidence
                  </p>

                  <h2>Photos</h2>

                </div>


                <span className="detail-panel-count">

                  <ImageIcon
                    size={15}
                  />

                  {images.length}

                </span>

              </div>


              <div className="complaint-image-grid">

                {images.map((image, index) => {

                  /*
                   * image is now always a URL string.
                   *
                   * mediaUrl() converts:
                   *
                   * http://res.cloudinary.com/...
                   *
                   * into:
                   *
                   * https://res.cloudinary.com/...
                   */

                  const src = mediaUrl(image)

                  if (!src) {
                    return null
                  }


                  return (

                    <a
                      key={`${src}-${index}`}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="complaint-image-link"
                    >

                      <img
                        src={src}
                        alt={`Complaint evidence ${
                          index + 1
                        }`}
                        loading="lazy"
                        onError={(event) => {

                          console.error(
                            'Failed to load complaint image:',
                            src
                          )

                          event.currentTarget.style.display =
                            'none'
                        }}
                      />

                    </a>

                  )

                })}

              </div>

            </section>

          )}


          {/* Progress */}

          <section className="detail-panel">

            <div className="detail-panel-heading">

              <div>

                <p className="eyebrow">
                  Progress
                </p>

                <h2>
                  Complaint lifecycle
                </h2>

              </div>

            </div>


            <div className="complaint-lifecycle">

              <LifecycleRow
                label="Reported"
                value={
                  complaint.reported_at ||
                  complaint.created_at
                }
                active
              />

              <LifecycleRow
                label="Assigned"
                value={complaint.assigned_at}
                active={
                  Boolean(
                    complaint.assigned_at
                  )
                }
              />

              <LifecycleRow
                label="Accepted"
                value={complaint.accepted_at}
                active={
                  Boolean(
                    complaint.accepted_at
                  )
                }
              />

              <LifecycleRow
                label="Expected resolution"
                value={
                  complaint.expected_resolution_date
                }
                active={
                  Boolean(
                    complaint.expected_resolution_date
                  )
                }
              />

              <LifecycleRow
                label="Resolved"
                value={complaint.resolved_at}
                active={
                  Boolean(
                    complaint.resolved_at
                  )
                }
              />

              <LifecycleRow
                label="Closed"
                value={complaint.closed_at}
                active={
                  Boolean(
                    complaint.closed_at
                  )
                }
              />

            </div>

          </section>


          {/* Outcome */}

          {isResolved &&
            (
              complaint.resolution_notes ||
              complaint.citizen_feedback
            ) && (

              <section className="detail-panel">

                <div className="detail-panel-heading">

                  <div>

                    <p className="eyebrow">
                      Outcome
                    </p>

                    <h2>
                      Resolution
                    </h2>

                  </div>


                  <CheckCircle2
                    size={20}
                    aria-hidden="true"
                  />

                </div>


                {complaint.resolution_notes && (

                  <div className="detail-copy-block">

                    <span>
                      Resolution notes
                    </span>

                    <p>
                      {complaint.resolution_notes}
                    </p>

                  </div>

                )}


                {complaint.citizen_feedback && (

                  <div className="detail-copy-block">

                    <span>
                      Your feedback
                    </span>

                    <p>
                      {complaint.citizen_feedback}
                    </p>

                  </div>

                )}

              </section>

            )}

        </main>


        {/* Sidebar */}

        <aside className="complaint-details-sidebar">

          {/* Location */}

          <section className="detail-panel">

            <div className="detail-panel-heading">

              <div>

                <p className="eyebrow">
                  Location
                </p>

                <h2>
                  Where it happened
                </h2>

              </div>


              <MapPin
                size={20}
                aria-hidden="true"
              />

            </div>


            <div className="detail-copy-block">

              <span>
                Address
              </span>

              <p>
                {complaint.address ||
                  'Not provided'}
              </p>

            </div>


            {complaint.landmark && (

              <div className="detail-copy-block">

                <span>
                  Landmark
                </span>

                <p>
                  {complaint.landmark}
                </p>

              </div>

            )}


            {complaint.latitude !== null &&
              complaint.latitude !== undefined && (

                <div className="detail-coordinates">

                  <span>
                    Latitude
                  </span>

                  <strong>
                    {complaint.latitude}
                  </strong>


                  <span>
                    Longitude
                  </span>

                  <strong>
                    {complaint.longitude ??
                      'Not available'}
                  </strong>

                </div>

              )}

          </section>


          {/* Assignment */}

          <section className="detail-panel">

            <div className="detail-panel-heading">

              <div>

                <p className="eyebrow">
                  Assignment
                </p>

                <h2>
                  Responsible team
                </h2>

              </div>


              <UserRound
                size={20}
                aria-hidden="true"
              />

            </div>


            <DetailItem
              label="Department"
              value={
                complaint.department
                  ? 'Assigned'
                  : 'Not assigned'
              }
              icon={ShieldCheck}
            />


            <DetailItem
              label="Officer"
              value={
                assigned
                  ? 'Assigned officer'
                  : 'Not assigned'
              }
              icon={UserRound}
            />

          </section>


          {/* AI Analysis */}

          <section className="detail-panel">

            <div className="detail-panel-heading">

              <div>

                <p className="eyebrow">
                  CivicAI analysis
                </p>

                <h2>
                  AI assessment
                </h2>

              </div>


              <ShieldCheck
                size={20}
                aria-hidden="true"
              />

            </div>


            <DetailItem
              label="Category"
              value={
                complaint.category
                  ? formatStatus(
                      complaint.category
                    )
                  : 'Not available'
              }
            />


            <DetailItem
              label="Priority"
              value={
                priority
                  ? formatPriority(priority)
                  : 'Not available'
              }
            />


            <DetailItem
              label="AI confidence"
              value={formatConfidence(
                complaint.ai_confidence
              )}
            />


            {complaint.ai_summary && (

              <div className="detail-copy-block">

                <span>
                  AI summary
                </span>

                <p>
                  {complaint.ai_summary}
                </p>

              </div>

            )}

          </section>


          {/* Record */}

          <section className="detail-panel">

            <div className="detail-panel-heading">

              <div>

                <p className="eyebrow">
                  Record
                </p>

                <h2>
                  Activity
                </h2>

              </div>


              <CalendarDays
                size={20}
                aria-hidden="true"
              />

            </div>


            <DetailItem
              label="Created"
              value={formatDateTime(
                complaint.created_at
              )}
              icon={Clock3}
            />


            <DetailItem
              label="Last updated"
              value={formatDateTime(
                complaint.updated_at
              )}
              icon={Clock3}
            />


            <DetailItem
              label="Community votes"
              value={String(
                complaint.vote_count ?? 0
              )}
            />


            <DetailItem
              label="Duplicate report"
              value={
                complaint.is_duplicate
                  ? 'Yes'
                  : 'No'
              }
            />

          </section>

        </aside>

      </div>

    </section>
  )
}