import { useAuth } from '@/contexts/auth-context'
import Dashboard from './Dashboard'
import Auth from './Auth'
import { Loader2 } from 'lucide-react'

const Index = () => {
  const { user, userRole, activeRole, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">No role assigned</h2>
          <p className="text-muted-foreground">Your account doesn't have a role yet. Please contact an administrator.</p>
          <button onClick={signOut} className="text-primary hover:underline text-sm">Sign out</button>
        </div>
      </div>
    )
  }

  return <Dashboard userRole={userRole} onLogout={signOut} />
}

export default Index
