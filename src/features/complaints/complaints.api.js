import { apiClient } from '../../services/apiClient'

// The public /complain/ endpoint returns every complaint. For a citizen's
// private complaint history we use the authenticated agent/list endpoint,
// which filters by the current user's role on the backend.
export const getCitizenComplaints = () => apiClient.get('/complain/agent/list/')

export const getCitizenComplaintDetails = (complaintId) => (
  apiClient.get(`/complain/agent/details/${encodeURIComponent(complaintId)}/`)
)

export const getCitizenComplaintHistory = (complaintId) => (
  apiClient.get(`/complain/agent/history/${encodeURIComponent(complaintId)}/`)
)

export const getCitizenComplaintComments = (complaintId) => (
  apiClient.get(`/complain/comment_view/${encodeURIComponent(complaintId)}/`)
)

export const createComplaintComment = (complaintId, payload) => (
  apiClient.post(`/complain/comment/${encodeURIComponent(complaintId)}/`, payload)
)

// The backend uses one POST endpoint as a like/unlike toggle.
export const toggleComplaintLike = (complaintId) => (
  apiClient.post(`/complain/like/${encodeURIComponent(complaintId)}/`)
)

// This authenticated endpoint returns complaints liked by the current user.
export const getCitizenLikedComplaints = () => apiClient.get('/complain/my_likes/')

export const submitComplaintFeedback = (complaintId, payload) => (
  apiClient.patch(`/complain/feedback/${encodeURIComponent(complaintId)}/`, payload)
)

// Complaint creation is multipart because the backend expects images as a
// ListField of ImageField values. Do not set Content-Type manually; Axios
// will add the multipart boundary for us.
export const createComplaint = (formData) => apiClient.post('/complain/add/', formData, {
  timeout: 60000,
})
