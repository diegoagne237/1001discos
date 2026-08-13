import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Busca a tabela global album_metadata (capa/link/gênero resolvidos via Spotify) e devolve
// um mapa album_id -> metadata, pra ser mesclado com a lista estática em src/data/albums.js.
export function useAlbumMetadata() {
  const [metadata, setMetadata] = useState({})
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    // busca em lotes de 1000 — o Supabase tem um limite máximo de linhas por chamada
    // configurado no servidor (Settings > API > Max Rows), então pedir um range maior no
    // código sozinho não bastava. Isso aqui funciona não importa qual seja esse limite.
    let all = []
    let from = 0
    const pageSize = 1000
    let error = null

    while (true) {
      const res = await supabase.from('album_metadata').select('*').range(from, from + pageSize - 1)
      if (res.error) {
        error = res.error
        break
      }
      all = all.concat(res.data)
      if (res.data.length < pageSize) break
      from += pageSize
    }
    if (error) {
      console.error('Erro ao carregar metadados do Spotify:', error.message)
    } else {
      const map = {}
      for (const row of all) map[row.album_id] = row
      setMetadata(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { metadata, loading, reload }
}

// Sobrepõe spotifyUrl / coverUrl / genre vindos do Supabase por cima da lista estática,
// só quando o Supabase já tem um valor resolvido (mantém o que já existe caso contrário).
export function mergeAlbumsWithMetadata(albums, metadata) {
  return albums.map((album) => {
    const m = metadata[album.id]
    if (!m) return album
    return {
      ...album,
      spotifyUrl: m.spotify_url || album.spotifyUrl,
      coverUrl: m.cover_url || album.coverUrl,
      genre: m.genre || album.genre,
    }
  })
}
