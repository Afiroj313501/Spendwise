import { Link } from 'react-router-dom'
import { primaryButton } from '../components/ui/styles'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound({ inApp = false }: { inApp?: boolean }) {
  useDocumentTitle('Page not found')
  return (
    <div className={`grid place-items-center px-4 text-center ${inApp ? 'py-20' : 'min-h-screen'}`}>
      <div>
        <p className="bg-gradient-to-r from-brand-600 to-cyan-brand bg-clip-text text-8xl font-semibold text-transparent">404</p>
        <h1 className="mt-4 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you are looking for does not exist or has moved.</p>
        <Link to={inApp ? '/app' : '/'} className={`${primaryButton} mt-6`}>{inApp ? 'Back to dashboard' : 'Back to home'}</Link>
      </div>
    </div>
  )
}
