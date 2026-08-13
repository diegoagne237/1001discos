import { useMemo, useState } from 'react'
import AlbumCard from './AlbumCard'

const PAGE_SIZE = 20

export default function AlbumSearch({
  albums,
  isListened,
  onToggle,
  getRating,
  onRate,
  isFavorite,
  onOpenAlbum,
  getComment,
}) {
  const [text, setText] = useState('')
  const [year, setYear] = useState('')
  const [genre, setGenre] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')
  const [listenedFilter, setListenedFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const genres = useMemo(() => [...new Set(albums.map((a) => a.genre).filter(Boolean))].sort(), [albums])

  const hasActiveFilter = Boolean(
    text.trim() || year.trim() || genre || ratingFilter || listenedFilter !== 'all'
  )

  const results = useMemo(() => {
    if (!hasActiveFilter) return []
    const q = text.trim().toLowerCase()

    return albums.filter((album) => {
      if (q) {
        const comment = (getComment ? getComment(album.id) : '') || ''
        const haystack = `${album.title} ${album.artist} ${album.blurb || ''} ${comment}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      if (year.trim() && String(album.year) !== year.trim()) return false
      if (genre && album.genre !== genre) return false
      if (ratingFilter) {
        const r = getRating ? getRating(album.id) : 0
        if (r !== Number(ratingFilter)) return false
      }
      if (listenedFilter === 'listened' && !isListened(album.id)) return false
      if (listenedFilter === 'unlistened' && isListened(album.id)) return false
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albums, text, year, genre, ratingFilter, listenedFilter, hasActiveFilter])

  const visible = results.slice(0, visibleCount)
  const hasMore = visibleCount < results.length

  const resetPage = () => setVisibleCount(PAGE_SIZE)

  const clearFilters = () => {
    setText('')
    setYear('')
    setGenre('')
    setRatingFilter('')
    setListenedFilter('all')
    resetPage()
  }

  const listenedFilters = [
    { key: 'all', label: 'Todos' },
    { key: 'listened', label: 'Ouvidos' },
    { key: 'unlistened', label: 'Não ouvidos' },
  ]

  return (
    <section className="bg-paperDark border border-ink/10 rounded-sm p-6">
      <p className="font-mono text-burgundy text-xs tracking-[0.2em] uppercase mb-1">Achar um disco</p>
      <h2 className="font-display text-2xl uppercase mb-5">Buscar na lista inteira</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            resetPage()
          }}
          placeholder="Palavra, artista, disco, comentário..."
          className="lg:col-span-2 bg-paper border border-ink/20 rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:border-burgundy"
        />
        <input
          type="number"
          value={year}
          onChange={(e) => {
            setYear(e.target.value)
            resetPage()
          }}
          placeholder="Ano"
          className="bg-paper border border-ink/20 rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-burgundy"
        />
        <select
          value={genre}
          onChange={(e) => {
            setGenre(e.target.value)
            resetPage()
          }}
          className="bg-paper border border-ink/20 rounded-sm px-3 py-2 font-mono text-sm"
        >
          <option value="">Qualquer gênero</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value)
            resetPage()
          }}
          className="bg-paper border border-ink/20 rounded-sm px-3 py-2 font-mono text-sm"
        >
          <option value="">Qualquer nota</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 font-mono text-[11px] uppercase">
          {listenedFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setListenedFilter(f.key)
                resetPage()
              }}
              className={`px-3 py-1.5 rounded-sm transition-colors ${
                listenedFilter === f.key ? 'bg-ink text-paper' : 'text-ink/50 bg-paper hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="font-mono text-[11px] uppercase text-ink/40 hover:text-burgundy"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {hasActiveFilter && (
        <div className="mt-5 pt-5 border-t border-ink/10">
          <p className="font-mono text-xs text-ink/40 mb-3">{results.length} discos encontrados</p>

          {results.length === 0 ? (
            <p className="font-mono text-sm text-ink/40 text-center py-6">Nada encontrado com esses filtros.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {visible.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    isListened={isListened}
                    onToggle={onToggle}
                    rating={getRating ? getRating(album.id) : 0}
                    onRate={onRate}
                    favorite={isFavorite ? isFavorite(album.id) : false}
                    onOpen={onOpenAlbum}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    className="font-mono text-[11px] uppercase tracking-wide px-4 py-2 rounded-sm border border-ink/25 text-ink/70 hover:border-ink hover:text-ink transition-colors"
                  >
                    Ver mais ({results.length - visibleCount} restantes)
                  </button>
                  <button
                    onClick={() => setVisibleCount(results.length)}
                    className="font-mono text-[11px] uppercase tracking-wide px-4 py-2 rounded-sm text-ink/40 hover:text-burgundy transition-colors"
                  >
                    Ver tudo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
