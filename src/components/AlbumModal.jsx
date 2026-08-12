import { useEffect, useState } from 'react'
import StarRating from './StarRating'

export default function AlbumModal({
  album,
  onClose,
  isListened,
  onToggle,
  rating,
  onRate,
  favorite,
  onFavorite,
  comment,
  onSaveComment,
}) {
  const [draftComment, setDraftComment] = useState(comment || '')
  const [saved, setSaved] = useState(false)
  const heard = isListened(album.id)

  useEffect(() => {
    setDraftComment(comment || '')
  }, [comment, album.id])

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSaveComment = () => {
    onSaveComment(album.id, draftComment.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-ink/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-paper max-w-lg w-full rounded-sm overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="aspect-square w-full bg-ink/90 flex items-center justify-center">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={`Capa de ${album.title}`} className="w-full h-full object-cover" />
            ) : (
              <p className="font-display text-paper/80 text-xl text-center uppercase tracking-wide px-8">
                {album.title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink/70 text-paper flex items-center justify-center hover:bg-ink"
          >
            ✕
          </button>
          {heard && favorite && (
            <div className="stamp absolute -top-1 -left-1 bg-burgundy text-paper text-[10px] font-display uppercase tracking-wider px-2 py-1 rounded-sm shadow-md">
              ♥ Favorito
            </div>
          )}
        </div>

        <div className="p-6">
          <p className="font-display text-2xl uppercase leading-tight">{album.title}</p>
          <p className="font-body text-base text-ink/70">{album.artist}</p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 font-mono text-xs text-ink/50">
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

          {album.blurb && <p className="font-body text-sm text-ink/60 mt-3 leading-relaxed">{album.blurb}</p>}

          <div className="flex items-center gap-3 mt-5">
            {album.spotifyUrl ? (
              <a
                href={album.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase px-4 py-2 rounded-sm bg-petrol text-paper hover:bg-petrol-dark transition-colors"
              >
                Ouvir no Spotify
              </a>
            ) : (
              <span className="font-mono text-xs uppercase text-ink/30">Link do Spotify ainda não resolvido</span>
            )}

            <button
              onClick={() => onToggle(album.id)}
              className={`font-mono text-xs uppercase px-4 py-2 rounded-sm border transition-colors ${
                heard
                  ? 'border-burgundy text-burgundy hover:bg-burgundy hover:text-paper'
                  : 'border-ink/30 text-ink/60 hover:border-ink hover:text-ink'
              }`}
            >
              {heard ? 'Desmarcar ouvido' : 'Marcar ouvido'}
            </button>
          </div>

          {heard ? (
            <div className="mt-6 pt-5 border-t border-ink/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-ink/50">Sua nota</span>
                <StarRating rating={rating} onRate={(n) => onRate(album.id, n)} size="text-xl" />
              </div>

              <button
                onClick={() => onFavorite(album.id, !favorite)}
                className={`self-start font-mono text-xs uppercase px-3 py-1.5 rounded-sm border transition-colors ${
                  favorite
                    ? 'bg-burgundy text-paper border-burgundy'
                    : 'border-ink/25 text-ink/60 hover:border-ink hover:text-ink'
                }`}
              >
                {favorite ? '♥ Favoritado' : '♡ Marcar como favorito'}
              </button>

              <div>
                <label className="font-mono text-xs uppercase text-ink/50 block mb-1.5">
                  Comentário rápido
                </label>
                <textarea
                  value={draftComment}
                  onChange={(e) => setDraftComment(e.target.value)}
                  placeholder="O que achou desse disco?"
                  rows={3}
                  maxLength={280}
                  className="w-full bg-paperDark border border-ink/20 rounded-sm px-3 py-2 font-body text-sm resize-none focus:outline-none focus:border-burgundy"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-[10px] text-ink/30">{draftComment.length}/280</span>
                  <button
                    onClick={handleSaveComment}
                    disabled={draftComment === (comment || '')}
                    className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm bg-ink text-paper disabled:opacity-30 hover:bg-ink/80 transition-colors"
                  >
                    {saved ? 'Salvo ✓' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs text-ink/40 mt-6 pt-5 border-t border-ink/10">
              Marca como ouvido pra poder avaliar, favoritar e comentar.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
