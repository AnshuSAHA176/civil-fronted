import { apiClient } from '../../services/apiClient'

export const getHodDepartment = () => apiClient.get('/department/my/')
