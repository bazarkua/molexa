// components/api-status-debug.tsx
// Optional debug component for testing API wake-up functionality

import { useState } from 'react'
import { useApiWakeup, getStatusMessage } from '@/hooks/use-api-wakeup'
import { testAPIConnectivity } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Zap,
  Bug
} from 'lucide-react'

interface ApiStatusDebugProps {
  className?: string
  showAdvanced?: boolean
}

export function ApiStatusDebug({ className, showAdvanced = false }: ApiStatusDebugProps) {
  const apiWakeup = useApiWakeup(false) // Don't auto-check
  const [testResult, setTestResult] = useState<any>(null)
  const [isTesting, setIsTesting] = useState(false)

  const handleQuickTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    
    try {
      const result = await testAPIConnectivity()
      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Test failed to complete'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusColor = () => {
    if (apiWakeup.error) return 'destructive'
    if (apiWakeup.isAwake) return 'default'
    if (apiWakeup.isLoading) return 'secondary'
    return 'outline'
  }

  const getStatusIcon = () => {
    if (apiWakeup.error) return <AlertCircle className="w-4 h-4" />
    if (apiWakeup.isAwake) return <CheckCircle className="w-4 h-4" />
    if (apiWakeup.isLoading) return <RefreshCw className="w-4 h-4 animate-spin" />
    return <Activity className="w-4 h-4" />
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-5 h-5" />
          API Status Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Status:</span>
          <Badge variant={getStatusColor()} className="gap-1">
            {getStatusIcon()}
            {apiWakeup.isAwake ? 'Ready' : apiWakeup.isLoading ? 'Loading' : 'Unknown'}
          </Badge>
        </div>

        {/* Status Message */}
        <div className="text-sm text-gray-600">
          {getStatusMessage(apiWakeup)}
        </div>

        {/* Progress Bar (if loading) */}
        {apiWakeup.isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{apiWakeup.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${apiWakeup.progress}%` }}
              />
            </div>
            {apiWakeup.step && (
              <p className="text-xs text-gray-500">{apiWakeup.step}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={apiWakeup.checkApiStatus}
            disabled={apiWakeup.isLoading}
            className="gap-2"
          >
            <Activity className="w-4 h-4" />
            Quick Check
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={apiWakeup.wakeUpApiManually}
            disabled={apiWakeup.isLoading}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Wake Up API
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickTest}
            disabled={isTesting}
            className="gap-2"
          >
            {isTesting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Bug className="w-4 h-4" />
            )}
            Test Connectivity
          </Button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                Connectivity Test: {testResult.success ? 'Passed' : 'Failed'}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Response Time: {testResult.responseTime}ms</div>
              <div>Details: {testResult.details}</div>
              {testResult.error && (
                <div className="text-red-600">Error: {testResult.error}</div>
              )}
            </div>
          </div>
        )}

        {/* Advanced Info */}
        {showAdvanced && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
            <div className="font-medium text-gray-700">Debug Info:</div>
            <div>Last Checked: {apiWakeup.lastChecked ? new Date(apiWakeup.lastChecked).toLocaleTimeString() : 'Never'}</div>
            <div>Response Time: {apiWakeup.responseTime}ms</div>
            <div>Environment: {process.env.NODE_ENV || 'unknown'}</div>
            <div>Auto-check: Disabled (manual control)</div>
            {apiWakeup.error && (
              <div className="text-red-600">Error: {apiWakeup.error}</div>
            )}
          </div>
        )}

        {/* Reset Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={apiWakeup.resetState}
          className="w-full text-xs"
        >
          Reset State
        </Button>
      </CardContent>
    </Card>
  )
}

// Simple status indicator component for header/footer
export function ApiStatusIndicator() {
  const apiWakeup = useApiWakeup(true)

  if (!apiWakeup.isAwake && !apiWakeup.isLoading) return null

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span>API Ready</span>
    </div>
  )
}

// Hook for other components to check API readiness
export function useApiReadiness() {
  const { isAwake, isLoading, error } = useApiWakeup(false)
  
  return {
    isReady: isAwake && !isLoading,
    isLoading,
    hasError: !!error,
    error
  }
}