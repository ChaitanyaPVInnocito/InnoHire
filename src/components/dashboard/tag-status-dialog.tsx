import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Users, Clock, CheckCircle } from "lucide-react"

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

interface TagStatusDialogProps {
  requisition: Requisition | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (id: string, status: 'interview' | 'hold', notes?: string) => void
}

export function TagStatusDialog({ 
  requisition, 
  open, 
  onOpenChange, 
  onUpdateStatus 
}: TagStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<'interview' | 'hold'>('interview')
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    if (requisition) {
      onUpdateStatus(requisition.id, selectedStatus, notes || undefined)
      
      toast.success(
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-success mt-0.5" />
          <div>
            <p className="font-semibold">Status Updated</p>
            <p className="text-sm text-muted-foreground">
              {requisition.id} - {requisition.role}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Status changed to {selectedStatus === 'interview' ? 'Interview' : 'Hold'}
            </p>
          </div>
        </div>,
        { duration: 4000 }
      )
      
      resetForm()
      onOpenChange(false)
    }
  }

  const resetForm = () => {
    setSelectedStatus('interview')
    setNotes("")
  }

  if (!requisition) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Update Requisition Status</DialogTitle>
          <DialogDescription>
            Change the status for this approved requisition.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Requisition ID</Label>
              <p className="font-medium">{requisition.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <p className="font-medium">{requisition.role}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Project</Label>
              <p className="font-medium">{requisition.project}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Manager</Label>
              <p className="font-medium">{requisition.manager || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label>Select New Status</Label>
            <RadioGroup 
              value={selectedStatus} 
              onValueChange={(value) => setSelectedStatus(value as 'interview' | 'hold')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="interview" id="interview" />
                <Label htmlFor="interview" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Interview</p>
                    <p className="text-xs text-muted-foreground">Move to active interview stage</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                <RadioGroupItem value="hold" id="hold" />
                <Label htmlFor="hold" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Clock className="h-4 w-4 text-warning" />
                  <div>
                    <p className="font-medium">Hold</p>
                    <p className="text-xs text-muted-foreground">Temporarily pause this requisition</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              Notes
              <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
