import { useState } from 'react'
import StarRating from '../StarRating'

export default function BandSuggestionCard({ suggestion, role, otherName, onSaveEvaluation, onRelease, onRemove }) {
  const [rating, setRating] = useState(suggestion.rating || 0)
  const [comment, setComment] = useState(suggestion.comment || '')
  const [saving, setSaving] = useState(false)

  const isReceiver = role === 'received'
  const isReleased = suggestion.status === 'released'
  const dirty = rating !== (suggestion.rating || 0) || comment !== (suggestion.comment || '')

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveEvaluation(suggestion.id, { rating, comment: comment.trim() || null })
    } finally {
      setSaving(false)
    }
  }

  const handleRelease = async () => {
    setSaving(true)
    try {
      if (dirty) await onSaveEvaluation(suggestion.id, { rating, comment: comment.trim() || null })
      await onRelease(suggestion.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-paperDark border border-ink/10 rounded-sm p-4 flex flex-col gap-3">
      <div className="flex gap-3">
        {suggestion.artist_image_url ? (
          <img
            src={suggestion.artist_image_url}
            alt={suggestion.band_name}
            className="w-16 h-16 object-cover rounded-sm shrink-0"
          />
        ) : (
          <div className="w-16 h-16 bg-ink/10 rounded-sm shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-base uppercase leading-tight">{suggestion.band_name}</p>
          {suggestion.genres && <p className="font-mono text-[10px] text-ink/50 mt-0.5">{suggestion.genres}</p>}
          <p className="font-mono text-[10px] text-ink/35 mt-0.5">
            {isReceiver ? `de ${otherName}` : `pra ${otherName}`} ·{' '}
            {new Date(suggestion.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {suggestion.bio && (
        <p className="font-body text-xs text-ink/60 leading-relaxed line-clamp-3">{suggestion.bio}</p>
      )}

      {(suggestion.playlist_url || suggestion.artist_spotify_url) && (
        <a
          href={suggestion.playlist_url || suggestion.artist_spotify_url}
          target="_blank"
          rel="noreferrer"
          className="self-start font-mono text-[11px] uppercase text-petrol underline underline-offset-2"
        >
          {suggestion.playlist_url ? 'Ouvir playlist no Spotify' : 'Ver artista no Spotify'}
        </a>
      )}

      {isReceiver ? (
        isReleased ? (
          <div className="pt-2 border-t border-ink/10 flex items-center justify-between">
            <StarRating rating={suggestion.rating || 0} size="text-base" />
            <span className="font-mono text-[10px] uppercase text-mustard-dark">Liberado ✓</span>
          </div>
        ) : (
          <div className="pt-2 border-t border-ink/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-ink/50">Sua nota</span>
              <StarRating rating={rating} onRate={setRating} size="text-base" />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que achou?"
              rows={2}
              maxLength={280}
              className="w-full bg-paper border border-ink/20 rounded-sm px-3 py-2 font-body text-xs resize-none focus:outline-none focus:border-burgundy"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="font-mono text-[10px] uppercase px-3 py-1.5 rounded-sm border border-ink/25 text-ink/60 disabled:opacity-30"
              >
                Salvar rascunho
              </button>
              <button
                onClick={handleRelease}
                disabled={saving || !rating}
                className="font-mono text-[10px] uppercase px-3 py-1.5 rounded-sm bg-burgundy text-paper disabled:opacity-30"
              >
                Liberar avaliação
              </button>
            </div>
          </div>
        )
      ) : isReleased ? (
        <div className="pt-2 border-t border-ink/10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-ink/50">Nota de {otherName}</span>
            <StarRating rating={suggestion.rating || 0} size="text-base" />
          </div>
          {suggestion.comment && <p className="font-body text-xs text-ink/70 italic">"{suggestion.comment}"</p>}
        </div>
      ) : (
        <div className="pt-2 border-t border-ink/10 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase text-ink/40">Aguardando {otherName} ouvir</span>
          {onRemove && (
            <button
              onClick={() => onRemove(suggestion.id)}
              className="font-mono text-[10px] uppercase text-ink/30 hover:text-burgundy"
            >
              Remover
            </button>
          )}
        </div>
      )}
    </div>
  )
}
