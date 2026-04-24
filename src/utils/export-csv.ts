 import type { PersistedOffer } from "@/contexts/offers-context"
 
 interface ExportableOffer {
   requisitionId: string
   offerId: string
   candidateName: string
   role: string
   project: string
   offerDate: string
   joiningDate: string
   joinedDate: string
   salary: string
   status: string
 }
 
 function formatStatus(status: PersistedOffer['status']): string {
   switch (status) {
     case 'pending-approval': return 'Pending Approval'
     case 'approved': return 'Approved'
     case 'offer-sent': return 'Offer Sent'
     case 'accepted': return 'Accepted'
     case 'rejected': return 'Rejected'
     case 'no-show': return 'No Show'
     case 'backed-out': return 'Backed Out'
     case 'joining-date-revised': return 'Date Revised'
     case 'joined': return 'Joined'
     default: return status
   }
 }
 
 function formatDate(dateStr: string | undefined): string {
   if (!dateStr) return ''
   try {
     return new Date(dateStr).toLocaleDateString('en-IN')
   } catch {
     return dateStr
   }
 }
 
 function escapeCSVValue(value: string): string {
   // If value contains comma, newline, or quote, wrap in quotes and escape quotes
   if (value.includes(',') || value.includes('\n') || value.includes('"')) {
     return `"${value.replace(/"/g, '""')}"`
   }
   return value
 }
 
 export function exportOffersToCSV(offers: PersistedOffer[], hideSalary: boolean = false): void {
   const exportData: ExportableOffer[] = offers.map(offer => ({
     requisitionId: offer.requisitionId,
     offerId: offer.id,
     candidateName: offer.candidateName,
     role: offer.role,
     project: offer.project,
     offerDate: formatDate(offer.requestedDate),
     joiningDate: formatDate(offer.joiningDate),
     joinedDate: formatDate(offer.joinedDate),
     salary: hideSalary ? 'Hidden' : offer.proposedSalary,
     status: formatStatus(offer.status)
   }))
 
   // Define headers
   const headers = [
     'Requisition ID',
     'Offer ID',
     'Candidate Name',
     'Role',
     'Project',
     'Offer Date',
     'Joining Date',
     'Joined Date',
     'Salary',
     'Status'
   ]
 
   // Build CSV content
   const csvRows: string[] = []
   csvRows.push(headers.map(escapeCSVValue).join(','))
 
   exportData.forEach(row => {
     const values = [
       row.requisitionId,
       row.offerId,
       row.candidateName,
       row.role,
       row.project,
       row.offerDate,
       row.joiningDate,
       row.joinedDate,
       row.salary,
       row.status
     ]
     csvRows.push(values.map(escapeCSVValue).join(','))
   })
 
   const csvContent = csvRows.join('\n')
 
   // Create and download file
   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
   const url = URL.createObjectURL(blob)
   const link = document.createElement('a')
   link.setAttribute('href', url)
   link.setAttribute('download', `offers-released-${new Date().toISOString().split('T')[0]}.csv`)
   document.body.appendChild(link)
   link.click()
   document.body.removeChild(link)
   URL.revokeObjectURL(url)
 }
 
 export function exportOffersToExcel(offers: PersistedOffer[], hideSalary: boolean = false): void {
   // For Excel, we create an HTML table that Excel can open
   const exportData = offers.map(offer => ({
     requisitionId: offer.requisitionId,
     offerId: offer.id,
     candidateName: offer.candidateName,
     role: offer.role,
     project: offer.project,
     offerDate: formatDate(offer.requestedDate),
     joiningDate: formatDate(offer.joiningDate),
     joinedDate: formatDate(offer.joinedDate),
     salary: hideSalary ? 'Hidden' : offer.proposedSalary,
     status: formatStatus(offer.status)
   }))
 
   const headers = [
     'Requisition ID',
     'Offer ID', 
     'Candidate Name',
     'Role',
     'Project',
     'Offer Date',
     'Joining Date',
     'Joined Date',
     'Salary',
     'Status'
   ]
 
   let htmlContent = `
     <html xmlns:o="urn:schemas-microsoft-com:office:office" 
           xmlns:x="urn:schemas-microsoft-com:office:excel" 
           xmlns="http://www.w3.org/TR/REC-html40">
     <head>
       <meta charset="utf-8">
       <!--[if gte mso 9]>
       <xml>
         <x:ExcelWorkbook>
           <x:ExcelWorksheets>
             <x:ExcelWorksheet>
               <x:Name>Offers Released</x:Name>
               <x:WorksheetOptions>
                 <x:DisplayGridlines/>
               </x:WorksheetOptions>
             </x:ExcelWorksheet>
           </x:ExcelWorksheets>
         </x:ExcelWorkbook>
       </xml>
       <![endif]-->
       <style>
         table { border-collapse: collapse; }
         th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
         th { background-color: #4472C4; color: white; font-weight: bold; }
         tr:nth-child(even) { background-color: #f2f2f2; }
       </style>
     </head>
     <body>
       <table>
         <thead>
           <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
         </thead>
         <tbody>
   `
 
   exportData.forEach(row => {
     htmlContent += `
           <tr>
             <td>${row.requisitionId}</td>
             <td>${row.offerId}</td>
             <td>${row.candidateName}</td>
             <td>${row.role}</td>
             <td>${row.project}</td>
             <td>${row.offerDate}</td>
             <td>${row.joiningDate}</td>
             <td>${row.joinedDate}</td>
             <td>${row.salary}</td>
             <td>${row.status}</td>
           </tr>
     `
   })
 
   htmlContent += `
         </tbody>
       </table>
     </body>
     </html>
   `
 
   const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
   const url = URL.createObjectURL(blob)
   const link = document.createElement('a')
   link.setAttribute('href', url)
   link.setAttribute('download', `offers-released-${new Date().toISOString().split('T')[0]}.xls`)
   document.body.appendChild(link)
   link.click()
   document.body.removeChild(link)
   URL.revokeObjectURL(url)
 }