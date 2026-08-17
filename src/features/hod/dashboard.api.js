import { apiClient } from '../../services/apiClient'
export function getHodDashboard() { return apiClient.get('/HOD_dashbord/') }
