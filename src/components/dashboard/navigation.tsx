import { useState } from "react"
import { NotificationBell } from "./notification-bell"
import { Users, FileText, BarChart3, Settings, LogOut, Gift, Building2, ArrowLeftRight, Menu } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { AppRole } from "@/contexts/auth-context"
import { useAuth } from "@/contexts/auth-context"
import innohireLogo from "@/assets/innohire-logo.jpeg"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export type UserRole = AppRole

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  userRole: UserRole
  onLogout: () => void
}

const navigationItems = {
  'hiring-manager': [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'requisitions', label: 'My Requisitions', icon: FileText },
    { id: 'offers-released', label: 'Offers Released', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  'lob-head': [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'requisitions', label: 'All Requisitions', icon: FileText },
    { id: 'approvals', label: 'Requisition Approvals', icon: Users },
    { id: 'offer-approvals', label: 'Offer Approvals', icon: Gift },
    { id: 'settings', label: 'Settings', icon: Settings },
  ],
  'tag-manager': [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'requisitions', label: 'All Requisitions', icon: FileText },
    { id: 'offer-pipeline', label: 'Offer Pipeline', icon: Gift },
    { id: 'offers-released', label: 'Offers Released', icon: Building2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]
}

const roleLabels: Record<string, string> = {
  'hiring-manager': 'Hiring Manager',
  'lob-head': 'LOB Head',
  'tag-manager': 'TAG'
}

export function Navigation({ activeTab, onTabChange, userRole, onLogout }: NavigationProps) {
  const roleItems = navigationItems[userRole]
  const { profileName, avatarUrl, userRoles, activeRole, setActiveRole } = useAuth()
  const hasMultipleRoles = userRoles.length > 1
  const [flashActive, setFlashActive] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = profileName
    ? profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  const handleRoleSwitch = (role: AppRole) => {
    if (role !== activeRole) {
      setActiveRole(role)
      onTabChange('dashboard')
      setFlashActive(true)
      setTimeout(() => setFlashActive(false), 700)
      toast({
        title: `Switched to ${roleLabels[role]}`,
        description: `You're now viewing the ${roleLabels[role]} dashboard.`,
      })
    }
  }

  const handleMobileTabChange = (tab: string) => {
    onTabChange(tab)
    setMobileMenuOpen(false)
  }
  
  return (
    <nav className={cn(
      "bg-card border-b border-border transition-colors duration-700",
      flashActive && "bg-primary/10 border-primary/30"
    )}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo + Desktop Nav */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src={innohireLogo} alt="InnoHire Logo" className="h-8 sm:h-10 w-auto" />
              <h1 className="text-lg sm:text-xl font-bold text-foreground whitespace-nowrap">InnoHire</h1>
            </div>
            
            {/* Desktop nav tabs - hidden on mobile */}
            <div className="hidden lg:flex space-x-1">
              {roleItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-smooth",
                      activeTab === item.id 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onTabChange(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </div>
          
          {/* Desktop right section */}
          <div className="hidden sm:flex items-center space-x-4">
            {hasMultipleRoles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    {roleLabels[userRole]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={cn(
                        "cursor-pointer",
                        role === activeRole && "bg-accent font-medium"
                      )}
                    >
                      {roleLabels[role]}
                      {role === activeRole && <span className="ml-2 text-xs text-primary">●</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <NotificationBell />
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground">{profileName}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[userRole]}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden border-2 border-primary/20 hover:border-primary/50">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profileName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">{initials}</span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{profileName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[userRole]}</p>
                </div>
                <DropdownMenuItem onClick={() => onTabChange('settings')} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile right section: role badge + hamburger */}
          <div className="flex sm:hidden items-center gap-1">
            <NotificationBell />
            {hasMultipleRoles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8 px-2">
                    <ArrowLeftRight className="h-3 w-3" />
                    {roleLabels[userRole]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userRoles.map((role) => (
                    <DropdownMenuItem
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      className={cn(
                        "cursor-pointer",
                        role === activeRole && "bg-accent font-medium"
                      )}
                    >
                      {roleLabels[role]}
                      {role === activeRole && <span className="ml-2 text-xs text-primary">●</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader className="text-left pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={profileName || 'Profile'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">{initials}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <SheetTitle className="text-base">{profileName}</SheetTitle>
                      <p className="text-xs text-muted-foreground">{roleLabels[userRole]}</p>
                    </div>
                  </div>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-4">
                  {roleItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "default" : "ghost"}
                        className={cn(
                          "justify-start w-full",
                          activeTab === item.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => handleMobileTabChange(item.id)}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {item.label}
                      </Button>
                    )
                  })}
                </nav>
                <div className="mt-auto pt-4 border-t border-border absolute bottom-6 left-6 right-6">
                  <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
