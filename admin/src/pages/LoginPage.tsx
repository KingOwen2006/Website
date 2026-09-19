import {useState} from 'react'
import {Navigate, useNavigate} from 'react-router-dom'
import {login} from '../lib/api'
import {useAuth} from '../lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const {loading, signedIn, refresh} = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (loading) return <div className="login-screen">Loading…</div>
  if (signedIn) return <Navigate to="/" replace />

  return (
    <div className="login-screen">
      <form
        className="login-card"
        onSubmit={async (event) => {
          event.preventDefault()
          setError('')
          try {
            await login(password)
            await refresh()
            navigate('/')
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not sign in')
          }
        }}
      >
        <h1>KingOwen Admin</h1>
        {error ? <p className="notice error">{error}</p> : null}
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button className="wp-button" type="submit">
          Log in
        </button>
      </form>
    </div>
  )
}
