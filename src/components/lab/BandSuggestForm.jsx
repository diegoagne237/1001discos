import { useState } from 'react'
import {
  searchArtist,
  searchThisIsPlaylist,
  fetchBandBio,
  extractPlaylistId,
  getPlaylist,
  getArtist,
} from '../../lib/spotifyPublicSearch'

export default function BandSuggestForm({ others, onAdd }) {
  const [mode, setMode] = useState('playlist') // 'playlist' | 'name'
  const [playlistLink, setPlaylistLink] = useState('')
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { artist, playlistUrl, playlistName, bio }
  const [playlistUrlOverride, setPlaylistUrlOverride] = useState('')
  const [toUserId, setToUserId] = useState(others[0]?.user_id || '')
  const [sending, setSending] = useState(false)

  const handlePlaylistLookup = async (e) => {
    e.preventDefault()
    if (!playlistLink.trim()) return
    setSearching(true)
    setError('')
    setPreview(null)

    try {
      const playlistId = extractPlaylistId(playlistLink.trim())
      if (!playlistId) {
        throw new Error('Não reconheci esse link — confere se é um link de playlist do Spotify.')
      }
      const playlist = await getPlaylist(playlistId)
      const firstTrackWithArtist = playlist.tracks?.items?.find((it) => it.track?.artists?.length)
      const primaryArtistRef = firstTrackWithArtist?.track?.artists?.[0]
      if (!primaryArtistRef) {
        throw new Error('Não consegui identificar a banda a partir dessa playlist.')
      }
      const artist = await getArtist(primaryArtistRef.id)
      const bio = await fetchBandBio(artist.name)
      setPreview({ artist, playlistName: playlist.name, bio })
      setPlaylistUrlOverride(playlistLink.trim())
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleNameSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setPreview(null)

    try {
      const artist = await searchArtist(query.trim())
      if (!artist) {
        setError('Não achei nenhuma banda com esse nome no Spotify.')
        setSearching(false)
        return
      }
      const [playlist, bio] = await Promise.all([searchThisIsPlaylist(artist.name), fetchBandBio(artist.name)])
      setPreview({ artist, playlistName: playlist?.name, bio })
      setPlaylistUrlOverride(playlist?.external_urls?.spotify || '')
    } catch (err) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleSend = async () => {
    if (!preview || !toUserId) return
    setSending(true)
    try {
      await onAdd({
        to_user_id: toUserId,
        band_name: preview.artist.name,
        artist_spotify_url: preview.artist.external_urls?.spotify || null,
        artist_image_url: preview.artist.images?.[0]?.url || null,
        genres: (preview.artist.genres || []).join(', ') || null,
        followers: preview.artist.followers?.total ?? null,
        bio: preview.bio || null,
        playlist_url: playlistUrlOverride || null,
      })
      setPlaylistLink('')
      setQuery('')
      setPreview(null)
      setPlaylistUrlOverride('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-paperDark border border-ink/10 rounded-sm p-5">
      <h2 className="font-display text-lg uppercase mb-4">Sugerir uma banda</h2>

      <div className="flex gap-1 mb-4 font-mono text-[10px] uppercase">
        <button
          onClick={() => setMode('playlist')}
          className={`px-3 py-1.5 rounded-sm ${mode === 'playlist' ? 'bg-ink text-paper' : 'text-ink/50 bg-paper'}`}
        >
          Colar link da playlist
        </button>
        <button
          onClick={() => setMode('name')}
          className={`px-3 py-1.5 rounded-sm ${mode === 'name' ? 'bg-ink text-paper' : 'text-ink/50 bg-paper'}`}
        >
          Buscar pelo nome
        </button>
      </div>

      {mode === 'playlist' ? (
        <form onSubmit={handlePlaylistLookup} className="flex gap-2 mb-4">
          <input
            type="url"
            value={playlistLink}
            onChange={(e) => setPlaylistLink(e.target.value)}
            placeholder="Cola o link da playlist do Spotify (ex: This Is a Banda)"
            className="flex-1 bg-paper border border-ink/20 rounded-sm px-3 py-2 font-mono text-xs focus:outline-none focus:border-burgundy"
          />
          <button
            type="submit"
            disabled={searching}
            className="font-mono text-xs uppercase px-4 py-2 rounded-sm bg-ink text-paper disabled:opacity-50 shrink-0"
          >
            {searching ? 'Buscando...' : 'Buscar info'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleNameSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome da banda"
            className="flex-1 bg-paper border border-ink/20 rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:border-burgundy"
          />
          <button
            type="submit"
            disabled={searching}
            className="font-mono text-xs uppercase px-4 py-2 rounded-sm bg-ink text-paper disabled:opacity-50 shrink-0"
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      )}

      {error && <p className="font-body text-xs text-burgundy mb-3">{error}</p>}

      {preview && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            {preview.artist.images?.[0]?.url ? (
              <img
                src={preview.artist.images[0].url}
                alt={preview.artist.name}
                className="w-20 h-20 object-cover rounded-sm shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-ink/10 rounded-sm shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-display text-lg uppercase leading-tight">{preview.artist.name}</p>
              <p className="font-mono text-[11px] text-ink/50 mt-1">
                {(preview.artist.genres || []).slice(0, 3).join(', ') || 'gênero não informado'}
              </p>
              {preview.artist.followers?.total != null && (
                <p className="font-mono text-[11px] text-ink/40">
                  {preview.artist.followers.total.toLocaleString('pt-BR')} seguidores no Spotify
                </p>
              )}
            </div>
          </div>

          {preview.bio && (
            <p className="font-body text-xs text-ink/60 leading-relaxed line-clamp-4">{preview.bio}</p>
          )}

          <div>
            <label className="font-mono text-[10px] uppercase text-ink/50 block mb-1">
              Link da playlist{preview.playlistName ? ` ("${preview.playlistName}")` : ''}
            </label>
            <input
              type="url"
              value={playlistUrlOverride}
              onChange={(e) => setPlaylistUrlOverride(e.target.value)}
              placeholder="Cola o link da playlist do Spotify"
              className="w-full bg-paper border border-ink/20 rounded-sm px-3 py-2 font-mono text-xs focus:outline-none focus:border-burgundy"
            />
          </div>

          {others.length > 1 && (
            <div>
              <label className="font-mono text-[10px] uppercase text-ink/50 block mb-1">Mandar pra</label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full bg-paper border border-ink/20 rounded-sm px-3 py-2 font-mono text-xs"
              >
                {others.map((o) => (
                  <option key={o.user_id} value={o.user_id}>
                    {o.display_name || o.user_id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={sending || !toUserId}
            className="font-display uppercase tracking-wide bg-burgundy text-paper py-2.5 rounded-sm hover:bg-burgundy-dark transition-colors disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar sugestão'}
          </button>
        </div>
      )}
    </div>
  )
}
