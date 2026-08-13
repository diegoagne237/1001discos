import { albums as staticAlbums } from '../data/albums'

export default function DashboardStats({ listenedIds, albums = staticAlbums, onShare }) {
  const total = albums.length
  const listened = albums.filter((a) => listenedIds.has(a.id)).length
  const pct = total ? Math.round((listened / total) * 100) : 0

  return (
    <section className="bg-ink text-paper rounded-sm px-6 py-6 relative overflow-hidden h-full flex flex-col justify-center">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full border-4 border-mustard/20" />
      <div className="relative">
        <p className="font-mono text-mustard text-xs tracking-[0.2em] uppercase mb-2">Seu progresso</p>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-5xl leading-none">{listened}</span>
          <span className="font-mono text-paper/60 text-base">/ {total}</span>
        </div>
        <p className="font-body text-paper/70 text-sm mt-1 mb-4">{pct}% da lista ouvida até agora</p>

        <div className="h-2 bg-paper/15 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-burgundy-light transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        {onShare && (
          <button
            onClick={onShare}
            className="font-mono text-[11px] uppercase tracking-wide px-3 py-2 rounded-sm border border-paper/25 text-paper/80 hover:border-mustard hover:text-mustard transition-colors"
          >
            Compartilhar progresso
          </button>
        )}
      </div>
    </section>
  )
}
