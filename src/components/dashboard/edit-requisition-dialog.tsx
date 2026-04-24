import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Requisition {
  id: string
  role: string
  project: string
  manager?: string
  lob: string
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'interview' | 'hold'
  createdDate: string
  salary: string
}

interface EditRequisitionDialogProps {
  requisition: Requisition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, updates: Partial<Requisition>) => void
  userRole?: 'hiring-manager' | 'lob-head' | 'tag-manager'
}

export function EditRequisitionDialog({ 
  requisition, 
  open, 
  onOpenChange,
  onSave,
  userRole = 'hiring-manager'
}: EditRequisitionDialogProps) {
  const { toast } = useToast()
  const [role, setRole] = useState("")
  const [project, setProject] = useState("")
  const [lob, setLob] = useState("")
  const [salary, setSalary] = useState("")
  const [status, setStatus] = useState<string>("")

  useEffect(() => {
    if (requisition) {
      setRole(requisition.role)
      setProject(requisition.project)
      setLob(requisition.lob)
      setSalary(requisition.salary)
      setStatus(requisition.status)
    }
  }, [requisition])

  if (!requisition) return null

  const handleSave = () => {
    if (!role.trim() || !project.trim() || !lob.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    onSave(requisition.id, {
      role,
      project,
      lob,
      salary,
      status: status as Requisition['status']
    })

    toast({
      title: "Requisition Updated",
      description: `${requisition.id} has been updated successfully.`
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Requisition</DialogTitle>
          <DialogDescription>
            Update details for {requisition.id}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input 
              id="role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              placeholder="Enter role title"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Input 
                id="project" 
                value={project} 
                onChange={(e) => setProject(e.target.value)}
                placeholder="Enter project"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lob">LOB *</Label>
              <Input 
                id="lob" 
                value={lob} 
                onChange={(e) => setLob(e.target.value)}
                placeholder="Enter LOB"
              />
            </div>
          </div>
          
          {userRole !== 'hiring-manager' && (
            <div className="space-y-2">
              <Label htmlFor="salary">Salary Range</Label>
              <Input 
                id="salary" 
                value={salary} 
                onChange={(e) => setSalary(e.target.value)}
                placeholder="e.g., ₹15L - ₹20L"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="hold">Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
