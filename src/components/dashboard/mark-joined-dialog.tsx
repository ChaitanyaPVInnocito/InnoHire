 import { useState } from "react"
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog"
 import { Button } from "@/components/ui/button"
 import { Label } from "@/components/ui/label"
 import { Calendar } from "@/components/ui/calendar"
 import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
 import { CalendarIcon, UserCheck } from "lucide-react"
 import { format } from "date-fns"
 import { cn } from "@/lib/utils"
 
 interface MarkJoinedDialogProps {
   open: boolean
   onOpenChange: (open: boolean) => void
   candidateName: string
   expectedJoiningDate: string
   onConfirm: (joinedDate: string) => void
 }
 
 export function MarkJoinedDialog({
   open,
   onOpenChange,
   candidateName,
   expectedJoiningDate,
   onConfirm
 }: MarkJoinedDialogProps) {
   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
   const [calendarOpen, setCalendarOpen] = useState(false)
 
   const handleConfirm = () => {
     if (!selectedDate) return
     const formattedDate = format(selectedDate, 'yyyy-MM-dd')
     onConfirm(formattedDate)
     onOpenChange(false)
   }
 
   const handleOpenChange = (isOpen: boolean) => {
     if (!isOpen) {
       setSelectedDate(new Date())
     }
     onOpenChange(isOpen)
   }
 
   return (
     <Dialog open={open} onOpenChange={handleOpenChange}>
       <DialogContent className="sm:max-w-md">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-2">
             <UserCheck className="h-5 w-5 text-success" />
             Mark as Joined
           </DialogTitle>
           <DialogDescription>
             Confirm that <span className="font-medium">{candidateName}</span> has joined.
             Expected joining date was {new Date(expectedJoiningDate).toLocaleDateString('en-IN')}.
           </DialogDescription>
         </DialogHeader>
 
         <div className="space-y-4 py-4">
           <div className="space-y-2">
             <Label>Actual Joining Date *</Label>
             <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
               <PopoverTrigger asChild>
                 <Button
                   variant="outline"
                   className={cn(
                     "w-full justify-start text-left font-normal",
                     !selectedDate && "text-muted-foreground"
                   )}
                 >
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="start">
                 <Calendar
                   mode="single"
                   selected={selectedDate}
                   onSelect={(date) => {
                     setSelectedDate(date)
                     setCalendarOpen(false)
                   }}
                   initialFocus
                   className={cn("p-3 pointer-events-auto")}
                 />
               </PopoverContent>
             </Popover>
             <p className="text-xs text-muted-foreground">
               Select the actual date when the candidate started working.
             </p>
           </div>
         </div>
 
         <DialogFooter>
           <Button variant="outline" onClick={() => handleOpenChange(false)}>
             Cancel
           </Button>
           <Button 
             onClick={handleConfirm} 
             disabled={!selectedDate}
             className="bg-success hover:bg-success/90"
           >
             <UserCheck className="h-4 w-4 mr-1" />
             Confirm Joined
           </Button>
         </DialogFooter>
       </DialogContent>
     </Dialog>
   )
 }