import { Spinner } from './Spinner'

export function LoadingScreen() {
  return <main className="loading-screen"><Spinner label="Loading CivicAI" /><span>Loading CivicAI…</span></main>
}
