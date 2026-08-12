import { supabase } from './supabaseClient'

let cachedToken = null
let cachedExpiry = 0

async function getSpotifyToken() {
  if (cachedToken && Date.now() < cachedExpiry) return cachedToken

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData?.session?.access_token
  if (!accessToken) throw new Error('Sessão inválida — faz login de novo.')

  const res = await fetch('/api/spotify-user-token', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Falha ao autenticar com o Spotify (${res.status})`)
  }
  const data = await res.json()
  cachedToken = data.access_token
  cachedExpiry = Date.now() + data.expires_in * 1000 - 30_000
  return cachedToken
}

export async function searchArtist(name) {
  const token = await getSpotifyToken()
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Spotify respondeu ${res.status}`)
  const data = await res.json()
  return data?.artists?.items?.[0] || null
}

export async function searchThisIsPlaylist(artistName) {
  const token = await getSpotifyToken()
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent('This is ' + artistName)}&type=playlist&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const items = (data?.playlists?.items || []).filter(Boolean)
  const exact = items.find((p) => p.name?.toLowerCase() === `this is ${artistName}`.toLowerCase())
  return exact || items[0] || null
}

export function extractPlaylistId(url) {
  const match = url.match(/playlist[/:]([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

// Busca direta por ID é bem mais leve que "search" — menos chance de esbarrar em rate limit.
export async function getPlaylist(playlistId) {
  const token = await getSpotifyToken()
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,images,owner,tracks.items(track(artists,name))`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!res.ok) throw new Error(`Spotify respondeu ${res.status} ao buscar a playlist`)
  return res.json()
}

export async function getArtist(artistId) {
  const token = await getSpotifyToken()
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify respondeu ${res.status} ao buscar o artista`)
  return res.json()
}

async function fetchWikipediaSummaryFromLang(name, lang) {
  try {
    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.type === 'disambiguation') return null
    return data.extract || null
  } catch {
    return null
  }
}

// Tenta português primeiro, cai pro inglês se não achar. A Spotify não expõe bio/fundação
// na API pública, então isso é o que dá pra conseguir sem outra chave de API.
export async function fetchBandBio(name) {
  return (await fetchWikipediaSummaryFromLang(name, 'pt')) || (await fetchWikipediaSummaryFromLang(name, 'en'))
}
