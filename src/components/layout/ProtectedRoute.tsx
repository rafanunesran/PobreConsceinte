import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Splash } from './Splash'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)
  const initializing = useAuthStore((state) => state.initializing)

  if (initializing) return <Splash />
  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}
