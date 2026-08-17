import { apiClient } from '../../services/apiClient'

export const getHodComplaints = ({ status, priority, category, assigned } = {}) => {
  const params = {}
  if (status) params.status = status
  if (priority) params.priority = priority
  if (category) params.category = category
  if (assigned) params.assigned = assigned
  return apiClient.get('/complain/hod/', { params })
}

export const getHodComplaintDetails = (complaintId) =>
  apiClient.get(`/complain/hod/${encodeURIComponent(complaintId)}/`)

export const getHodOfficers = () => apiClient.get('/complain/hod/officers/')

export const assignHodComplaint = (complaintId, employeeId) =>
  apiClient.patch(`/complain/hod/${encodeURIComponent(complaintId)}/assign/`, {
    employee_id: employeeId,
  })
