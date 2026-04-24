import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProjectCodes } from "@/hooks/use-project-codes"

interface JobDescription {
  id: string
  title: string
  department: string
  level: string
  salaryRange: string
  skills: string[]
  description: string
}

const jobLibrary: JobDescription[] = [
  {
    id: "JD-001",
    title: "Senior React Developer",
    department: "Engineering",
    level: "Senior",
    salaryRange: "₹18L - ₹25L",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    description: "Lead frontend development with React and TypeScript. Build scalable web applications..."
  },
  {
    id: "JD-002",
    title: "UX Designer",
    department: "Design",
    level: "Mid",
    salaryRange: "₹12L - ₹18L",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    description: "Create intuitive user experiences and design systems..."
  },
  {
    id: "JD-003",
    title: "DevOps Engineer",
    department: "Engineering",
    level: "Senior",
    salaryRange: "₹22L - ₹30L",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    description: "Manage cloud infrastructure and deployment pipelines..."
  },
  {
    id: "JD-004",
    title: "Product Manager",
    department: "Product",
    level: "Mid",
    salaryRange: "₹15L - ₹22L",
    skills: ["Product Strategy", "Analytics", "Roadmapping", "Stakeholder Management"],
    description: "Drive product vision and strategy across multiple teams..."
  }
]

interface NewRequisitionFormProps {
  onSubmit: (requisition: any) => void
  userRole?: 'hiring-manager' | 'lob-head' | 'tag-manager'
}

export function NewRequisitionForm({ onSubmit, userRole = 'hiring-manager' }: NewRequisitionFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  const { projectCodes } = useProjectCodes()

  const [formData, setFormData] = useState({
    title: "",
    project: "",
    department: "",
    level: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    description: "",
    justification: "",
    urgency: "medium"
  })

  const filteredJobs = jobLibrary.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleJobSelect = (job: JobDescription) => {
    setSelectedJob(job)
    setFormData({
      title: job.title,
      project: "",
      department: job.department,
      level: job.level,
      salaryMin: job.salaryRange.split(" - ")[0],
      salaryMax: job.salaryRange.split(" - ")[1],
      skills: job.skills.join(", "),
      description: job.description,
      justification: "",
      urgency: "medium"
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate select fields (not covered by HTML required)
    if (!formData.project.trim()) {
      toast({ title: "Missing field", description: "Please select a project.", variant: "destructive" })
      return
    }
    if (!formData.department) {
      toast({ title: "Missing field", description: "Please select a department.", variant: "destructive" })
      return
    }
    if (!formData.level) {
      toast({ title: "Missing field", description: "Please select an experience level.", variant: "destructive" })
      return
    }
    
    const newRequisition = {
      id: `REQ-${String(Date.now()).slice(-3)}`,
      role: formData.title,
      project: formData.project,
      manager: "Current User",
      lob: formData.department,
      level: formData.level,
      status: "draft",
      createdDate: new Date().toISOString().split('T')[0],
      salary: `${formData.salaryMin} - ${formData.salaryMax}`,
      skills: formData.skills,
      description: formData.description,
      justification: formData.justification,
      urgency: formData.urgency
    }

    onSubmit(newRequisition)
    setOpen(false)
    setSelectedJob(null)
    setCustomMode(false)
    setFormData({
      title: "",
      project: "",
      department: "",
      level: "",
      salaryMin: "",
      salaryMax: "",
      skills: "",
      description: "",
      justification: "",
      urgency: "medium"
    })

    toast({
      title: "Requisition Created",
      description: `Job requisition ${newRequisition.id} has been created successfully.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          New Requisition
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job Requisition</DialogTitle>
        </DialogHeader>

        {!selectedJob && !customMode && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search job descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setCustomMode(true)}>
                Create Custom
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="cursor-pointer hover:shadow-card transition-smooth" onClick={() => handleJobSelect(job)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{job.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>{job.department} • {job.level}</p>
                      {userRole !== 'hiring-manager' && <p>{job.salaryRange}</p>}
                      <p>{job.skills.slice(0, 3).join(", ")}{job.skills.length > 3 ? "..." : ""}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(selectedJob || customMode) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {selectedJob ? `Using: ${selectedJob.title}` : "Custom Job Requisition"}
              </h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSelectedJob(null)
                  setCustomMode(false)
                  setFormData({
                    title: "",
                    project: "",
                    department: "",
                    level: "",
                    salaryMin: "",
                    salaryMax: "",
                    skills: "",
                    description: "",
                    justification: "",
                    urgency: "medium"
                  })
                }}
              >
                Back to Library
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="project">Project</Label>
                <Select value={formData.project} onValueChange={(value) => setFormData({...formData, project: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectCodes.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department/LOB</Label>
                <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Analytics">Analytics</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="level">Experience Level</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Junior">Junior (0-2 years)</SelectItem>
                    <SelectItem value="Mid">Mid (2-5 years)</SelectItem>
                    <SelectItem value="Senior">Senior (5+ years)</SelectItem>
                    <SelectItem value="Lead">Lead (8+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {userRole !== 'hiring-manager' && (
              <div>
                <Label htmlFor="salaryMax">Salary Range (Max)</Label>
                <Input
                  id="salaryMax"
                  placeholder="₹15L"
                  value={formData.salaryMax}
                  onChange={(e) => setFormData({...formData, salaryMax: e.target.value})}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="skills">Required Skills</Label>
              <Input
                id="skills"
                placeholder="React, TypeScript, Node.js, AWS"
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed job description, responsibilities, and requirements..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="justification">Business Justification</Label>
              <Textarea
                id="justification"
                placeholder="Why is this role needed? How does it align with business objectives?"
                value={formData.justification}
                onChange={(e) => setFormData({...formData, justification: e.target.value})}
                rows={3}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary text-primary-foreground">
                Create Requisition
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}