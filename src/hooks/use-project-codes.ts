import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/api/client"

const DEFAULT_CODES = ["EEN", "Apex", "PRMG", "Weva", "Joulez"]
const normalizeCode = (code: string) => code.trim().toUpperCase()

export function useProjectCodes() {
  const [projectCodes, setProjectCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCodes = useCallback(async () => {
    try {
      const response = await apiClient.get('/project-codes')
      setProjectCodes((response.data ?? []).map((row: any) => row.code))
    } catch (error) {
      console.error('Failed to fetch project codes:', error)
      setProjectCodes(DEFAULT_CODES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const addCode = useCallback(async (code: string) => {
    const normalizedCode = normalizeCode(code)
    if (!normalizedCode) return false
    if (projectCodes.some((existingCode) => existingCode.toLowerCase() === normalizedCode.toLowerCase())) {
      return false
    }

    try {
      await apiClient.post('/project-codes', { code: normalizedCode })
      await fetchCodes()
      return true
    } catch (error) {
       console.error('Failed to add project code:', error)
       return false
    }
  }, [fetchCodes, projectCodes])

  const removeCode = useCallback(async (code: string) => {
    const normalizedCode = normalizeCode(code)
    try {
      await apiClient.delete(`/project-codes/${normalizedCode}`)
      await fetchCodes()
      return true
    } catch (error) {
      console.error('Failed to remove project code:', error)
      return false
    }
  }, [fetchCodes])

  const renameCode = useCallback(async (oldCode: string, newCode: string) => {
    const normalizedOldCode = normalizeCode(oldCode)
    const normalizedNewCode = normalizeCode(newCode)

    if (!normalizedNewCode || normalizedOldCode === normalizedNewCode) return true
    if (projectCodes.some((existingCode) => existingCode.toLowerCase() === normalizedNewCode.toLowerCase())) return false

    try {
      await apiClient.put(`/project-codes/${normalizedOldCode}`, { code: normalizedNewCode })
      await fetchCodes()
      return true
    } catch (error) {
      console.error('Failed to rename project code:', error)
      return false
    }
  }, [fetchCodes, projectCodes])

  return { projectCodes, loading, addCode, removeCode, renameCode, refetch: fetchCodes }
}
