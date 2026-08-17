import { apiClient } from '../../services/apiClient'

// The backend filters this authenticated endpoint by role. For an officer,
// GET /rti/ returns only RTI requests where the officer is the assigned PIO
// (Public Information Officer) for the underlying complaint.
export const getOfficerRTIs = () => apiClient.get('/rti/')

export const getOfficerRTIDetails = (rtiId) => apiClient.get(`/rti/detail/${encodeURIComponent(rtiId)}/`)

// action: 'responded' | 'rejected' | 'clarification_required'
// payload fields depend on action: responce (for responded), response_attachment
// (optional file, for responded), rejection_reason (for rejected),
// clarification_reason (for clarification_required).
export const updateOfficerRTIStatus = (rtiId, payload) => {
  const hasFile = payload?.response_attachment instanceof File
  if (hasFile) {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') formData.append(key, value)
    })
    return apiClient.patch(`/rti/status/${encodeURIComponent(rtiId)}/`, formData, { timeout: 60000 })
  }
  return apiClient.patch(`/rti/status/${encodeURIComponent(rtiId)}/`, payload)
}
