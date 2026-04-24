import { useState, useCallback } from "react"
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh"
import { Navigation } from "@/components/dashboard/navigation"
import { MetricCard } from "@/components/dashboard/metric-card"
import { RequisitionTable } from "@/components/dashboard/requisition-table"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { Settings } from "@/components/dashboard/settings"
import { OffersReleased } from "@/components/dashboard/offers-released"
import { OfferApprovalTable, type OfferRequest } from "@/components/dashboard/offer-approval-table"
import { RouteToOfferDialog } from "@/components/dashboard/route-to-offer-dialog"
import { AuditProvider } from "@/contexts/audit-context"
import { OffersProvider } from "@/contexts/offers-context"
import { Users, FileText, CheckCircle, Clock, UserCheck, IndianRupee } from "lucide-react"
import type { UserRole } from "@/components/dashboard/navigation"
import type { InterviewTagState } from "@/components/dashboard/interview-tag-dialog"
import type { Candidate } from "@/types/candidate"
import { useRequisitions, type Requisition } from "@/hooks/use-requisitions"
import { useOffers as useOffersHook } from "@/hooks/use-offers"
import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardProps {
  userRole: UserRole
  onLogout: () => void
}

export default function Dashboard({ userRole, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { requisitions, loading: reqLoading, addRequisition, updateRequisition, refetch: refetchRequisitions } = useRequisitions()
  const { offerRequests, loading: offLoading, addOfferRequest, updateOfferRequest, refetch: refetchOffers } = useOffersHook()

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchRequisitions(), refetchOffers()])
  }, [refetchRequisitions, refetchOffers])

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: handleRefresh })

  const [routeToOfferDialogOpen, setRouteToOfferDialogOpen] = useState(false)
  const [selectedRequisitionForOffer, setSelectedRequisitionForOffer] = useState<Requisition | null>(null)
  const [prefillCandidateName, setPrefillCandidateName] = useState("")

  const handleAddRequisition = useCallback((newRequisition: any) => {
    addRequisition(newRequisition)
  }, [addRequisition])

  const handleUpdateRequisition = useCallback((id: string, updates: Partial<Requisition>) => {
    updateRequisition(id, updates)
  }, [updateRequisition])

  const handleRouteToOffer = useCallback((requisition: Requisition) => {
    setSelectedRequisitionForOffer(requisition)
    setPrefillCandidateName("")
    setRouteToOfferDialogOpen(true)
  }, [])

  const handleUpdateInterviewState = useCallback((id: string, state: InterviewTagState) => {
    updateRequisition(id, { interviewState: state })
  }, [updateRequisition])

  const handleUpdateCandidates = useCallback((id: string, candidates: Candidate[]) => {
    updateRequisition(id, { candidates })
    
    // Auto-update requisition status based on candidate states
    if (candidates.length > 0) {
      const allRejected = candidates.every(c => c.interviewState.isRejected)
      const allOnHold = candidates.every(c => c.interviewState.isOnHold)
      if (allRejected) {
        updateRequisition(id, { status: 'rejected' })
      } else if (allOnHold) {
        updateRequisition(id, { status: 'hold' })
      }
    }
  }, [updateRequisition])

  const handleRouteCandidateToOffer = useCallback((requisition: Requisition, candidate: Candidate) => {
    setSelectedRequisitionForOffer(requisition)
    setPrefillCandidateName(candidate.name)
    setRouteToOfferDialogOpen(true)
  }, [])

  const handleCreateOfferRequest = useCallback((offerData: {
    requisitionId: string
    candidateName: string
    role: string
    project: string
    proposedSalary: string
    comments?: string
    attachments?: { name: string; size: number; type: string }[]
  }) => {
    const newOffer: OfferRequest = {
      id: `OFF-${Date.now()}`,
      ...offerData,
      requestedDate: new Date().toISOString().split('T')[0],
      requestedBy: "TAG Manager",
      status: 'pending-approval',
    }
    addOfferRequest(newOffer)
  }, [addOfferRequest])

  const handleUpdateOffer = useCallback((id: string, updates: Partial<OfferRequest>) => {
    updateOfferRequest(id, updates)
  }, [updateOfferRequest])

  const loading = reqLoading || offLoading

  const getMetricsForRole = () => {
    switch (userRole) {
      case 'hiring-manager':
        return [
          { title: "My Requisitions", value: requisitions.length, description: `${requisitions.filter(r => r.status === 'pending').length} pending approval`, icon: FileText, trend: { value: 2, isPositive: true }, variant: "primary" as const },
          { title: "Draft Requisitions", value: requisitions.filter(r => r.status === 'draft').length, description: "Needs completion", icon: Clock, trend: { value: 1, isPositive: false }, variant: "warning" as const },
          { title: "Approved", value: requisitions.filter(r => r.status === 'approved').length, description: "Ready for posting", icon: CheckCircle, trend: { value: 5, isPositive: true }, variant: "success" as const },
          { title: "Offers Released", value: offerRequests.filter(o => ['offer-sent', 'accepted', 'declined'].includes(o.status)).length, description: "Across all roles", icon: UserCheck, trend: { value: 4, isPositive: true }, variant: "default" as const }
        ]
      case 'lob-head':
        return [
          { title: "Pending Approvals", value: requisitions.filter(req => req.status === 'pending').length, description: "Requires your review", icon: Clock, trend: { value: 3, isPositive: true }, variant: "warning" as const },
          { title: "Sum of LPA's Approved", value: "₹2.4Cr", description: "Avg LPA per role: ₹16L", icon: IndianRupee, trend: { value: 15, isPositive: true }, variant: "primary" as const },
          { title: "Approved", value: requisitions.filter(r => r.status === 'approved').length, description: "Requisitions approved", icon: CheckCircle, trend: { value: 5, isPositive: true }, variant: "success" as const },
          { title: "Team Headcount", value: 142, description: "Current team size", icon: Users, trend: { value: 12, isPositive: true }, variant: "default" as const }
        ]
      case 'tag-manager':
        return [
          { title: "Active Requisitions", value: requisitions.filter(r => !['draft', 'rejected'].includes(r.status)).length, description: "Open positions", icon: FileText, trend: { value: 12, isPositive: true }, variant: "primary" as const },
          { title: "Candidates in Pipeline", value: requisitions.reduce((sum, r) => sum + (r.candidates?.length ?? 0), 0), description: "Across all roles", icon: Users, trend: { value: 15, isPositive: true }, variant: "success" as const },
          { title: "Offers Released", value: offerRequests.filter(o => ['offer-sent', 'accepted', 'declined'].includes(o.status)).length, description: "Awaiting responses", icon: CheckCircle, trend: { value: 8, isPositive: true }, variant: "warning" as const },
          { title: "Placements", value: offerRequests.filter(o => o.status === 'accepted').length, description: "Accepted offers", icon: UserCheck, trend: { value: 15, isPositive: true }, variant: "default" as const }
        ]
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton nav bar */}
        <nav className="bg-card border-b border-border">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 sm:h-10 w-8 sm:w-10 rounded" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="hidden lg:flex space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-9 w-28 rounded-md" />
                ))}
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="hidden md:flex flex-col gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </div>
          </div>
        </nav>
        {/* Skeleton content */}
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="mt-6 bg-card rounded-lg border border-border p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-48 w-full rounded" />
          </div>
        </main>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        const metrics = getMetricsForRole()
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </div>
            <DashboardCharts />
            <RequisitionTable
              requisitions={requisitions}
              onAddRequisition={handleAddRequisition}
              onUpdateRequisition={handleUpdateRequisition}
              userRole={userRole}
              onRouteToOffer={handleRouteToOffer}
              onUpdateInterviewState={handleUpdateInterviewState}
              onUpdateCandidates={handleUpdateCandidates}
              onRouteCandidateToOffer={handleRouteCandidateToOffer}
            />
          </div>
        )
      case 'requisitions':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">
              {userRole === 'hiring-manager' ? 'My Requisitions' : 'All Requisitions'}
            </h2>
            <RequisitionTable
              requisitions={requisitions}
              onAddRequisition={handleAddRequisition}
              onUpdateRequisition={handleUpdateRequisition}
              userRole={userRole}
              onRouteToOffer={handleRouteToOffer}
              onUpdateInterviewState={handleUpdateInterviewState}
              onUpdateCandidates={handleUpdateCandidates}
              onRouteCandidateToOffer={handleRouteCandidateToOffer}
            />
          </div>
        )
      case 'approvals':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Requisition Approvals</h2>
            <RequisitionTable
              requisitions={requisitions.filter(req => req.status === 'pending')}
              onAddRequisition={handleAddRequisition}
              onUpdateRequisition={handleUpdateRequisition}
              userRole={userRole}
              showApprovalActions
            />
          </div>
        )
      case 'candidates':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Candidate Pool</h2>
            <p className="text-muted-foreground">Candidate management features coming soon...</p>
          </div>
        )
      case 'offer-approvals':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Offer Approvals</h2>
            <OfferApprovalTable offerRequests={offerRequests} onUpdateOffer={handleUpdateOffer} userRole={userRole} />
          </div>
        )
      case 'offer-pipeline':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Offer Pipeline</h2>
            <OfferApprovalTable offerRequests={offerRequests} onUpdateOffer={handleUpdateOffer} userRole={userRole} />
          </div>
        )
      case 'job-library':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Job Description Library</h2>
            <p className="text-muted-foreground">Job description library coming soon...</p>
          </div>
        )
      case 'offers-released':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Offers Released</h2>
            <OffersReleased
              userRole={userRole}
              onRequisitionStatusChange={(reqId, status) => {
                handleUpdateRequisition(reqId, { status: status as any })
              }}
            />
          </div>
        )
      case 'settings':
        return <Settings userRole={userRole} />
      default:
        return null
    }
  }

  return (
    <AuditProvider>
      <OffersProvider>
        <div className="min-h-screen bg-background" ref={containerRef}>
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} userRole={userRole} onLogout={onLogout} />
          {/* Pull-to-refresh indicator */}
          {(pullDistance > 0 || refreshing) && (
            <div
              className="flex items-center justify-center overflow-hidden transition-all"
              style={{ height: pullDistance }}
            >
              <Loader2 className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`} style={{ opacity: Math.min(pullDistance / 60, 1) }} />
              <span className="ml-2 text-xs text-muted-foreground">
                {refreshing ? "Refreshing..." : pullDistance >= 80 ? "Release to refresh" : "Pull to refresh"}
              </span>
            </div>
          )}
          <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {renderContent()}
          </main>
          <RouteToOfferDialog
            open={routeToOfferDialogOpen}
            onOpenChange={(open) => {
              setRouteToOfferDialogOpen(open)
              if (!open) setPrefillCandidateName("")
            }}
            requisition={selectedRequisitionForOffer}
            prefillCandidateName={prefillCandidateName}
            onCreateOfferRequest={handleCreateOfferRequest}
          />
        </div>
      </OffersProvider>
    </AuditProvider>
  )
}
