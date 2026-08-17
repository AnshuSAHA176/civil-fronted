import { createBrowserRouter, Navigate } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import CitizenLayout from '../layouts/CitizenLayout'
import OfficerLayout from '../layouts/OfficerLayout'
import HodLayout from '../layouts/HodLayout'
import ProtectedRoute from '../routes/ProtectedRoute'
import RoleRoute from '../routes/RoleRoute'
import { ROLES } from '../utils/constants'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import OfficialLogin from '../pages/auth/OfficialLogin'
import OfficialRegister from '../pages/auth/OfficialRegister'
import Unauthorized from '../pages/Unauthorized'
import NotFound from '../pages/NotFound'
import Landing from '../pages/Landing'
import CitizenDashboard from '../pages/citizen/Dashboard'
import CitizenComplaints from '../pages/citizen/Complaints'
import CreateComplaint from '../pages/citizen/CreateComplaint'
import CitizenComplaintDetails from '../pages/citizen/ComplaintDetails'
import CitizenComplaintHistory from '../pages/citizen/ComplaintHistory'
import CitizenComplaintComments from '../pages/citizen/ComplaintComments'
import LikedComplaints from '../pages/citizen/LikedComplaints'
import ComplaintFeedback from '../pages/citizen/ComplaintFeedback'
import Notifications from '../pages/citizen/Notifications'
import CitizenProfile from '../pages/citizen/Profile'
import CitizenRTI from '../pages/citizen/RTI'
import CreateRTI from '../pages/citizen/CreateRTI'
import CitizenRTIDetails from '../pages/citizen/RTIDetails'
import CitizenAssistant from '../pages/citizen/Assistant'
import OfficerDashboard from '../pages/officer/Dashboard'
import OfficerComplaints from '../pages/officer/Complaints'
import OfficerComplaintDetails from '../pages/officer/ComplaintDetails'
import OfficerComplaintHistory from '../pages/officer/ComplaintHistory'
import OfficerProfile from '../pages/officer/Profile'
import OfficerNotifications from '../pages/officer/Notifications'
import OfficerRTI from '../pages/officer/RTI'
import OfficerRTIDetails from '../pages/officer/RTIDetails'
import HodDashboard from '../pages/hod/Dashboard'
import HodComplaints from '../pages/hod/Complaints'
import HodComplaintDetails from '../pages/hod/ComplaintDetails'
import HodOfficers from '../pages/hod/Officers'
import HodStatistics from '../pages/hod/Statistics'
import HodDepartments from '../pages/hod/Departments'
import HodProfile from '../pages/hod/Profile'
import HodNotifications from '../pages/hod/Notifications'

export const router = createBrowserRouter([
  { element: <PublicLayout />, children: [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/official-login', element: <OfficialLogin /> },
    { path: '/official-register', element: <OfficialRegister /> },
  ]},
  { element: <ProtectedRoute />, children: [
    { element: <RoleRoute allowedRoles={[ROLES.CITIZEN]} />, children: [
      { element: <CitizenLayout />, children: [
        { path: '/citizen/dashboard', element: <CitizenDashboard /> },
        { path: '/citizen/complaints', element: <CitizenComplaints /> },
        { path: '/citizen/complaints/new', element: <CreateComplaint /> },
        { path: '/citizen/complaints/:complaintId', element: <CitizenComplaintDetails /> },
        { path: '/citizen/complaints/:complaintId/history', element: <CitizenComplaintHistory /> },
        { path: '/citizen/complaints/:complaintId/comments', element: <CitizenComplaintComments /> },
        { path: '/citizen/complaints/:complaintId/feedback', element: <ComplaintFeedback /> },
        { path: '/citizen/liked-complaints', element: <LikedComplaints /> },
        { path: '/citizen/notifications', element: <Notifications /> },
        { path: '/citizen/profile', element: <CitizenProfile /> },
        { path: '/citizen/rti', element: <CitizenRTI /> },
        { path: '/citizen/rti/new', element: <CreateRTI /> },
        { path: '/citizen/rti/:rtiId', element: <CitizenRTIDetails /> },
        { path: '/citizen/assistant', element: <CitizenAssistant /> },
      ]},
    ]},
    { element: <RoleRoute allowedRoles={[ROLES.OFFICER]} />, children: [
      { element: <OfficerLayout />, children: [
        { path: '/officer/dashboard', element: <OfficerDashboard /> },
        { path: '/officer/complaints', element: <OfficerComplaints /> },
        { path: '/officer/complaints/:complaintId', element: <OfficerComplaintDetails /> },
        { path: '/officer/complaints/:complaintId/history', element: <OfficerComplaintHistory /> },
        { path: '/officer/rti', element: <OfficerRTI /> },
        { path: '/officer/rti/:rtiId', element: <OfficerRTIDetails /> },
        { path: '/officer/profile', element: <OfficerProfile /> },
        { path: '/officer/notifications', element: <OfficerNotifications /> },
      ]},
    ]},
    { element: <RoleRoute allowedRoles={[ROLES.HOD]} />, children: [
      { element: <HodLayout />, children: [
        { path: '/hod/dashboard', element: <HodDashboard /> },
        { path: '/hod/complaints', element: <HodComplaints /> },
        { path: '/hod/complaints/:complaintId', element: <HodComplaintDetails /> },
        { path: '/hod/officers', element: <HodOfficers /> },
        { path: '/hod/statistics', element: <HodStatistics /> },
        { path: '/hod/department', element: <HodDepartments /> },
        { path: '/hod/profile', element: <HodProfile /> },
        { path: '/hod/notifications', element: <HodNotifications /> },
      ]},
    ]},
  ]},
  { path: '/', element: <Landing /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  { path: '*', element: <NotFound /> },
])
