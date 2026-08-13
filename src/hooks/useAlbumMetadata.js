import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Busca a tabela global album_metadata (capa/link/gênero resolvidos via Spotify) e devolve
// um mapa album_id -> metadata, pra ser mesclado com a lista estática em src/data/albums.js.
export function useAlbumMetadata() {
  const [metadata, setMetadata] = useState({})
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    // .range() é necessário: por padrão o Supabase corta em 1000 linhas, e como temos 1001
    // discos, isso estava fazendo exatamente 1 disco sumir aleatoriamente da lista.
    const { data, error } = await supabase.from('album_metadata').select('*').range(0, 1999)
    if (error) {
      console.error('Erro ao carregar metadados do Spotify:', error.message)
    } else {
      const map = {}
      for (const row of data) map[row.album_id] = row
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
