import { apiClient } from '../../services/apiClient'

export const getCitizenDashboard = () => apiClient.get('/dashbord/')
