import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Mantém o conjunto de ids de discos marcados como ouvidos e as notas (1-5) dadas a eles,
// por usuário logado, no Supabase. Atualiza de forma otimista e reverte se a chamada falhar.
export function useListened(userId) {
  const [listenedIds, setListenedIds] = useState(new Set())
  const [ratings, setRatings] = useState({}) // { [albumId]: 1..5 }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setListenedIds(new Set())
      setRatings({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('listened_albums')
      .select('album_id, rating')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Erro ao carregar discos ouvidos:', error.message)
        } else {
          setListenedIds(new Set(data.map((row) => row.album_id)))
          const ratingMap = {}
          for (const row of data) {
            if (row.rating) ratingMap[row.album_id] = row.rating
          }
          setRatings(ratingMap)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const toggle = useCallback(
    async (albumId) => {
      if (!userId) return
      const wasListened = listenedIds.has(albumId)
      const previousRating = ratings[albumId]

      // atualização otimista
      setListenedIds((prev) => {
        const next = new Set(prev)
        wasListened ? next.delete(albumId) : next.add(albumId)
        return next
      })
      if (wasListened) {
        setRatings((prev) => {
          const next = { ...prev }
          delete next[albumId]
          return next
        })
      }

      const { error } = wasListened
        ? await supabase.from('listened_albums').delete().eq('user_id', userId).eq('album_id', albumId)
        : await supabase.from('listened_albums').insert({ user_id: userId, album_id: albumId })

      if (error) {
        console.error('Erro ao salvar:', error.message)
        // reverte se a chamada falhou
        setListenedIds((prev) => {
          const next = new Set(prev)
          wasListened ? next.add(albumId) : next.delete(albumId)
          return next
        })
        if (wasListened && previousRating) {
          setRatings((prev) => ({ ...prev, [albumId]: previousRating }))
        }
      }
    },
    [userId, listenedIds, ratings]
  )

  const setRating = useCallback(
    async (albumId, rating) => {
      if (!userId || !listenedIds.has(albumId)) return
      const previous = ratings[albumId]
      const nextRating = previous === rating ? null : rating // clica na mesma estrela pra limpar

      setRatings((prev) => {
        const next = { ...prev }
        if (nextRating) next[albumId] = nextRating
        else delete next[albumId]
        return next
      })

      const { error } = await supabase
        .from('listened_albums')
        .update({ rating: nextRating })
        .eq('user_id', userId)
        .eq('album_id', albumId)

      if (error) {
        console.error('Erro ao salvar avaliação:', error.message)
        setRatings((prev) => {
          const next = { ...prev }
          if (previous) next[albumId] = previous
          else delete next[albumId]
          return next
        })
      }
    },
    [userId, listenedIds, ratings]
  )

  const isListened = (id) => listenedIds.has(id)
  const getRating = (id) => ratings[id] || 0

  return { listenedIds, toggle, isListened, ratings, setRating, getRating, loading }
}
