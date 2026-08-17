import { apiClient } from '../../services/apiClient'

export const getCitizenProfile = () => apiClient.get('/profile/')

export const updateCitizenProfile = (payload) => {
  const formData = new FormData()

  const textFields = ['full_name', 'address', 'city', 'district', 'state', 'pincode']
  textFields.forEach((field) => {
    const value = payload[field]
    if (value !== undefined && value !== null && !(field === 'pincode' && String(value).trim() === '')) {
      formData.append(field, String(value))
    }
  })

  if (payload.profile_picture instanceof File) {
    formData.append('profile_picture', payload.profile_picture)
  }

  return apiClient.patch('/profile/', formData)
}
