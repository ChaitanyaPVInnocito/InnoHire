import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'

export type AppRole = 'hiring-manager' | 'lob-head' | 'tag-manager'

// Session expiry: 8 hours (in ms)
const SESSION_MAX_LIFETIME_MS = 8 * 60 * 60 * 1000

interface AuthContextType {
  user: User | null
  session: Session | null
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

// Cross-tab broadcast channel for session sync
const BROADCAST_CHANNEL = 'innohire_auth_sync'

type BroadcastMessage =
  | { type: 'SIGNED_IN'; userId: string }
  | { type: 'SIGNED_OUT' }
  | { type: 'ROLE_CHANGED'; activeRole: AppRole; userId: string }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRoles, setUserRoles] = useState<AppRole[]>([])
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const broadcastRef = useRef<BroadcastChannel | null>(null)

  // --- Session expiry timer ---
  const clearSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current)
      sessionTimerRef.current = null
    }
  }, [])

  const startSessionTimer = useCallback((sess: Session) => {
    clearSessionTimer()
    const expiresAt = sess.expires_at ? sess.expires_at * 1000 : null
    const loginTime = parseInt(localStorage.getItem('innohire_session_start') || '0', 10)
    const now = Date.now()

    // Use the earlier of: JWT expiry or max lifetime from login
    let timeoutMs = SESSION_MAX_LIFETIME_MS
    if (loginTime > 0) {
      const lifetimeRemaining = SESSION_MAX_LIFETIME_MS - (now - loginTime)
      timeoutMs = Math.max(0, lifetimeRemaining)
    }
    if (expiresAt) {
      const jwtRemaining = expiresAt - now
      timeoutMs = Math.min(timeoutMs, Math.max(0, jwtRemaining))
    }

    sessionTimerRef.current = setTimeout(async () => {
      toast.warning('Your session has expired. Please sign in again.')
      await signOutInternal()
      broadcastMessage({ type: 'SIGNED_OUT' })
    }, timeoutMs)
  }, [clearSessionTimer])

  // --- Cross-tab broadcast ---
  const broadcastMessage = useCallback((msg: BroadcastMessage) => {
    try {
      broadcastRef.current?.postMessage(msg)
    } catch {
      // BroadcastChannel not supported or closed
    }
  }, [])

  const fetchUserRoles = async (userId: string, retries = 3): Promise<AppRole[]> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)

      if (error) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
          continue
        }
        console.error('Failed to fetch user roles after retries:', error)
      }

      if (data && data.length > 0) {
        const roles = data.map(d => d.role as AppRole)
        setUserRoles(roles)
        const saved = localStorage.getItem(`innohire_active_role_${userId}`)
        if (saved && roles.includes(saved as AppRole)) {
          setActiveRoleState(saved as AppRole)
        } else {
          setActiveRoleState(roles[0])
        }
        return roles
      }

      if (!error && data && data.length === 0 && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * attempt))
        continue
      }

      break
    }

    setUserRoles([])
    setActiveRoleState(null)
    return []
  }

  const fetchProfile = async (userId: string, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single()

      if (data) {
        setProfileName(data.full_name)
        setAvatarUrl(data.avatar_url)
        return
      }

      if (attempt < retries) {
        console.warn(`Profile fetch attempt ${attempt} failed, retrying...`, error?.message)
        await new Promise(r => setTimeout(r, 1000 * attempt))
      } else {
        console.error('Failed to fetch profile after retries:', error?.message)
      }
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role)
    if (user) {
      localStorage.setItem(`innohire_active_role_${user.id}`, role)
      broadcastMessage({ type: 'ROLE_CHANGED', activeRole: role, userId: user.id })
    }
  }

  const signOutInternal = async () => {
    clearSessionTimer()
    localStorage.removeItem('innohire_session_start')
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setUserRoles([])
    setActiveRoleState(null)
    setProfileName(null)
  }

  useEffect(() => {
    // Setup BroadcastChannel for cross-tab sync
    try {
      broadcastRef.current = new BroadcastChannel(BROADCAST_CHANNEL)
      broadcastRef.current.onmessage = async (event: MessageEvent<BroadcastMessage>) => {
        const msg = event.data
        switch (msg.type) {
          case 'SIGNED_OUT':
            clearSessionTimer()
            localStorage.removeItem('innohire_session_start')
            setUser(null)
            setSession(null)
            setUserRoles([])
            setActiveRoleState(null)
            setProfileName(null)
            break
          case 'SIGNED_IN':
            // Refresh session from storage in other tabs
            const { data: { session: freshSession } } = await supabase.auth.getSession()
            if (freshSession?.user) {
              setSession(freshSession)
              setUser(freshSession.user)
              await Promise.all([
                fetchUserRoles(freshSession.user.id),
                fetchProfile(freshSession.user.id),
              ])
              startSessionTimer(freshSession)
            }
            break
          case 'ROLE_CHANGED':
            // Sync active role if same user
            if (msg.userId) {
              setActiveRoleState(msg.activeRole)
              localStorage.setItem(`innohire_active_role_${msg.userId}`, msg.activeRole)
            }
            break
        }
      }
    } catch {
      // BroadcastChannel not supported
    }

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          // Track session start for max lifetime
          if (event === 'SIGNED_IN') {
            localStorage.setItem('innohire_session_start', Date.now().toString())
            setLoading(true)
          }

          startSessionTimer(session)

          setTimeout(async () => {
            await Promise.all([
              fetchUserRoles(session.user.id),
              fetchProfile(session.user.id),
            ])
            setLoading(false)
          }, 0)
        } else {
          clearSessionTimer()
          setUserRoles([])
          setActiveRoleState(null)
          setProfileName(null)
          setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          startSessionTimer(session)
        }
      }
    )

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        // Check if max lifetime exceeded
        const loginTime = parseInt(localStorage.getItem('innohire_session_start') || '0', 10)
        if (loginTime > 0 && (Date.now() - loginTime) >= SESSION_MAX_LIFETIME_MS) {
          // Session expired by max lifetime
          signOutInternal().then(() => {
            toast.warning('Your session has expired. Please sign in again.')
            setLoading(false)
          })
          return
        }

        startSessionTimer(session)
        Promise.all([
          fetchUserRoles(session.user.id),
          fetchProfile(session.user.id),
        ]).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearSessionTimer()
      broadcastRef.current?.close()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string, roles: AppRole[]) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) return { error: error.message }

    if (data.user) {
      for (const role of roles) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role })

        if (roleError) return { error: roleError.message }
      }

      if (data.session) {
        setUserRoles(roles)
        setActiveRoleState(roles[0])
        setProfileName(fullName)
        localStorage.setItem('innohire_session_start', Date.now().toString())
        broadcastMessage({ type: 'SIGNED_IN', userId: data.user.id })
      }
    }

    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    broadcastMessage({ type: 'SIGNED_IN', userId: '' })
    return { error: null }
  }

  const signOut = async () => {
    await signOutInternal()
    broadcastMessage({ type: 'SIGNED_OUT' })
  }

  const userRole = activeRole

  return (
    <AuthContext.Provider value={{
      user, session, userRole, userRoles, activeRole, setActiveRole,
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
