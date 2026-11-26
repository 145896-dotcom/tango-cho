import type { ReactNode } from 'react'
import { IconBack } from './Icons'

interface AppBarProps {
  title: string
  progress?: number
  onBack?: () => void
  actions?: ReactNode
}

export function AppBar({ title, progress, onBack, actions }: AppBarProps) {
  return (
    <header className="appbar">
      {onBack ? (
        <button type="button" className="iconbtn" onClick={onBack} aria-label="返回">
          <IconBack />
        </button>
      ) : (
        <span className="appbar__dot" aria-hidden="true" />
      )}
      <h1 className="appbar__title">{title}</h1>
      {progress !== undefined ? (
        <div
          className="appbar__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(Math.min(1, Math.max(0, progress)) * 100)}
        >
          <i style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
        </div>
      ) : (
        <span className="appbar__spacer" />
      )}
      <div className="appbar__actions">{actions}</div>
    </header>
  )
}
