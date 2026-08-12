import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useBandSuggestions(userId) {
  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!userId) {
      setSent([])
      setReceived([])
      setLoading(false)
      return
    }
    setLoading(true)

    const [sentRes, receivedRes] = await Promise.all([
      supabase
        .from('band_suggestions')
        .select('*')
        .eq('from_user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('band_suggestions')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    if (sentRes.error) console.error('Erro ao carregar enviadas:', sentRes.error.message)
    if (receivedRes.error) console.error('Erro ao carregar recebidas:', receivedRes.error.message)

    setSent(sentRes.data || [])
    setReceived(receivedRes.data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const addSuggestion = useCallback(
    async (payload) => {
      const { error } = await supabase.from('band_suggestions').insert({ ...payload, from_user_id: userId })
      if (error) throw error
      await reload()
    },
    [userId, reload]
  )

  const saveEvaluation = useCallback(
    async (id, { rating, comment }) => {
      const { error } = await supabase.from('band_suggestions').update({ rating, comment }).eq('id', id)
      if (error) throw error
      await reload()
    },
    [reload]
  )

  const release = useCallback(
    async (id) => {
      const { error } = await supabase
        .from('band_suggestions')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await reload()
    },
    [reload]
  )

  const remove = useCallback(
    async (id) => {
      const { error } = await supabase.from('band_suggestions').delete().eq('id', id)
      if (error) throw error
      await reload()
    },
    [reload]
  )

  return { sent, received, loading, addSuggestion, saveEvaluation, release, remove }
}
