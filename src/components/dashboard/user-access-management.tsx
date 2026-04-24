import { useState, useEffect } from "react"
import { apiClient } from "@/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Trash2, Users, Mail, Loader2, Copy, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { AppRole } from "@/contexts/auth-context"

interface Invitation {
  id: string
  email: string
  fullName: string
  role: AppRole
  secondaryRole: AppRole | null
  token: string
  used: boolean
  createdAt: string
}

const roleLabels: Record<string, string> = {
  'hiring-manager': 'Hiring Manager',
  'tag-manager': 'TAG',
}

type InvitableRole = 'hiring-manager' | 'tag-manager'

export function UserAccessManagement() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<Set<InvitableRole>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchInvitations = async () => {
    try {
      const response = await apiClient.get('/invitations')
      setInvitations(response.data || [])
    } catch(err) {
      console.error('Failed to fetch invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const toggleRole = (role: InvitableRole) => {
    setSelectedRoles(prev => {
      const next = new Set(prev)
      if (next.has(role)) {
        next.delete(role)
      } else {
        next.add(role)
      }
      return next
    })
  }

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim() || selectedRoles.size === 0) {
      toast({ title: "Missing fields", description: "Please fill in all fields and select at least one role.", variant: "destructive" })
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" })
      return
    }

    const existing = invitations.find(i => i.email === newEmail.trim() && !i.used)
    if (existing) {
      toast({ title: "Already invited", description: "This email already has a pending invitation.", variant: "destructive" })
      return
    }

    setSubmitting(true)

    const rolesArray = Array.from(selectedRoles)
    const primaryRole = rolesArray[0]
    const secondaryRole = rolesArray.length > 1 ? rolesArray[1] : null

    const tokenPayload = Math.random().toString(36).substring(2, 15)

    const insertData: any = {
      email: newEmail.trim(),
      fullName: newName.trim(),
      role: primaryRole,
      token: tokenPayload,
      used: false
    }
    if (secondaryRole) {
      insertData.secondaryRole = secondaryRole
    }

    try {
      const response = await apiClient.post('/invitations', insertData)
      const invitation = response.data

      setInvitations([invitation, ...invitations])
      setNewName('')
      setNewEmail('')
      setSelectedRoles(new Set())
      
      const roleNames = rolesArray.map(r => roleLabels[r]).join(' & ')
      toast({ title: "Invitation sent", description: `${newName.trim()} has been invited as ${roleNames}.` })
      
      // Attempt sending email mock
      await apiClient.post('/notifications/email', {
        type: 'invite',
        recipientEmail: invitation.email,
        recipientName: invitation.fullName,
        role: invitation.role
      })
    } catch(err: any) {
      toast({ title: "Failed to create invitation", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveInvitation = async (id: string) => {
    const invitation = invitations.find(i => i.id === id)
    try {
      await apiClient.delete(`/invitations/${id}`)
      setInvitations(invitations.filter(i => i.id !== id))
      if (invitation) {
        toast({ title: "Invitation revoked", description: `${invitation.fullName || 'User'}'s invitation has been removed.` })
      }
    } catch(err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" })
    }
  }

  const copyInviteLink = (token: string, id: string) => {
    const link = `${window.location.origin}/auth?invite=${token}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: "Link copied", description: "Invitation link copied to clipboard." })
  }

  const getRoleBadges = (inv: Invitation) => {
    const roles: string[] = [roleLabels[inv.role]]
    if (inv.secondaryRole) roles.push(roleLabels[inv.secondaryRole])
    return roles
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Access Management
        </CardTitle>
        <CardDescription>
          Invite Hiring Manager and TAG users — select both roles for dual-role access with a single login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new user */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Invite User
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="new-user-name">Full Name</Label>
              <Input id="new-user-name" placeholder="e.g. John Doe" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-user-email">Email</Label>
              <Input id="new-user-email" type="email" placeholder="john@company.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Role(s)</Label>
              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedRoles.has('hiring-manager')}
                    onCheckedChange={() => toggleRole('hiring-manager')}
                  />
                  <span className="text-sm">Hiring Manager</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedRoles.has('tag-manager')}
                    onCheckedChange={() => toggleRole('tag-manager')}
                  />
                  <span className="text-sm">TAG</span>
                </label>
              </div>
            </div>
          </div>
          <Button onClick={handleAddUser} size="sm" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
            Send Invitation
          </Button>
        </div>

        {/* Invitations list */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Invitations ({invitations.length})</h4>
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invitations sent yet.</p>
          ) : (
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{inv.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={inv.used ? "default" : "secondary"}>
                      {inv.used ? "Registered" : "Pending"}
                    </Badge>
                    {getRoleBadges(inv).map((label, i) => (
                      <Badge key={i} variant="outline">{label}</Badge>
                    ))}
                    {!inv.used && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyInviteLink(inv.token, inv.id)}
                        title="Copy invite link"
                      >
                        {copiedId === inv.id ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                    {!inv.used && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveInvitation(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
