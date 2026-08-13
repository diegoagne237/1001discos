import { useMemo, useState } from 'react'

export default function Randomizer({ albums, isListened, onToggle }) {
  const DECADES = useMemo(() => [...new Set(albums.map((a) => a.decade))].sort(), [albums])
  const GENRES = useMemo(
    () => [...new Set(albums.map((a) => a.genre).filter(Boolean))].sort(),
    [albums]
  )
  const [decadeFilter, setDecadeFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')
  const [onlyUnheard, setOnlyUnheard] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [result, setResult] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [searched, setSearched] = useState(false)

  const sortear = () => {
    const pool = albums.filter((a) => {
      if (decadeFilter !== 'all' && a.decade !== decadeFilter) return false
      if (genreFilter !== 'all' && a.genre !== genreFilter) return false
      if (onlyUnheard && isListened(a.id)) return false
      return true
    })

    if (pool.length === 0) {
      setResult(null)
      setSearched(true)
      return
    }

    setSpinning(true)
    setTimeout(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)]
      setResult(pick)
      setSearched(true)
      setSpinning(false)
    }, 400)
  }

  const hasActiveFilter = decadeFilter !== 'all' || genreFilter !== 'all' || onlyUnheard

  return (
    <section className="bg-petrol text-paper rounded-sm p-5 h-full flex flex-col justify-center">
      <p className="font-mono text-mustard text-xs tracking-[0.2em] uppercase mb-1">Sem ideia do que ouvir?</p>
      <h2 className="font-display text-2xl uppercase mb-3">Sorteador de disco</h2>

      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="self-start font-mono text-[11px] uppercase text-paper/50 hover:text-paper mb-3 underline underline-offset-2"
      >
        {filtersOpen ? 'Esconder filtros' : hasActiveFilter ? 'Ajustar filtros ●' : 'Ajustar filtros'}
      </button>

      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <select
            value={decadeFilter}
            onChange={(e) => setDecadeFilter(e.target.value)}
            className="bg-paper text-ink font-mono text-sm px-3 py-2 rounded-sm border border-paper/20"
          >
            <option value="all">Qualquer década</option>
            {DECADES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="bg-paper text-ink font-mono text-sm px-3 py-2 rounded-sm border border-paper/20"
          >
            <option value="all">Qualquer gênero</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 font-mono text-sm px-3 py-2 bg-paper/10 rounded-sm border border-paper/20 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyUnheard}
              onChange={(e) => setOnlyUnheard(e.target.checked)}
              className="accent-mustard"
            />
            Só não ouvidos
          </label>
        </div>
      )}

      <button
        onClick={sortear}
        className="self-start font-display uppercase tracking-wide bg-mustard text-ink px-6 py-2.5 rounded-sm hover:bg-mustard-dark transition-colors"
      >
        Sortear disco
      </button>

      {spinning && (
        <p className="font-mono text-sm text-paper/60 mt-4 animate-pulse">Girando o crate...</p>
      )}

      {!spinning && result && (
        <div className="mt-4 bg-paper text-ink rounded-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 bg-ink rounded-sm overflow-hidden flex items-center justify-center shrink-0">
            {result.coverUrl ? (
              <img src={result.coverUrl} alt={`Capa de ${result.title}`} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-paper/80 text-[9px] text-center uppercase px-1 leading-tight">
                {result.title}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-lg uppercase leading-tight truncate">{result.title}</p>
            <p className="font-body text-sm text-ink/70">{result.artist} · {result.year}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {result.spotifyUrl && (
              <a
                href={result.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase px-3 py-2 rounded-sm bg-petrol text-paper hover:bg-petrol-dark"
              >
                Spotify
              </a>
            )}
            <button
              onClick={() => onToggle(result.id)}
              className="font-mono text-xs uppercase px-3 py-2 rounded-sm border border-ink/30 hover:border-ink"
            >
              {isListened(result.id) ? 'Desmarcar' : 'Marcar ouvido'}
            </button>
          </div>
        </div>
      )}

      {!spinning && searched && result === null && (
        <p className="font-mono text-sm text-paper/50 mt-4">
          Nenhum disco encontrado com esses filtros — tenta afrouxar um pouco.
        </p>
      )}
    </section>
  )
}
