import { useEffect, useMemo, useState } from 'react'
import { albums as staticAlbums } from '../data/albums'
import { useAlbumMetadata, mergeAlbumsWithMetadata } from '../hooks/useAlbumMetadata'
import { supabase } from '../lib/supabaseClient'

const PAGE_SIZE = 20

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'missing-cover', label: 'Sem capa' },
  { key: 'missing-link', label: 'Sem link' },
  { key: 'missing-genre', label: 'Sem gênero' },
]

function isMissingLink(album) {
  return !album.spotifyUrl || album.spotifyUrl.includes('/search/')
}

function AdminAlbumRow({ album, onSave }) {
  const [coverUrl, setCoverUrl] = useState(album.coverUrl || '')
  const [spotifyUrl, setSpotifyUrl] = useState(album.spotifyUrl && !album.spotifyUrl.includes('/search/') ? album.spotifyUrl : '')
  const [genre, setGenre] = useState(album.genre || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isDataUri = coverUrl.trim().startsWith('data:')

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('album_metadata').upsert({
      album_id: album.id,
      cover_url: coverUrl.trim() || null,
      spotify_url: spotifyUrl.trim() || null,
      genre: genre.trim() || null,
    })
    setSaving(false)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
      return
    }
    setSaved(true)
    onSave()
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="bg-paperDark border border-ink/10 rounded-sm p-3 flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="w-14 h-14 bg-ink/10 rounded-sm shrink-0 overflow-hidden flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <span className="font-mono text-[9px] text-ink/30 text-center px-1">sem capa</span>
        )}
      </div>

      <div className="min-w-0 sm:w-44 shrink-0">
        <div className="flex items-start gap-1.5">
          <div className="min-w-0">
            <p className="font-display text-sm uppercase leading-tight truncate">{album.title}</p>
            <p className="font-body text-xs text-ink/60 truncate">
              {album.artist} · {album.year}
            </p>
          </div>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `${album.title.toUpperCase()} ${album.artist} · ${album.year} spotify`
            )}&udm=2`}
            target="_blank"
            rel="noreferrer"
            title="Buscar capa no Google Imagens"
            className="shrink-0 w-5 h-5 rounded-full border border-ink/25 text-ink/40 hover:border-burgundy hover:text-burgundy text-[10px] flex items-center justify-center mt-0.5"
          >
            🔍
          </a>
        </div>
      </div>

      <input
        type="url"
        placeholder="Link da capa"
        value={coverUrl}
        onChange={(e) => setCoverUrl(e.target.value)}
        className={`flex-1 min-w-0 bg-paper border rounded-sm px-2 py-1.5 font-mono text-[11px] focus:outline-none ${
          isDataUri ? 'border-burgundy' : 'border-ink/20 focus:border-burgundy'
        }`}
      />
      <input
        type="url"
        placeholder="Link do Spotify"
        value={spotifyUrl}
        onChange={(e) => setSpotifyUrl(e.target.value)}
        className="flex-1 min-w-0 bg-paper border border-ink/20 rounded-sm px-2 py-1.5 font-mono text-[11px] focus:outline-none focus:border-burgundy"
      />
      <input
        type="text"
        placeholder="Gênero"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
        className="w-32 shrink-0 bg-paper border border-ink/20 rounded-sm px-2 py-1.5 font-mono text-[11px] focus:outline-none focus:border-burgundy"
      />

      <button
        onClick={handleSave}
        disabled={saving || isDataUri}
        title={isDataUri ? 'Esse link parece ser uma prévia temporária do Google, não vai funcionar' : undefined}
        className="shrink-0 font-mono text-[10px] uppercase px-3 py-1.5 rounded-sm bg-burgundy text-paper disabled:opacity-30"
      >
        {saving ? '...' : saved ? 'Salvo ✓' : 'Salvar'}
      </button>
      </div>
      {isDataUri && (
        <p className="font-mono text-[10px] text-burgundy">
          Esse link é uma prévia temporária do Google (não é um link de imagem de verdade). Abre a
          imagem em tamanho grande primeiro e copia o endereço de lá.
        </p>
      )}
    </div>
  )
}

export default function AdminCatalog() {
  const { metadata, loading, reload } = useAlbumMetadata()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!loading) setInitialized(true)
  }, [loading])

  const albums = useMemo(() => mergeAlbumsWithMetadata(staticAlbums, metadata), [metadata])

  const filtered = useMemo(() => {
    let list = albums
    if (filter === 'missing-cover') list = list.filter((a) => !a.coverUrl)
    else if (filter === 'missing-link') list = list.filter(isMissingLink)
    else if (filter === 'missing-genre') list = list.filter((a) => !a.genre)

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
    }
    return list
  }, [albums, filter, search])

  useEffect(() => {
    setPage(1)
  }, [search, filter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts = useMemo(
    () => ({
      cover: albums.filter((a) => !a.coverUrl).length,
      link: albums.filter(isMissingLink).length,
      genre: albums.filter((a) => !a.genre).length,
    }),
    [albums]
  )

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-ink/50 uppercase tracking-wide">Carregando catálogo...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy mb-1">1001 discos</p>
        <h1 className="font-display text-2xl uppercase mb-1">Gerenciar catálogo</h1>
        <p className="font-body text-sm text-ink/60 mb-4">
          {counts.cover} sem capa · {counts.link} sem link · {counts.genre} sem gênero
        </p>

        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-ink/10">
          <a href="/?admin=1" className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm bg-ink text-paper">
            Gerenciar catálogo
          </a>
          <a
            href="/?sync=1"
            className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm border border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
          >
            Sincronizar Spotify
          </a>
          <a
            href="/?covers=1"
            className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm border border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
          >
            Sincronizar capas (iTunes)
          </a>
          <a
            href="/?covers-edit=1"
            className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm border border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
          >
            Editor manual de capas
          </a>
          <a
            href="/?lab=1"
            className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm border border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
          >
            Bandas pra conhecer
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por artista ou título"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-paperDark border border-ink/20 rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:border-burgundy"
          />
          <div className="flex gap-1 font-mono text-[11px] uppercase">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 rounded-sm transition-colors whitespace-nowrap ${
                  filter === f.key ? 'bg-ink text-paper' : 'text-ink/50 bg-paperDark hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[11px] text-ink/40">
            {filtered.length} discos encontrados
          </p>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 rounded-sm border border-ink/20 text-ink/60 disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span className="text-ink/50">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 rounded-sm border border-ink/20 text-ink/60 disabled:opacity-30"
            >
              Próxima →
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {visible.map((album) => (
            <AdminAlbumRow key={album.id} album={album} onSave={reload} />
          ))}
          {visible.length === 0 && (
            <p className="font-mono text-xs text-ink/40 text-center py-8">Nenhum disco encontrado.</p>
          )}
        </div>

        <a
          href="/"
          className="inline-block mt-8 font-mono text-xs uppercase text-petrol underline underline-offset-2"
        >
          ← Voltar pro app
        </a>
      </div>
    </div>
  )
}
