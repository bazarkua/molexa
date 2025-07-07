// components/api-loading-screen.tsx
// Enhanced version that works with the new shouldBlockApp system
import { useEffect } from "react"
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Info, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  X 
} from "lucide-react"
import { ApiWakeupState } from "@/hooks/use-api-wakeup"

interface ApiLoadingScreenProps {
  state: ApiWakeupState
  onSkip?: () => void
  onRetry?: () => void
  showSkipButton?: boolean
  showRetryButton?: boolean
  customMessages?: {
    title?: string
    subtitle?: string
    explanation?: string
  }
  className?: string
}

export function ApiLoadingScreen({ 
  state, 
  onSkip, 
  onRetry,
  showSkipButton = true,
  showRetryButton = true,
  customMessages = {},
  className = ""
}: ApiLoadingScreenProps) {
  const {
    title = "Starting moleXa API",
    subtitle = "Please wait while we wake up the molecular database",
    explanation = "The moleXa API runs on Vercel serverless functions, which 'sleep' after inactivity to save resources. The first request after sleep takes 10-30 seconds to wake up."
  } = customMessages

  const getIcon = () => {
    if (state.apiStatus === 'awake') {
      return <CheckCircle className="w-8 h-8 text-white" />
    }
    if (state.apiStatus === 'down' || state.apiStatus === 'error') {
      return <WifiOff className="w-8 h-8 text-white" />
    }
    if (state.isWakingUp || state.isLoading) {
      return <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
    }
    return <Wifi className="w-8 h-8 text-white" />
  }

  const getTitle = () => {
    if (state.apiStatus === 'awake') {
      return "API Ready!"
    }
    if (state.apiStatus === 'down') {
      return "API Offline"
    }
    if (state.apiStatus === 'error') {
      return "API Connection Failed"
    }
    if (state.isWakingUp) {
      return "Waking Up API..."
    }
    if (state.isLoading) {
      return "Checking API Status..."
    }
    return title
  }

  const getStatusColor = () => {
    if (state.apiStatus === 'awake') return "from-green-500 to-green-600"
    if (state.apiStatus === 'down' || state.apiStatus === 'error') return "from-red-500 to-red-600"
    if (state.isWakingUp || state.isLoading) return "from-blue-500 to-blue-600"
    return "from-gray-500 to-gray-600"
  }

  const getSubtitle = () => {
    if (state.apiStatus === 'awake') {
      return "API is online and ready to serve molecular data"
    }
    if (state.apiStatus === 'down') {
      return "The API server is currently unreachable"
    }
    if (state.apiStatus === 'error') {
      return "There was an error connecting to the API"
    }
    return subtitle
  }

  return (
    <div className={`min-h-screen bg-gray-50 font-inter flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-2xl p-8 shadow-2xl border border-gray-200 max-w-lg w-full">
        <div className="text-center">
          {/* Close/Skip button */}
          {showSkipButton && onSkip && (
            <div className="flex justify-end mb-4">
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                title="Skip API check and continue"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Status Icon */}
          <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${getStatusColor()} rounded-full flex items-center justify-center`}>
            {getIcon()}
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {getTitle()}
          </h3>

          {/* Subtitle */}
          <p className="text-gray-600 mb-6 text-sm">
            {getSubtitle()}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className={`bg-gradient-to-r ${getStatusColor().replace('from-', 'from-').replace('to-', 'to-')} h-2 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${state.progress}%` }}
            />
          </div>

          {/* Progress details */}
          <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
            <span>{state.progress}%</span>
            <span>
              {state.responseTime > 0 && `${state.responseTime}ms`}
              {state.attemptCount > 1 && ` (Attempt ${state.attemptCount})`}
            </span>
          </div>

          {/* Current Step */}
          <p className="text-gray-700 mb-6 min-h-[20px]">
            {state.step || "Initializing..."}
          </p>

          {/* Status-specific information boxes */}
          {(state.isLoading || state.isWakingUp) && state.apiStatus !== 'down' && state.apiStatus !== 'error' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-1">Why does this take time?</div>
                  <p className="text-xs leading-relaxed">
                    {explanation}
                  </p>
                  {state.attemptCount > 1 && (
                    <p className="text-xs mt-2 text-blue-700">
                      Retry attempt {state.attemptCount} - Please be patient...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error/Down State */}
          {(state.apiStatus === 'down' || state.apiStatus === 'error') && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-1">
                    {state.apiStatus === 'down' ? 'API Server Offline' : 'Connection Failed'}
                  </div>
                  <p className="text-xs leading-relaxed mb-3">
                    The moleXa API is currently {state.apiStatus === 'down' ? 'offline' : 'unreachable'}. You can:
                  </p>
                  <ul className="text-xs space-y-1 mb-3 list-disc list-inside">
                    <li>Wait and retry the connection</li>
                    <li>Continue with limited functionality</li>
                    <li>Check if the service is experiencing issues</li>
                  </ul>
                  {state.error && (
                    <div className="text-xs text-red-700 bg-red-100 p-2 rounded mt-2 font-mono">
                      Error: {state.error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {state.apiStatus === 'awake' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <div>
                  <span className="font-medium">API is ready!</span>
                  <p className="text-xs mt-1">
                    Response time: {state.responseTime}ms - Ready to serve molecular data
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {state.apiStatus === 'awake' ? (
              <button
                onClick={onSkip}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Continue to Application
              </button>
            ) : (
              <>
                {/* Retry button for failed states */}
                {showRetryButton && onRetry && (state.apiStatus === 'down' || state.apiStatus === 'error') && (
                  <button
                    onClick={onRetry}
                    disabled={state.isLoading || state.isWakingUp}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {state.isLoading || state.isWakingUp ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Retry Connection
                  </button>
                )}
                
                {/* Skip button */}
                {showSkipButton && onSkip && (
                  <button
                    onClick={onSkip}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Continue in Offline Mode
                  </button>
                )}
              </>
            )}

            {/* Skip explanation text */}
            <p className="text-xs text-gray-500 text-center">
              {state.apiStatus === 'awake' 
                ? "API is ready - click to proceed to the application"
                : "Continue without API verification. Some features may be limited."
              }
            </p>
          </div>

          {/* Development Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Debug Info
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono space-y-1">
                <div>Status: {state.apiStatus}</div>
                <div>Should Block App: {state.shouldBlockApp ? 'Yes' : 'No'}</div>
                <div>Is Loading: {state.isLoading ? 'Yes' : 'No'}</div>
                <div>Is Waking Up: {state.isWakingUp ? 'Yes' : 'No'}</div>
                <div>Is Awake: {state.isAwake ? 'Yes' : 'No'}</div>
                <div>Last Checked: {state.lastChecked ? new Date(state.lastChecked).toLocaleTimeString() : 'Never'}</div>
                <div>Response Time: {state.responseTime}ms</div>
                <div>Attempt Count: {state.attemptCount}</div>
                <div>Environment: {process.env.NODE_ENV}</div>
                {state.error && <div className="text-red-600">Error: {state.error}</div>}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

// Minimal loading component for inline use
export function ApiLoadingInline({ state, onSkip }: { state: ApiWakeupState; onSkip?: () => void }) {
  const getStatusColor = () => {
    if (state.apiStatus === 'awake') return 'border-green-500 bg-green-50 text-green-800'
    if (state.apiStatus === 'down' || state.apiStatus === 'error') return 'border-red-500 bg-red-50 text-red-800'
    return 'border-blue-500 bg-blue-50 text-blue-800'
  }

  const getIcon = () => {
    if (state.apiStatus === 'awake') return <CheckCircle className="w-4 h-4" />
    if (state.apiStatus === 'down' || state.apiStatus === 'error') return <WifiOff className="w-4 h-4" />
    return <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
  }

  return (
    <div className={`flex items-center gap-3 p-4 border rounded-lg ${getStatusColor()}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">
          {state.apiStatus === 'awake' ? 'API Ready' : 
           state.apiStatus === 'down' ? 'API Offline' :
           state.apiStatus === 'error' ? 'API Error' : 'Starting API'}
        </div>
        <div className="text-xs opacity-75">{state.step}</div>
      </div>
      <div className="text-xs font-mono">
        {state.progress}%
      </div>
      {onSkip && (
        <button
          onClick={onSkip}
          className="text-xs underline hover:no-underline"
        >
          Skip
        </button>
      )}
    </div>
  )
}

// Toast-style notification for API status changes
export function ApiStatusToast({ 
  isVisible, 
  message, 
  type = 'info',
  onClose,
  autoHide = true,
  duration = 5000
}: {
  isVisible: boolean
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose?: () => void
  autoHide?: boolean
  duration?: number
}) {
  // Auto-hide logic
  useEffect(() => {
    if (isVisible && autoHide && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHide, onClose, duration])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg border ${getBgColor()} shadow-lg max-w-sm animate-in slide-in-from-top-2`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium flex-1">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}