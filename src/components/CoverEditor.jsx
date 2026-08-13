import { useMemo, useState } from 'react'
import { albums as staticAlbums } from '../data/albums'
import { useAlbumMetadata, mergeAlbumsWithMetadata } from '../hooks/useAlbumMetadata'
import { supabase } from '../lib/supabaseClient'

export default function CoverEditor() {
  const { metadata, reload } = useAlbumMetadata()
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState({}) // albumId -> url sendo digitada
  const [savingId, setSavingId] = useState(null)
  const [savedIds, setSavedIds] = useState(new Set())

  const albums = useMemo(() => mergeAlbumsWithMetadata(staticAlbums, metadata), [metadata])

  const missing = useMemo(() => albums.filter((a) => !a.coverUrl && !savedIds.has(a.id)), [albums, savedIds])

  const filtered = useMemo(() => {
    if (!search.trim()) return missing
    const q = search.toLowerCase()
    return missing.filter((a) => a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q))
  }, [missing, search])

  const visible = filtered.slice(0, 60) // renderiza só os 60 primeiros pra não travar a página

  const handleSave = async (albumId) => {
    const url = (drafts[albumId] || '').trim()
    if (!url) return
    setSavingId(albumId)
    const { error } = await supabase.from('album_metadata').upsert({ album_id: albumId, cover_url: url })
    setSavingId(null)
    if (error) {
      alert('Erro ao salvar: ' + error.message)
      return
    }
    setSavedIds((prev) => new Set(prev).add(albumId))
    reload()
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy mb-1">1001 discos</p>
        <h1 className="font-display text-2xl uppercase mb-2">Adicionar capas manualmente</h1>
        <p className="font-body text-sm text-ink/60 mb-1">
          {missing.length} discos ainda sem capa. Cola o link direto de uma imagem (ex: botão direito numa
          capa no Google Imagens {'>'} "copiar endereço da imagem").
        </p>
        <p className="font-mono text-[10px] text-ink/40 mb-6">
          Mostrando {visible.length} de {filtered.length}
        </p>

        <input
          type="text"
          placeholder="Filtrar por artista ou título"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-paperDark border border-ink/20 rounded-sm px-3 py-2 font-body text-sm mb-6 focus:outline-none focus:border-burgundy"
        />

        <div className="flex flex-col gap-3">
          {visible.map((album) => (
            <div
              key={album.id}
              className="bg-paperDark border border-ink/10 rounded-sm p-3 flex items-center gap-3"
            >
              <div className="w-14 h-14 bg-ink/10 rounded-sm shrink-0 overflow-hidden flex items-center justify-center">
                {drafts[album.id] ? (
                  <img
                    src={drafts[album.id]}
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
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm uppercase leading-tight truncate">{album.title}</p>
                <p className="font-body text-xs text-ink/60 truncate">
                  {album.artist} · {album.year}
                </p>
              </div>
              <input
                type="url"
                placeholder="Link da imagem"
                value={drafts[album.id] || ''}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [album.id]: e.target.value }))}
                className="w-52 shrink-0 bg-paper border border-ink/20 rounded-sm px-2 py-1.5 font-mono text-[11px] focus:outline-none focus:border-burgundy"
              />
              <button
                onClick={() => handleSave(album.id)}
                disabled={savingId === album.id || !drafts[album.id]}
                className="shrink-0 font-mono text-[10px] uppercase px-3 py-1.5 rounded-sm bg-burgundy text-paper disabled:opacity-30"
              >
                {savingId === album.id ? '...' : 'Salvar'}
              </button>
            </div>
          ))}

          {visible.length === 0 && (
            <p className="font-mono text-xs text-ink/40 text-center py-8">
              {missing.length === 0 ? 'Todas as capas resolvidas! 🎉' : 'Nenhum disco encontrado com esse filtro.'}
            </p>
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
