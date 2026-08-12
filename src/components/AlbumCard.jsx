function StarRating({ rating, onRate }) {
  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onRate(n)}
          aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
          className={`text-sm leading-none transition-colors ${
            n <= rating ? 'text-mustard' : 'text-ink/20 hover:text-mustard/50'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function AlbumCard({ album, isListened, onToggle, rating = 0, onRate }) {
  const heard = isListened(album.id)
  const hasSpotifyLink = Boolean(album.spotifyUrl)

  return (
    <div
      className={`group relative bg-paperDark border border-ink/10 rounded-sm p-4 flex flex-col gap-3 transition-all
      ${heard ? 'ring-1 ring-mustard/60' : 'hover:border-ink/25'}`}
    >
      {heard && (
        <div className="stamp absolute -top-2 -right-2 bg-burgundy text-paper text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-sm shadow-md z-10">
          Ouvido
        </div>
      )}

      <div className="aspect-square w-full bg-ink/90 rounded-sm overflow-hidden flex items-center justify-center relative">
        {album.coverUrl ? (
          <img src={album.coverUrl} alt={`Capa de ${album.title}`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-3">
            <p className="font-display text-paper/80 text-sm leading-tight uppercase tracking-wide">
              {album.title}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1">
        <p className="font-display text-lg leading-tight uppercase">{album.title}</p>
        <p className="font-body text-sm text-ink/70">{album.artist}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 font-mono text-[11px] text-ink/50">
          <span>{album.year}</span>
          {album.genre && (
            <>
              <span className="text-mustard-dark">·</span>
              <span>{album.genre}</span>
            </>
          )}
          {album.country && (
            <>
              <span className="text-mustard-dark">·</span>
              <span>{album.country}</span>
            </>
          )}
        </div>
        {album.blurb && (
          <p className="font-body text-xs text-ink/60 mt-2 leading-relaxed">{album.blurb}</p>
        )}
      </div>

      {heard && onRate && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase text-ink/40">Sua nota</span>
          <StarRating rating={rating} onRate={(n) => onRate(album.id, n)} />
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink/10">
        {hasSpotifyLink ? (
          <a
            href={album.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[11px] uppercase tracking-wide text-petrol hover:text-petrol-dark underline decoration-petrol/30 underline-offset-2"
          >
            Ouvir no Spotify
          </a>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink/30">Sem link ainda</span>
        )}
        <button
          onClick={() => onToggle(album.id)}
          className={`font-mono text-[11px] uppercase tracking-wide px-2.5 py-1 rounded-sm border transition-colors
          ${heard
            ? 'border-burgundy text-burgundy hover:bg-burgundy hover:text-paper'
            : 'border-ink/30 text-ink/60 hover:border-ink hover:text-ink'}`}
        >
          {heard ? 'Desmarcar' : 'Marcar'}
        </button>
      </div>
    </div>
  )
}
