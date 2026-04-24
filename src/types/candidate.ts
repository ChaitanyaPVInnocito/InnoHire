// Candidate types for multi-candidate interview management

export type InterviewLevel = 'L1' | 'L2' | 'L3' | 'L4'
export type TagStatus = 'selected' | 'rejected' | 'hold'

export interface InterviewRound {
  level: InterviewLevel
  status: TagStatus
  locked: boolean
}

export interface CandidateInterviewState {
  rounds: InterviewRound[]
  currentLevel: InterviewLevel | null
  hasFurtherRounds: boolean | null
  isRejected: boolean
  isOnHold: boolean
  canRouteToOffer: boolean
}

export interface Candidate {
  id: string
  name: string
  email?: string
  phone?: string
  addedDate: string
  interviewState: CandidateInterviewState
  isRoutedToOffer: boolean
  notes?: string
}

export const getDefaultInterviewState = (): CandidateInterviewState => ({
  rounds: [],
  currentLevel: null,
  hasFurtherRounds: null,
  isRejected: false,
  isOnHold: false,
  canRouteToOffer: false,
})

export const interviewLevels: { value: InterviewLevel; label: string }[] = [
  { value: 'L1', label: 'L1 Interview' },
  { value: 'L2', label: 'L2 Interview' },
  { value: 'L3', label: 'L3 Interview' },
  { value: 'L4', label: 'L4 Interview' },
]

export const getNextLevel = (current: InterviewLevel): InterviewLevel | null => {
  const levels: InterviewLevel[] = ['L1', 'L2', 'L3', 'L4']
  const currentIndex = levels.indexOf(current)
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null
}
