import { useEffect, useRef, useCallback, useState } from 'react'
import { DemoService } from '@/lib/demo/demo-service'
import { createClient } from '@/lib/supabase/client'

interface UseAutoSaveOptions {
  interval?: number // milliseconds
  debounceDelay?: number // milliseconds
  onSave?: (data: any) => Promise<void>
  onError?: (error: Error) => void
  onSuccess?: () => void
  enabled?: boolean
}

export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
) {
  const {
    interval = 30000, // 30 seconds
    debounceDelay = 1000, // 1 second
    onSave,
    onError,
    onSuccess,
    enabled = true
  } = options

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const dataRef = useRef(data)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>('')

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data
  }, [data])

  // Save function
  const save = useCallback(async () => {
    if (!enabled || saving) return

    const currentData = JSON.stringify(dataRef.current)
    
    // Skip if data hasn't changed
    if (currentData === lastSavedDataRef.current) {
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      // Call the provided save function or onSave
      if (onSave) {
        await onSave(dataRef.current)
      } else {
        await saveFunction(dataRef.current)
      }
      
      lastSavedDataRef.current = currentData
      setLastSaved(new Date())
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const error = err as Error
      setError(error)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setSaving(false)
    }
  }, [enabled, saveFunction, onSave, onError, onSuccess, saving])

  // Debounced save on data change
  useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      save()
    }, debounceDelay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, debounceDelay, save])

  // Periodic auto-save
  useEffect(() => {
    if (!enabled || interval <= 0) return

    intervalRef.current = setInterval(() => {
      save()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [enabled, interval, save])

  // Save on unmount
  useEffect(() => {
    return () => {
      // Save any pending changes when component unmounts
      if (enabled && !saving) {
        save()
      }
    }
  }, [enabled, saving, save])

  // Manual save trigger
  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    return save()
  }, [save])

  return {
    saving,
    lastSaved,
    error,
    triggerSave
  }
}

// Specialized hook for application forms
export function useApplicationAutoSave(
  applicationId: string | null,
  formData: any,
  options: UseAutoSaveOptions = {}
) {
  const supabase = createClient()
  
  const saveFunction = async (data: any) => {
    if (!applicationId) return

    if (DemoService.isDemoMode()) {
      // Simulate save in demo mode
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Auto-saved (demo mode):', data)
    } else {
      const { error } = await supabase
        .from('applications')
        .update({
          form_data: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) {
        throw error
      }
    }
  }

  return useAutoSave(formData, saveFunction, {
    ...options,
    enabled: !!applicationId && (options.enabled ?? true)
  })
}