import {createContext, useContext, useEffect, useState, type ReactNode} from 'react'
import {me} from './api'

type AuthState = {
  loading: boolean
  signedIn: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  loading: true,
  signedIn: false,
  refresh: async () => undefined,
})

export function AuthProvider({children}: {children: ReactNode}) {
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)

  const refresh = async () => {
    try {
      await me()
      setSignedIn(true)
    } catch {
      setSignedIn(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  return <AuthContext.Provider value={{loading, signedIn, refresh}}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
