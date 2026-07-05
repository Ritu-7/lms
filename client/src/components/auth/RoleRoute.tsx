import type { ReactNode } from 'react'
import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { AppContext } from '../../context/AppContext'
import Loading from '../students/Loading'

interface RoleRouteProps {
  roles: Array<'student' | 'educator' | 'admin'>
  children: ReactNode
}

const RoleRoute = ({ roles, children }: RoleRouteProps) => {
  const { isLoaded, isSignedIn } = useUser()
  const { userData } = useContext(AppContext)
  const location = useLocation()

  if (!isLoaded || (isSignedIn && !userData)) return <Loading />
  if (!isSignedIn) return <Navigate to="/" replace state={{ from: location.pathname }} />
  if (!roles.includes(userData.role)) return <Navigate to="/" replace />
  return children
}

export default RoleRoute
