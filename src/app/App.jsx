import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import NotificationSocket from '../components/system/NotificationSocket'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <NotificationSocket />
    </>
  )
}
