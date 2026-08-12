import { useEffect, useState } from 'react'
import AlbumCard from './AlbumCard'

const PAGE_SIZE = 12

export default function DecadeSection({ decade, albums, isListened, onToggle, getRating, onRate }) {
  const [onlyUnheard, setOnlyUnheard] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const heardCount = albums.filter((a) => isListened(a.id)).length
  const filteredAlbums = onlyUnheard ? albums.filter((a) => !isListened(a.id)) : albums
  const visibleAlbums = filteredAlbums.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAlbums.length

  // volta pra primeira página sempre que o filtro muda, pra não confundir o que tá visível
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [onlyUnheard])

  return (
    <section id={decade} className="scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-0">
        <div className="crate-tab bg-mustard inline-flex items-baseline gap-3 px-6 py-2 -mb-px relative z-10">
          <h2 className="font-display text-2xl uppercase tracking-wide text-ink">{decade}</h2>
          <span className="font-mono text-xs text-ink/70">
            {heardCount}/{albums.length}
          </span>
        </div>

        <button
          onClick={() => setOnlyUnheard((v) => !v)}
          className={`font-mono text-[11px] uppercase tracking-wide px-3 py-1.5 rounded-sm border transition-colors
          ${onlyUnheard
            ? 'bg-burgundy text-paper border-burgundy'
            : 'border-ink/25 text-ink/60 hover:border-ink hover:text-ink'}`}
        >
          {onlyUnheard ? 'Mostrando só não ouvidos' : 'Mostrar só não ouvidos'}
        </button>
      </div>

      <div className="border-t-2 border-mustard-dark pt-6 pb-4">
        {filteredAlbums.length === 0 ? (
          <p className="font-mono text-sm text-ink/40 py-6 text-center">
            Você já ouviu tudo dessa década. 🎉
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
    </section>
  )
}
