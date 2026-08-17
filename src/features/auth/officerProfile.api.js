import { apiClient } from '../../services/apiClient'

export const getOfficerProfile = () => apiClient.get('/profile/')

export const updateOfficerProfile = ({ designation }) => (
  apiClient.patch('/profile/', { designation })
)
