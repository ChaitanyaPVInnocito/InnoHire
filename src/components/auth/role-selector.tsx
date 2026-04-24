import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, Shield, Tags } from "lucide-react"
import innohireLogo from "@/assets/innohire-logo.jpeg"

export type UserRole = 'hiring-manager' | 'lob-head' | 'tag-manager'

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void
}

const roles = [
  {
    id: 'hiring-manager' as const,
    title: 'Hiring Manager',
    description: 'Create and manage job requisitions',
    icon: UserCheck,
    permissions: [
      'Create new requisitions',
      'View assigned requisitions',
      'Edit draft requisitions',
      'Submit for approval'
    ]
  },
  {
    id: 'lob-head' as const,
    title: 'LOB Head',
    description: 'Approve and oversee hiring decisions',
    icon: Shield,
    permissions: [
      'Approve/reject requisitions',
      'View all LOB requisitions',
      'Override hiring decisions',
      'Budget management'
    ]
  },
  {
    id: 'tag-manager' as const,
    title: 'TAG',
    description: 'Manage talent acquisition operations',
    icon: Tags,
    permissions: [
      'View all requisitions',
      'Assign candidates',
      'Track hiring metrics',
      'Generate reports'
    ]
  }
]

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    onRoleSelect(role)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <img src={innohireLogo} alt="InnoHire Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to InnoHire</h1>
          <p className="text-muted-foreground">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-elevated ${
                  selectedRole === role.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <h4 className="font-medium text-sm text-foreground mb-3">Permissions:</h4>
                  <ul className="space-y-1">
                    {role.permissions.map((permission, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2 flex-shrink-0" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {selectedRole && (
          <div className="text-center mt-8">
            <Button size="lg" onClick={() => onRoleSelect(selectedRole)}>
              Continue as {roles.find(r => r.id === selectedRole)?.title}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}