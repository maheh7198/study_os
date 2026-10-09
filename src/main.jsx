import { lazy, StrictMode, Suspense, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
const App = lazy(() => import('./App.jsx'))
import AuthGate from './AuthGate.jsx'
import { AppErrorBoundary } from './components/AppErrorBoundary.jsx'

export function RuntimeErrorLogger({ children }) {
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    const onError = (event) => console.error('Uncaught StudyOS browser error:', event.error || event.message)
    const onRejection = (event) => console.error('Unhandled StudyOS promise rejection:', event.reason)
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])
  return children
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RuntimeErrorLogger>
      <AppErrorBoundary>
        <Suspense fallback={<main className="auth-loading" role="status">Loading StudyOS…</main>}>
          <AuthGate>
            <App />
          </AuthGate>
        </Suspense>
      </AppErrorBoundary>
    </RuntimeErrorLogger>
  </StrictMode>,
)
