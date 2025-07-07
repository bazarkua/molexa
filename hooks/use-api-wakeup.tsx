// hooks/use-api-wakeup.tsx
// Fixed version that actually waits for API confirmation before proceeding

import { useState, useEffect, useCallback, useRef } from 'react'
import { checkAndWakeUpAPI, wakeUpAPI } from '@/lib/api'

export interface ApiWakeupState {
  isAwake: boolean
  isWakingUp: boolean
  isLoading: boolean
  progress: number
  step: string
  responseTime: number
  error?: string
  lastChecked: number
  apiStatus: 'unknown' | 'checking' | 'awake' | 'sleeping' | 'down' | 'error'
  // NEW: Add a field to track if we should block the app
  shouldBlockApp: boolean
  attemptCount: number
}

export interface ApiWakeupResult extends ApiWakeupState {
  checkApiStatus: () => Promise<boolean>
  wakeUpApiManually: () => Promise<boolean>
  resetState: () => void
  forceSkip: () => void // NEW: Force skip the API check
}

const WAKEUP_TIMEOUT = 45000 // 45 seconds max
const MAX_RETRY_ATTEMPTS = 3

export function useApiWakeup(autoCheck = true): ApiWakeupResult {
  const [state, setState] = useState<ApiWakeupState>({
    isAwake: false,
    isWakingUp: false,
    isLoading: autoCheck, // Start loading if auto-checking
    progress: 0,
    step: "",
    responseTime: 0,
    lastChecked: 0,
    apiStatus: 'unknown',
    shouldBlockApp: autoCheck, // NEW: Block app until API is confirmed or skipped
    attemptCount: 0
  })

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Safe state update that checks if component is still mounted
  const safeSetState = useCallback((update: Partial<ApiWakeupState> | ((prev: ApiWakeupState) => ApiWakeupState)) => {
    if (mountedRef.current) {
      setState(update as any)
    }
  }, [])

  // Update progress and step with smooth transitions
  const updateProgress = useCallback((progress: number, step: string, apiStatus?: ApiWakeupState['apiStatus']) => {
    safeSetState(prev => ({
      ...prev,
      progress,
      step,
      ...(apiStatus && { apiStatus })
    }))
  }, [safeSetState])

  // Determine API status from response
  const determineApiStatus = (success: boolean, responseTime: number, error?: string): ApiWakeupState['apiStatus'] => {
    if (success) {
      return responseTime < 3000 ? 'awake' : 'sleeping'
    }
    
    if (error) {
      if (error.includes('timeout') || error.includes('cold start')) {
        return 'sleeping'
      }
      if (error.includes('ENOTFOUND') || error.includes('ECONNREFUSED') || error.includes('fetch')) {
        return 'down'
      }
      return 'error'
    }
    
    return 'down'
  }

  // NEW: Force skip API check and proceed with app
  const forceSkip = useCallback(() => {
    console.log('🚀 Force skipping API check - proceeding with app')
    
    safeSetState(prev => ({
      ...prev,
      isLoading: false,
      isWakingUp: false,
      shouldBlockApp: false, // This is the key - unblock the app
      progress: 100,
      step: "Skipped API check - continuing with limited functionality",
      apiStatus: 'unknown'
    }))
  }, [safeSetState])

  // Get appropriate step message for API status
  const getStepForStatus = (status: ApiWakeupState['apiStatus']): string => {
    switch (status) {
      case 'awake':
        return "API is ready and responsive!"
      case 'sleeping':
        return "API was sleeping but should be awake now"
      case 'down':
        return "API appears to be offline"
      case 'error':
        return "API connection issues detected"
      case 'checking':
        return "Checking API connectivity..."
      default:
        return "API status unknown"
    }
  }

  // Check if API is awake (quick check)
  const checkApiStatus = useCallback(async (): Promise<boolean> => {
    console.log('🔍 Checking API status...')
    
    safeSetState(prev => ({
      ...prev,
      isLoading: true,
      progress: 10,
      step: "Testing API connection...",
      error: undefined,
      apiStatus: 'checking',
      attemptCount: prev.attemptCount + 1
    }))

    try {
      const result = await checkAndWakeUpAPI()
      const apiStatus = determineApiStatus(result.isAwake, result.responseTime, result.error)
      
      safeSetState(prev => ({
        ...prev,
        isAwake: result.isAwake,
        isLoading: false,
        shouldBlockApp: false, // API responded, unblock app
        responseTime: result.responseTime,
        lastChecked: Date.now(),
        progress: 100,
        step: getStepForStatus(apiStatus),
        error: result.error,
        apiStatus
      }))

      console.log(`🔍 API Status Check: ${apiStatus} (${result.responseTime}ms)`)
      return result.isAwake
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      
      safeSetState(prev => ({
        ...prev,
        isAwake: false,
        isLoading: false,
        shouldBlockApp: true, // Keep blocking if API check failed
        error: errorMessage,
        lastChecked: Date.now(),
        step: "Failed to connect to API",
        progress: 100,
        apiStatus: 'down'
      }))

      console.error('❌ API Status Check Failed:', errorMessage)
      return false
    }
  }, [safeSetState])

  // Wake up the API (full process with retries)
  const wakeUpApiManually = useCallback(async (): Promise<boolean> => {
    console.log('🚀 Starting API wake-up process...')
    
    safeSetState(prev => ({
      ...prev,
      isWakingUp: true,
      isLoading: true,
      shouldBlockApp: true, // Block app during wake-up
      progress: 0,
      error: undefined,
      apiStatus: 'checking',
      attemptCount: prev.attemptCount + 1
    }))

    try {
      // Step 1: Initial check
      updateProgress(20, "Performing initial API health check...", 'checking')
      const quickCheck = await checkAndWakeUpAPI()
      
      if (quickCheck.isAwake && quickCheck.responseTime < 3000) {
        const apiStatus = 'awake'
        updateProgress(100, getStepForStatus(apiStatus), apiStatus)
        
        safeSetState(prev => ({
          ...prev,
          isAwake: true,
          isWakingUp: false,
          isLoading: false,
          shouldBlockApp: false, // API is awake, unblock app
          responseTime: quickCheck.responseTime,
          lastChecked: Date.now(),
          apiStatus
        }))

        return true
      }

      // Step 2: API appears to be asleep or slow
      const initialStatus = determineApiStatus(quickCheck.isAwake, quickCheck.responseTime, quickCheck.error)
      
      if (initialStatus === 'down') {
        updateProgress(100, "API appears to be offline", 'down')
        
        safeSetState(prev => ({
          ...prev,
          isAwake: false,
          isWakingUp: false,
          isLoading: false,
          shouldBlockApp: true, // Keep blocking - API is down
          responseTime: quickCheck.responseTime,
          lastChecked: Date.now(),
          apiStatus: 'down',
          error: 'API is offline or unreachable'
        }))
        
        return false
      }

      updateProgress(40, "API detected as sleeping - sending wake-up signal...", 'sleeping')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 3: Send wake-up request with timeout
      updateProgress(60, "Waking up serverless functions...")
      
      const wakeupResult = await Promise.race([
        wakeUpAPI(),
        new Promise<{ success: false; error: string; responseTime: number }>((_, reject) => 
          setTimeout(() => reject(new Error('Wake-up timeout - API may be down')), WAKEUP_TIMEOUT)
        )
      ])

      if (wakeupResult.success) {
        const finalStatus = wakeupResult.responseTime < 3000 ? 'awake' : 'sleeping'
        updateProgress(100, getStepForStatus(finalStatus), finalStatus)
        
        safeSetState(prev => ({
          ...prev,
          isAwake: true,
          isWakingUp: false,
          isLoading: false,
          shouldBlockApp: false, // API is responsive, unblock app
          responseTime: wakeupResult.responseTime,
          lastChecked: Date.now(),
          apiStatus: finalStatus
        }))

        console.log(`✅ API wake-up successful: ${finalStatus} (${wakeupResult.responseTime}ms)`)
        return true
      } else {
        throw new Error(wakeupResult.error || 'Wake-up failed')
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const apiStatus = errorMessage.includes('timeout') ? 'sleeping' : 'down'
      
      console.error('❌ API wake-up failed:', errorMessage)
      
      updateProgress(100, getStepForStatus(apiStatus), apiStatus)
      
      safeSetState(prev => ({
        ...prev,
        isAwake: false,
        isWakingUp: false,
        isLoading: false,
        shouldBlockApp: true, // Keep blocking - wake-up failed
        error: errorMessage,
        lastChecked: Date.now(),
        apiStatus
      }))

      return false
    }
  }, [updateProgress, safeSetState])

  // Reset state
  const resetState = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    
    safeSetState({
      isAwake: false,
      isWakingUp: false,
      isLoading: false,
      progress: 0,
      step: "",
      responseTime: 0,
      lastChecked: 0,
      error: undefined,
      apiStatus: 'unknown',
      shouldBlockApp: false,
      attemptCount: 0
    })
  }, [safeSetState])

  // Auto-retry logic when API check fails
  const scheduleRetry = useCallback((attempt: number) => {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      console.log('❌ Max retry attempts reached, keeping app blocked')
      safeSetState(prev => ({
        ...prev,
        shouldBlockApp: true,
        step: `API unreachable after ${MAX_RETRY_ATTEMPTS} attempts`,
        progress: 100
      }))
      return
    }

    const retryDelay = Math.min(5000 * Math.pow(1.5, attempt), 15000) // 5s, 7.5s, 11.25s, 15s max
    
    updateProgress(30, `Retrying in ${Math.ceil(retryDelay / 1000)} seconds... (${attempt + 1}/${MAX_RETRY_ATTEMPTS})`)
    
    retryTimeoutRef.current = setTimeout(async () => {
      console.log(`🔄 Retry attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}`)
      const success = await checkApiStatus()
      
      if (!success && mountedRef.current) {
        scheduleRetry(attempt + 1)
      }
    }, retryDelay)
  }, [checkApiStatus, updateProgress, safeSetState])

  // Auto-check on mount if enabled
  useEffect(() => {
    if (!autoCheck) return

    const initializeApi = async () => {
      try {
        console.log('🔄 Auto-checking API status on component mount...')
        
        // Set overall timeout to force unblock after maximum time
        timeoutRef.current = setTimeout(() => {
          console.warn('⚠️ API initialization timeout - keeping app blocked for user decision')
          safeSetState(prev => ({
            ...prev,
            isLoading: false,
            isWakingUp: false,
            step: 'API check timed out - choose to continue or retry',
            progress: 100,
            apiStatus: 'error',
            error: 'Initialization timeout'
            // Note: shouldBlockApp stays true - user must explicitly skip
          }))
        }, WAKEUP_TIMEOUT + 10000) // 55 seconds total
        
        // Check environment
        const isDevelopment = process.env.NODE_ENV === 'development'
        console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`)
        
        if (isDevelopment) {
          // In development, just try once and if it fails, let user decide
          updateProgress(30, "Development mode - checking local API...", 'checking')
          
          const isAwake = await checkApiStatus()
          
          if (isAwake) {
            // Clear timeout on success
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
          } else {
            // In dev, if local API fails, block until user decides
            safeSetState(prev => ({
              ...prev,
              shouldBlockApp: true,
              step: "Local API not responding - skip to continue in offline mode",
              progress: 100
            }))
          }
        } else {
          // Production mode - try to wake up API with retries
          const isAwake = await checkApiStatus()
          
          if (!isAwake) {
            // Try to wake up the API
            updateProgress(50, "API appears down - attempting wake-up...")
            const wakeupSuccess = await wakeUpApiManually()
            
            if (!wakeupSuccess) {
              // Start retry cycle
              scheduleRetry(0)
            } else {
              // Clear timeout on success
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
            }
          } else {
            // Clear timeout on success
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
          }
        }
        
      } catch (error) {
        console.error('❌ API initialization failed:', error)
        safeSetState(prev => ({
          ...prev,
          isLoading: false,
          isWakingUp: false,
          shouldBlockApp: true, // Keep blocking on error
          error: error instanceof Error ? error.message : 'Initialization failed',
          step: 'API initialization failed - choose to continue or retry',
          progress: 100,
          apiStatus: 'error'
        }))
      }
    }

    initializeApi()
  }, [autoCheck, checkApiStatus, wakeUpApiManually, updateProgress, safeSetState, scheduleRetry])

  return {
    ...state,
    checkApiStatus,
    wakeUpApiManually,
    resetState,
    forceSkip
  }
}

// Utility function to determine if wake-up is needed based on response time
export function shouldTriggerWakeup(responseTime: number): boolean {
  return responseTime > 5000
}

// Utility function to get user-friendly status messages
export function getStatusMessage(state: ApiWakeupState): string {
  switch (state.apiStatus) {
    case 'awake':
      return `API ready (${state.responseTime}ms - excellent)`
    case 'sleeping':
      return `API ready (${state.responseTime}ms - was sleeping)`
    case 'down':
      return "API offline - limited functionality"
    case 'error':
      return `API error: ${state.error}`
    case 'checking':
      return "Checking API status..."
    case 'unknown':
      return "API status unknown"
    default:
      if (state.error) {
        return `API Status: ${state.error}`
      }
      
      if (state.isLoading && !state.isWakingUp) {
        return "Checking API status..."
      }
      
      if (state.isWakingUp) {
        return state.step || "Waking up API..."
      }
      
      if (state.isAwake) {
        const responseTime = state.responseTime
        if (responseTime < 1000) {
          return `API ready (${responseTime}ms)`
        } else if (responseTime < 3000) {
          return `API ready (${responseTime}ms - good)`
        } else {
          return `API ready (${responseTime}ms - slow)`
        }
      }
      
      return "API status unknown"
  }
}

// Hook for components that only need to know if API is ready
export function useApiStatus(): { isReady: boolean; responseTime: number; error?: string } {
  const { isAwake, responseTime, error, shouldBlockApp } = useApiWakeup(true)
  
  return {
    isReady: isAwake && !shouldBlockApp,
    responseTime,
    error
  }
}