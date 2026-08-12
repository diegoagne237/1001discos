import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Expõe a sessão atual e mantém sincronizado com login/logout/expiração de token.
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = () => supabase.auth.signOut()

  return { session, user: session?.user ?? null, loading, signOut }
}
