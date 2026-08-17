import { apiClient } from '../../services/apiClient'

export const getHodOfficers = () => apiClient.get('/complain/hod/officers/')

// Pulls an officer (identified by their employee ID) into the department head's
// department. The officer must not already belong to another department.
export const assignOfficerToDepartment = (employeeId) =>
  apiClient.patch(`/department/assinged_officer/${encodeURIComponent(employeeId)}/`)
