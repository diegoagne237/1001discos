import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Checa se o usuário logado está na tabela allowed_users (liberada manualmente por você
// no Supabase, via Table Editor). Serve pra gatear áreas escondidas da ferramenta.
export function useHasAccess(userId) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('allowed_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Erro ao checar acesso:', error.message)
          setHasAccess(false)
        } else {
          setHasAccess(Boolean(data))
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  return { hasAccess, loading }
}

// Lista dos outros usuários liberados na área escondida (com nome de exibição), usada pra
// escolher pra quem mandar uma sugestão de banda. Só funciona se o próprio usuário já estiver
// liberado (a policy do Supabase exige isso).
export function useOtherAllowedUsers(currentUserId) {
  const [others, setOthers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUserId) {
      setOthers([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('allowed_users')
      .select('user_id, display_name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Erro ao carregar usuários liberados:', error.message)
        } else {
          setOthers((data || []).filter((u) => u.user_id !== currentUserId))
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentUserId])

  return { others, loading }
}
