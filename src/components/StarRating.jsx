export default function StarRating({ rating, onRate, size = 'text-sm' }) {
  const readOnly = !onRate

  return (
    <div className="flex items-center gap-0.5" role="radiogroup" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <span key={n} className={`${size} leading-none ${n <= rating ? 'text-mustard' : 'text-ink/15'}`}>
            ★
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onRate(n)}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            className={`${size} leading-none transition-colors ${
              n <= rating ? 'text-mustard' : 'text-ink/20 hover:text-mustard/50'
            }`}
          >
            ★
          </button>
        )
      )}
    </div>
  )
}
