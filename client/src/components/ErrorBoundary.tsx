import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { primaryButton } from './ui/styles'

type Props = { children: ReactNode }
type State = { failed: boolean }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="grid min-h-[60vh] place-items-center px-4 text-center">
        <div role="alert">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-red-50 text-2xl font-bold text-red-500">!</span>
          <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-slate-500">An unexpected error occurred. Try reloading the page, and if it keeps happening, go back to the home page.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => window.location.reload()} className={primaryButton}>Reload page</button>
            <a href="/" className="rounded-full bg-white px-5 py-2.5 font-medium shadow-soft ring-1 ring-slate-200">Go home</a>
          </div>
        </div>
      </div>
    )
  }
}
