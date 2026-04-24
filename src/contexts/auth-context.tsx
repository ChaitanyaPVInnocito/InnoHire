import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import { toast } from 'sonner'
import { jwtDecode } from 'jwt-decode'

export type AppRole = 'hiring-manager' | 'lob-head' | 'tag-manager'

interface User {
  id: string
  email: string
}

interface AuthContextType {
  user: User | null
  userRole: AppRole | null
  userRoles: AppRole[]
  activeRole: AppRole | null
  setActiveRole: (role: AppRole) => void
  profileName: string | null
  avatarUrl: string | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, roles: AppRole[]) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<AppRole[]>([])
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfileAndRoles = async (userId: string) => {
    try {
      const { data: profile } = await apiClient.get(`/profiles/${userId}`)
      setProfileName(profile.fullName)
      setAvatarUrl(profile.avatarUrl)

      // Assuming we merge userRoles endpoint or it's fetched differently. 
      // For now, let's mock the role fetch or simulate standard flow if endpoint isn't fully ready
      // Let's assume Lob Head as fallback if endpoint is pending
      setUserRoles(['lob-head', 'hiring-manager'])
      const savedRole = localStorage.getItem(`innohire_active_role_${userId}`) as AppRole
      setActiveRoleState(savedRole || 'lob-head')
    } catch (e) {
      console.error('Failed to fetch profile', e)
    }
  }

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('jwt_token')
    if (token) {
      try {
        const decoded: any = jwtDecode(token)
        // Check expiry
        if (decoded.exp * 1000 < Date.now()) {
          throw new Error('Token expired')
        }
        setUser({ id: decoded.sub, email: decoded.sub })
        await fetchProfileAndRoles(decoded.sub)
      } catch (err) {
        localStorage.removeItem('jwt_token')
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const refreshProfile = async () => {
    if (user) await fetchProfileAndRoles(user.id)
  }

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role)
    if (user) {
      localStorage.setItem(`innohire_active_role_${user.id}`, role)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, roles: AppRole[]) => {
    try {
      const response = await apiClient.post('/auth/register', { 
        email, 
        password, 
        fullName,
        department: '',
        defaultJobLocation: 'Remote',
        defaultExperienceRange: '3-5 Years'
      })
      const token = response.data.token
      localStorage.setItem('jwt_token', token)
      await checkSession()
      return { error: null }
    } catch (error: any) {
      return { error: error.response?.data?.message || 'Failed to register' }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/authenticate', { email, password })
      const token = response.data.token
      localStorage.setItem('jwt_token', token)
      await checkSession()
      return { error: null }
    } catch (error: any) {
      return { error: error.response?.data?.message || 'Invalid credentials' }
    }
  }

  const signOut = async () => {
    localStorage.removeItem('jwt_token')
    setUser(null)
    setUserRoles([])
    setActiveRoleState(null)
    setProfileName(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user, userRole: activeRole, userRoles, activeRole, setActiveRole,
      profileName, avatarUrl, loading, signUp, signIn, signOut, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
