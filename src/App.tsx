import { useEffect } from 'react'
import { useRoute } from './lib/router'
import { ToastProvider } from './components/Toast'
import { HomeScreen } from './screens/HomeScreen'
import { ListScreen } from './screens/ListScreen'
import { MatchScreen } from './screens/MatchScreen'
import { SelectScreen } from './screens/SelectScreen'
import { StatsScreen } from './screens/StatsScreen'
import { StudyScreen } from './screens/StudyScreen'

export default function App() {
  const route = useRoute()
  const routeKey = `${route.name}?${route.query.toString()}`

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [routeKey])

  return (
    <ToastProvider>
      <div className="app">
        <div className="app__aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        {route.name === 'study' ? (
          <StudyScreen key={routeKey} />
        ) : route.name === 'match' ? (
          <MatchScreen key={routeKey} />
        ) : route.name === 'list' ? (
          <ListScreen key={routeKey} />
        ) : route.name === 'select' ? (
          <SelectScreen key={routeKey} />
        ) : route.name === 'stats' ? (
          <StatsScreen key={routeKey} />
        ) : (
          <HomeScreen />
        )}
      </div>
    </ToastProvider>
  )
}
