import { useEffect, useState } from 'react'
import AlbumCard from './AlbumCard'

const PAGE_SIZE = 12

// filterMode: 'all' | 'unheard' | 'heard'
function applyFilter(albums, filterMode, isListened) {
  if (filterMode === 'unheard') return albums.filter((a) => !isListened(a.id))
  if (filterMode === 'heard') return albums.filter((a) => isListened(a.id))
  return albums
}

export default function DecadeSection({
  decade,
  albums,
  isListened,
  onToggle,
  getRating,
  onRate,
  isFavorite,
  onOpenAlbum,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(
    () => defaultOpen || (typeof window !== 'undefined' && window.location.hash === `#${decade}`)
  )
  const [filterMode, setFilterMode] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const heardCount = albums.filter((a) => isListened(a.id)).length
  const filteredAlbums = applyFilter(albums, filterMode, isListened)
  const visibleAlbums = filteredAlbums.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAlbums.length

  // volta pra primeira página sempre que o filtro muda, pra não confundir o que tá visível
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filterMode])

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'unheard', label: 'Só não ouvidos' },
    { key: 'heard', label: 'Só ouvidos' },
  ]

  return (
    <section id={decade} className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-0">
        <button
          onClick={() => setOpen((v) => !v)}
          className="crate-tab bg-mustard inline-flex items-center gap-3 px-6 py-2 -mb-px relative z-10 hover:bg-mustard-dark transition-colors"
        >
          <span
            className={`font-mono text-xs text-ink/70 transition-transform ${open ? 'rotate-90' : ''}`}
          >
            ▸
          </span>
          <h2 className="font-display text-2xl uppercase tracking-wide text-ink">{decade}</h2>
          <span className="font-mono text-xs text-ink/70">
            {heardCount}/{albums.length}
          </span>
        </button>

        {open && (
          <div className="flex gap-1 font-mono text-[11px] uppercase tracking-wide">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterMode(f.key)}
                className={`px-3 py-1.5 rounded-sm border transition-colors ${
                  filterMode === f.key
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'border-ink/25 text-ink/60 hover:border-ink hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="border-t-2 border-mustard-dark pt-6 pb-4">
          {filteredAlbums.length === 0 ? (
            <p className="font-mono text-sm text-ink/40 py-6 text-center">
              {filterMode === 'unheard'
                ? 'Você já ouviu tudo dessa década. 🎉'
                : 'Nenhum disco marcado como ouvido ainda nessa década.'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {visibleAlbums.map((album) => (
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
                    Ver mais ({filteredAlbums.length - visibleCount} restantes)
                  </button>
                  <button
                    onClick={() => setVisibleCount(filteredAlbums.length)}
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
