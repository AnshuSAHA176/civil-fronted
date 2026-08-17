import { apiClient } from '../../services/apiClient'

export function getOfficerDashboard() {
  return apiClient.get('/officer_dashbord/')
}
