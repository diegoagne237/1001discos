import { albums as staticAlbums } from '../data/albums'

const DECADES_ORDER = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']

export default function DashboardStats({ listenedIds, albums = staticAlbums, onShare }) {
  const total = albums.length
  const listened = albums.filter((a) => listenedIds.has(a.id)).length
  const pct = total ? Math.round((listened / total) * 100) : 0

  const byDecade = DECADES_ORDER.map((decade) => {
    const inDecade = albums.filter((a) => a.decade === decade)
    const heard = inDecade.filter((a) => listenedIds.has(a.id)).length
    return { decade, total: inDecade.length, heard }
  }).filter((d) => d.total > 0)

  return (
    <section className="bg-ink text-paper rounded-sm px-6 py-8 md:px-10 md:py-10 relative overflow-hidden">
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-4 border-mustard/20" />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <p className="font-mono text-mustard text-xs tracking-[0.2em] uppercase mb-2">
            Seu progresso
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-6xl md:text-7xl leading-none">{listened}</span>
            <span className="font-mono text-paper/60 text-lg">/ {total}</span>
          </div>
          <p className="font-body text-paper/70 mt-2">
            {pct}% da lista ouvida até agora
          </p>
        </div>

        <div className="w-full md:w-auto md:min-w-[320px] flex flex-col items-stretch gap-3">
          <div className="h-2 bg-paper/15 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-burgundy-light transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {onShare && (
            <button
              onClick={onShare}
              className="font-mono text-[11px] uppercase tracking-wide px-3 py-2 rounded-sm border border-paper/25 text-paper/80 hover:border-mustard hover:text-mustard transition-colors self-start md:self-auto"
            >
              Compartilhar progresso
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-4 sm:grid-cols-8 gap-2">
        {byDecade.map(({ decade, total, heard }) => {
          const dPct = total ? Math.round((heard / total) * 100) : 0
          return (
            <div key={decade} className="text-center">
              <div className="h-16 flex items-end justify-center mb-1">
                <div
                  className="w-3 bg-mustard rounded-t-sm transition-all duration-700"
                  style={{ height: `${Math.max(dPct, 4)}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-paper/60">{decade.replace('20', "'").replace('19', "'")}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
