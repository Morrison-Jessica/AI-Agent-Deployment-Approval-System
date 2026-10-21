import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type {
  ClientToServerEvents,
  DeploymentState,
  ServerToClientEvents,
} from '../../shared-types/index'
import './App.css'

const serverUrl =
  import.meta.env.VITE_SERVER_URL ||
  `http://${window.location.hostname}:3001`

type DeploymentSocket = Socket<ServerToClientEvents, ClientToServerEvents>

function App() {
  const socketRef = useRef<DeploymentSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [release, setRelease] = useState('')
  const [environment, setEnvironment] =
    useState<DeploymentState['environment']>('staging')
  const [state, setState] = useState<DeploymentState | null>(null)

  useEffect(() => {
    const socket: DeploymentSocket = io(serverUrl, { autoConnect: false })
    socketRef.current = socket
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    socket.on('connect_error', () => setConnected(false))
    socket.on('state:update', (nextState) => setState(nextState))
    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  function createRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedRelease = release.trim()
    const socket = socketRef.current
    if (!socket?.connected || !trimmedRelease) return

    socket.emit('deployment:request', {
      release: trimmedRelease,
      environment,
      agentRequest: `Request deployment of release ${trimmedRelease} to ${environment}.`,
    })
  }

  return (
    <main className="admin">
      <header>
        <h1>Deployment Admin</h1>
        <p className={connected ? 'connection connected' : 'connection'} role="status">
          {connected ? 'Connected' : 'Disconnected'}
        </p>
      </header>

      <section className="panel" aria-labelledby="request-heading">
        <h2 id="request-heading">Create a deployment request</h2>
        <form onSubmit={createRequest}>
          <label htmlFor="release">Release</label>
          <input
            id="release"
            value={release}
            onChange={(event) => setRelease(event.target.value)}
            placeholder="1.0.0"
            required
          />
          <label htmlFor="environment">Environment</label>
          <select
            id="environment"
            value={environment}
            onChange={(event) => {
              const value = event.target.value
              if (value === 'staging' || value === 'production') setEnvironment(value)
            }}
          >
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
          <button type="submit" disabled={!connected || !release.trim()}>
            Create Agent Request
          </button>
        </form>
      </section>

      <section className="panel" aria-labelledby="state-heading">
        <h2 id="state-heading">Current shared state</h2>
        {!connected && state && <p>Disconnected. Showing last received state.</p>}
        {state ? (
          <dl>
            <dt>Release</dt><dd>{state.release || '—'}</dd>
            <dt>Environment</dt><dd>{state.environment}</dd>
            <dt>Status</dt><dd>{state.status}</dd>
            <dt>Agent request</dt><dd>{state.agentRequest ?? '—'}</dd>
            <dt>Last action</dt><dd>{state.lastAction ?? '—'}</dd>
          </dl>
        ) : (
          <p>Waiting for the server’s current state.</p>
        )}
      </section>
    </main>
  )
}

export default App
