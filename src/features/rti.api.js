import { apiClient } from '../services/apiClient'

// RTI creation is multipart because the backend accepts an optional attachment.
export const createCitizenRTI = (formData) => apiClient.post('/rti/upload/', formData, {
  timeout: 60000,
})

export const getCitizenRTIs = () => apiClient.get('/rti/')

export const getCitizenRTIDetails = (rtiId) => apiClient.get(`/rti/detail/${encodeURIComponent(rtiId)}/`)
