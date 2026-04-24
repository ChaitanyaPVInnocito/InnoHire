import { useState, useEffect } from "react"
import { apiClient } from "@/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bell, User, Shield, Database, Mail, Clock, DollarSign, Plus, X, FolderOpen, Loader2, Camera } from "lucide-react"
import { UserAccessManagement } from "./user-access-management"
import { useProjectCodes } from "@/hooks/use-project-codes"
import { useNotificationPreferences } from "@/hooks/use-notification-preferences"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/components/dashboard/navigation"

interface SettingsProps {
  userRole: UserRole
}

export function Settings({ userRole }: SettingsProps) {
  const { projectCodes, addCode, removeCode, renameCode } = useProjectCodes()
  const { preferences: notifPrefs, loading: prefsLoading, saving: prefsSaving, updatePreference } = useNotificationPreferences()
  const { profileName, avatarUrl, user, refreshProfile } = useAuth()
  const [newProjectCode, setNewProjectCode] = useState("")
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const { toast } = useToast()

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    timezone: "Asia/Kolkata"
  })
  const [requisitionPreferences, setRequisitionPreferences] = useState({
    defaultJobLocation: "bangalore",
    defaultExperienceRange: "3-5",
  })
  const [requisitionPrefsSaving, setRequisitionPrefsSaving] = useState(false)

  // Load profile from database
  useEffect(() => {
    async function loadProfile() {
      if (!user) return
      try {
        const { data: profileRow } = await apiClient.get(`/profiles/${user.id}`)

        if (profileRow) {
          setProfile(prev => ({
            ...prev,
            name: profileRow.fullName || profileRow.full_name || '',
            department: profileRow.department || '',
            email: user.email || '',
          }))
          setRequisitionPreferences({
            defaultJobLocation: profileRow.defaultJobLocation || profileRow.default_job_location || 'bangalore',
            defaultExperienceRange: profileRow.defaultExperienceRange || profileRow.default_experience_range || '3-5',
          })
        }
      } catch (err) {
        setProfile(prev => ({ ...prev, email: user.email || '' }))
      }
    }
    loadProfile()
  }, [user])

  const updateRequisitionPreference = async (
    key: 'defaultJobLocation' | 'defaultExperienceRange',
    value: string
  ) => {
    const previous = requisitionPreferences
    const updated = { ...previous, [key]: value }
    setRequisitionPreferences(updated)

    if (!user) return

    setRequisitionPrefsSaving(true)
    const dbUpdates = key === 'defaultJobLocation'
      ? { defaultJobLocation: value }
      : { defaultExperienceRange: value }

    try {
      await apiClient.put(`/profiles/${user.id}`, dbUpdates)
    } catch(err) {
      setRequisitionPreferences(previous)
      toast({
        title: 'Error',
        description: 'Failed to save requisition preferences.',
        variant: 'destructive'
      })
    } finally {
      setRequisitionPrefsSaving(false)
    }
  }

  const roleLabels = {
    'hiring-manager': 'Hiring Manager',
    'lob-head': 'LOB Head',
    'tag-manager': 'Tag Manager'
  }

  const renderRoleSpecificSettings = () => {
    switch (userRole) {
      case 'hiring-manager':
        return (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Requisition Preferences
                  {requisitionPrefsSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription>
                  Configure your default requisition settings. Changes save automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-location">Default Job Location</Label>
                  <Select
                    value={requisitionPreferences.defaultJobLocation}
                    onValueChange={(value) => updateRequisitionPreference('defaultJobLocation', value)}
                  >
                    <SelectTrigger id="default-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-experience">Default Experience Range</Label>
                  <Select
                    value={requisitionPreferences.defaultExperienceRange}
                    onValueChange={(value) => updateRequisitionPreference('defaultExperienceRange', value)}
                  >
                    <SelectTrigger id="default-experience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="5-8">5-8 years</SelectItem>
                      <SelectItem value="8+">8+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-save-drafts" defaultChecked />
                  <Label htmlFor="auto-save-drafts">Auto-save drafts</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Library</CardTitle>
                <CardDescription>
                  Manage your job description templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Senior Developer Template</span>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span>Product Manager Template</span>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                  <Button variant="outline" className="w-full">
                    + Add New Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )

      case 'lob-head':
        return (
          <UserAccessManagement />
        )

      case 'tag-manager':
        return (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Manage system-wide settings and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-workflow">Default requisition workflow</Label>
                  <Select defaultValue="standard">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (Manager → LOB Head)</SelectItem>
                      <SelectItem value="fast-track">Fast Track (Direct LOB Head)</SelectItem>
                      <SelectItem value="custom">Custom Approval Chain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-posting" defaultChecked />
                  <Label htmlFor="auto-posting">Auto-post approved requisitions</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="candidate-matching" defaultChecked />
                  <Label htmlFor="candidate-matching">Enable AI candidate matching</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>
                  Configure external system integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">Naukri.com</span>
                    <p className="text-sm text-muted-foreground">Job posting integration</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">LinkedIn Recruiter</span>
                    <p className="text-sm text-muted-foreground">Candidate sourcing</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon", description: "LinkedIn Recruiter integration is not yet available." })}>Connect</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">Slack</span>
                    <p className="text-sm text-muted-foreground">Team notifications</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences as {roleLabels[userRole]}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">
                      {profileName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                    </span>
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !user) return
                  if (file.size > 2 * 1024 * 1024) {
                    toast({ title: "File too large", description: "Please choose an image under 2MB.", variant: "destructive" })
                    return
                  }
                  
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = async () => {
                     const base64String = reader.result as string;
                     try {
                        await apiClient.put(`/profiles/${user.id}/avatar`, { avatar_url: base64String })
                        refreshProfile()
                        toast({ title: "Updated", description: "Profile picture updated." })
                     } catch(err: any) {
                        toast({ title: "Upload failed", description: err.message, variant: "destructive" })
                     }
                  };
                  reader.onerror = (error) => {
                     toast({ title: "Upload failed", description: "Failed reading file.", variant: "destructive" })
                  };
                }}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile Picture</p>
              <p className="text-xs text-muted-foreground">Click the image to upload a new photo (max 2MB)</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profile.department}
                onChange={(e) => setProfile({...profile, department: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile({...profile, timezone: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Asia/Singapore">Asia/Singapore (SGT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={async () => {
            if (!user) return
            try {
              await apiClient.put(`/profiles/${user.id}`, {
                fullName: profile.name,
                department: profile.department,
              })
              refreshProfile()
              toast({ title: "Saved", description: "Profile updated successfully." })
            } catch(err) {
              toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" })
            }
          }}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
            {prefsSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <CardDescription>
            Choose how and when you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {prefsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Delivery channels */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Delivery Channels</h4>
                <p className="text-xs text-muted-foreground mb-3">How you want to be notified</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-email">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      id="pref-email"
                      checked={notifPrefs.email_enabled}
                      onCheckedChange={(v) => updatePreference("email_enabled", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-browser">Browser Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications even when tab is closed</p>
                    </div>
                    <Switch
                      id="pref-browser"
                      checked={notifPrefs.browser_enabled}
                      onCheckedChange={(v) => updatePreference("browser_enabled", v)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Event types */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">Event Types</h4>
                <p className="text-xs text-muted-foreground mb-3">Which events trigger notifications</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-req-submitted">Requisition Submitted</Label>
                      <p className="text-sm text-muted-foreground">When a new requisition is submitted for approval</p>
                    </div>
                    <Switch
                      id="pref-req-submitted"
                      checked={notifPrefs.requisition_submitted}
                      onCheckedChange={(v) => updatePreference("requisition_submitted", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-req-approved">Requisition Approved</Label>
                      <p className="text-sm text-muted-foreground">When a requisition is approved</p>
                    </div>
                    <Switch
                      id="pref-req-approved"
                      checked={notifPrefs.requisition_approved}
                      onCheckedChange={(v) => updatePreference("requisition_approved", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-req-rejected">Requisition Rejected</Label>
                      <p className="text-sm text-muted-foreground">When a requisition is rejected</p>
                    </div>
                    <Switch
                      id="pref-req-rejected"
                      checked={notifPrefs.requisition_rejected}
                      onCheckedChange={(v) => updatePreference("requisition_rejected", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-req-update">Requisition Status Updates</Label>
                      <p className="text-sm text-muted-foreground">When interview or candidate status changes</p>
                    </div>
                    <Switch
                      id="pref-req-update"
                      checked={notifPrefs.requisition_update}
                      onCheckedChange={(v) => updatePreference("requisition_update", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-offer-routed">Offer Routed</Label>
                      <p className="text-sm text-muted-foreground">When an offer is routed for approval</p>
                    </div>
                    <Switch
                      id="pref-offer-routed"
                      checked={notifPrefs.offer_routed}
                      onCheckedChange={(v) => updatePreference("offer_routed", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-offer-approved">Offer Approved</Label>
                      <p className="text-sm text-muted-foreground">When an offer is approved by LOB Head</p>
                    </div>
                    <Switch
                      id="pref-offer-approved"
                      checked={notifPrefs.offer_approved}
                      onCheckedChange={(v) => updatePreference("offer_approved", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-offer-rejected">Offer Rejected</Label>
                      <p className="text-sm text-muted-foreground">When an offer is rejected</p>
                    </div>
                    <Switch
                      id="pref-offer-rejected"
                      checked={notifPrefs.offer_rejected}
                      onCheckedChange={(v) => updatePreference("offer_rejected", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="pref-reinit">Re-initiation Requests</Label>
                      <p className="text-sm text-muted-foreground">When a backed-out position is re-initiated</p>
                    </div>
                    <Switch
                      id="pref-reinit"
                      checked={notifPrefs.re_initiation}
                      onCheckedChange={(v) => updatePreference("re_initiation", v)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Project Codes Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Project Codes
          </CardTitle>
          <CardDescription>
            Manage project codes available when creating new requisitions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter new project code..."
              value={newProjectCode}
              onChange={(e) => setNewProjectCode(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  const code = newProjectCode.trim()
                  if (!code) return
                  if (projectCodes.includes(code)) {
                    toast({ title: "Duplicate", description: "This project code already exists.", variant: "destructive" })
                  } else {
                    const ok = await addCode(code)
                    if (ok) {
                      setNewProjectCode("")
                      toast({ title: "Added", description: `Project code "${code}" has been added.` })
                    } else {
                      toast({ title: "Error", description: "Failed to add project code.", variant: "destructive" })
                    }
                  }
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const code = newProjectCode.trim()
                if (code) {
                  if (projectCodes.includes(code)) {
                    toast({ title: "Duplicate", description: "This project code already exists.", variant: "destructive" })
                  } else {
                    const success = await addCode(code)
                    if (success) {
                      setNewProjectCode("")
                      toast({ title: "Added", description: `Project code "${code}" has been added.` })
                    } else {
                      toast({ title: "Error", description: "Failed to add project code. You may not have permission.", variant: "destructive" })
                    }
                  }
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {projectCodes.map((code) => (
              <Badge key={code} variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                {editingCode === code ? (
                  <Input
                    className="h-5 w-24 text-xs px-1 py-0"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = editValue.trim()
                        if (trimmed && trimmed !== code) {
                          if (projectCodes.includes(trimmed)) {
                            toast({ title: "Duplicate", description: "This project code already exists.", variant: "destructive" })
                          } else {
                            renameCode(code, trimmed)
                            toast({ title: "Renamed", description: `"${code}" renamed to "${trimmed}".` })
                          }
                        }
                        setEditingCode(null)
                      } else if (e.key === 'Escape') {
                        setEditingCode(null)
                      }
                    }}
                    onBlur={() => {
                      const trimmed = editValue.trim()
                      if (trimmed && trimmed !== code && !projectCodes.includes(trimmed)) {
                        renameCode(code, trimmed)
                        toast({ title: "Renamed", description: `"${code}" renamed to "${trimmed}".` })
                      }
                      setEditingCode(null)
                    }}
                  />
                ) : (
                  <span
                    className="cursor-pointer"
                    onDoubleClick={() => {
                      setEditingCode(code)
                      setEditValue(code)
                    }}
                    title="Double-click to rename"
                  >
                    {code}
                  </span>
                )}
                <button
                  onClick={async () => {
                    const success = await removeCode(code)
                    if (success) {
                      toast({ title: "Removed", description: `Project code "${code}" has been removed.` })
                    } else {
                      toast({ title: "Error", description: "Failed to remove project code.", variant: "destructive" })
                    }
                  }}
                  className="ml-1 hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {projectCodes.length > 0 && (
            <p className="text-xs text-muted-foreground">Double-click a project code to rename it.</p>
          )}
          {projectCodes.length === 0 && (
            <p className="text-sm text-muted-foreground">No project codes configured. Add one above.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Role-specific settings */}
      {renderRoleSpecificSettings()}
    </div>
  )
}