import { apiClient } from '../../services/apiClient'

// The backend filters this authenticated endpoint by role. For an officer,
// GET /complain/agent/list/ returns only complaints assigned to request.user.
export const getOfficerComplaints = () => apiClient.get('/complain/agent/list/')

export const getOfficerComplaintDetails = (complaintId) =>
  apiClient.get(`/complain/agent/details/${encodeURIComponent(complaintId)}/`)

export const searchOfficerComplaints = ({ status, priority, category } = {}) => {
  const params = {}
  if (status) params.status = status
  if (priority) params.priority = priority
  if (category) params.category = category
  return apiClient.get('/complain/agent/search/', { params })
}

export const updateOfficerComplaint = (complaintId, payload) =>
  apiClient.patch(`/complain/update/${encodeURIComponent(complaintId)}/`, payload)

export const getOfficerComplaintHistory = (complaintId) =>
  apiClient.get(`/complain/agent/history/${encodeURIComponent(complaintId)}/`)
