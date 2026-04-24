import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/integrations/supabase/client"

const DEFAULT_CODES = ["EEN", "Apex", "PRMG", "Weva", "Joulez"]
const normalizeCode = (code: string) => code.trim().toUpperCase()

export function useProjectCodes() {
  const [projectCodes, setProjectCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('project_codes')
      .select('code')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch project codes:', error)
      setProjectCodes(DEFAULT_CODES)
    } else {
      setProjectCodes((data ?? []).map((row) => row.code))
    }

    setLoading(false)
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

    const { error } = await supabase
      .from('project_codes')
      .insert({ code: normalizedCode })

    if (error) {
      console.error('Failed to add project code:', error)
      return false
    }

    await fetchCodes()
    return true
  }, [fetchCodes, projectCodes])

  const removeCode = useCallback(async (code: string) => {
    const normalizedCode = normalizeCode(code)

    const { error } = await supabase
      .from('project_codes')
      .delete()
      .eq('code', normalizedCode)

    if (error) {
      console.error('Failed to remove project code:', error)
      return false
    }

    await fetchCodes()
    return true
  }, [fetchCodes])

  const renameCode = useCallback(async (oldCode: string, newCode: string) => {
    const normalizedOldCode = normalizeCode(oldCode)
    const normalizedNewCode = normalizeCode(newCode)

    if (!normalizedNewCode || normalizedOldCode === normalizedNewCode) return true
    if (projectCodes.some((existingCode) => existingCode.toLowerCase() === normalizedNewCode.toLowerCase())) return false

    const { error } = await supabase
      .from('project_codes')
      .update({ code: normalizedNewCode })
      .eq('code', normalizedOldCode)

    if (error) {
      console.error('Failed to rename project code:', error)
      return false
    }

    await fetchCodes()
    return true
  }, [fetchCodes, projectCodes])

  return { projectCodes, loading, addCode, removeCode, renameCode, refetch: fetchCodes }
}
