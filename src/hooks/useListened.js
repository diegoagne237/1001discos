import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Mantém o conjunto de ids de discos marcados como ouvidos, por usuário logado, no Supabase.
// Atualiza de forma otimista (marca/desmarca na tela na hora) e reverte se a chamada falhar.
export function useListened(userId) {
  const [listenedIds, setListenedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setListenedIds(new Set())
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('listened_albums')
      .select('album_id')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Erro ao carregar discos ouvidos:', error.message)
        } else {
          setListenedIds(new Set(data.map((row) => row.album_id)))
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

      // atualização otimista
      setListenedIds((prev) => {
        const next = new Set(prev)
        wasListened ? next.delete(albumId) : next.add(albumId)
        return next
      })

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
      }
    },
    [userId, listenedIds]
  )

  const isListened = (id) => listenedIds.has(id)

  return { listenedIds, toggle, isListened, loading }
}

