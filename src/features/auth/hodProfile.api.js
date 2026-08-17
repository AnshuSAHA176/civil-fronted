import { apiClient } from '../../services/apiClient'

export const getHodProfile = () => apiClient.get('/profile/')

export const updateHodProfile = (payload) =>
  apiClient.patch('/profile/', {
    phone_number: payload.phone_number ?? '',
  })
