import { AuthProvider } from '../features/auth/auth.context'

export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}
