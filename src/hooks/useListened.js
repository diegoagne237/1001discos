import { useEffect, useState } from 'react'

const STORAGE_KEY = '1001-discos:ouvidos'

// Mantém o conjunto de ids de discos marcados como ouvidos, persistido em localStorage.
// Quando o projeto migrar para Supabase, troque o corpo deste hook por chamadas ao backend
// mantendo a mesma assinatura (toggle, isListened, listenedIds) para não quebrar os componentes.
export function useListened() {
  const [listenedIds, setListenedIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? new Set(JSON.parse(raw)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...listenedIds]))
  }, [listenedIds])

  const toggle = (id) => {
    setListenedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const isListened = (id) => listenedIds.has(id)

  return { listenedIds, toggle, isListened }
}
