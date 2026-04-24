import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, X, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { sendNotificationEmail } from "@/services/notification-service"

interface AttachedFile {
  name: string
  size: number
  type: string
  file: File
}

interface RouteToOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requisition: {
    id: string
    role: string
    project: string
    salary: string
  } | null
  prefillCandidateName?: string
  onCreateOfferRequest: (offerRequest: {
    requisitionId: string
    candidateName: string
    role: string
    project: string
    proposedSalary: string
    comments?: string
    attachments?: AttachedFile[]
  }) => void
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function RouteToOfferDialog({ 
  open, 
  onOpenChange, 
  requisition,
  prefillCandidateName,
  onCreateOfferRequest 
}: RouteToOfferDialogProps) {
  const [candidateName, setCandidateName] = useState(prefillCandidateName || "")
  const [proposedSalary, setProposedSalary] = useState("")
  const [comments, setComments] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && prefillCandidateName) {
      setCandidateName(prefillCandidateName)
    }
  }, [open, prefillCandidateName])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: AttachedFile[] = []

    Array.from(files).forEach(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a valid file type. Only PDF and Word documents are allowed.`,
          variant: "destructive"
        })
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the 10MB size limit.`,
          variant: "destructive"
        })
        return
      }

      newFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        file
      })
    })

    setAttachedFiles(prev => [...prev, ...newFiles])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleSubmit = () => {
    if (!requisition || !candidateName || !proposedSalary) return

    onCreateOfferRequest({
      requisitionId: requisition.id,
      candidateName,
      role: requisition.role,
      project: requisition.project,
      proposedSalary,
      comments: comments || undefined,
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined,
    })

    // Send notification to LOB Head
    sendNotificationEmail({
      type: 'offer_routed',
      recipientEmail: 'lobhead@example.com',
      recipientName: 'LOB Head',
      senderName: 'TAG Manager',
      requisitionId: requisition.id,
      role: requisition.role,
      project: requisition.project,
      candidateName
    })

    toast({
      title: "Offer Routed for Approval",
      description: `Offer request for ${candidateName} has been sent to LOB Head for approval.`,
    })

    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setCandidateName("")
    setProposedSalary("")
    setComments("")
    setAttachedFiles([])
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  if (!requisition) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Route to Offer Approval</DialogTitle>
          <DialogDescription>
            Create an offer request for LOB Head approval before sending to the candidate.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Requisition ID</Label>
              <p className="font-medium text-primary">{requisition.id}</p>
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
              <Label className="text-muted-foreground">Approved Range</Label>
              <p className="font-medium">{requisition.salary}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="candidateName">Candidate Name *</Label>
            <Input
              id="candidateName"
              placeholder="Enter candidate name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="proposedSalary">Proposed Salary (LPA) *</Label>
            <Input
              id="proposedSalary"
              placeholder="e.g., ₹18L"
              value={proposedSalary}
              onChange={(e) => setProposedSalary(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Add any additional notes or comments for the approver..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>Attachments</Label>
            <p className="text-xs text-muted-foreground mb-2">
              PDF or Word documents only (max 10MB each)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach Files
            </Button>

            {attachedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!candidateName || !proposedSalary}>
            <Send className="h-4 w-4 mr-1" />
            Route for Approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
