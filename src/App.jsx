import { useMemo } from 'react'
import { albums } from './data/albums'
import { useListened } from './hooks/useListened'
import DashboardStats from './components/DashboardStats'
import DecadeSection from './components/DecadeSection'
import Randomizer from './components/Randomizer'

export default function App() {
  const { listenedIds, toggle, isListened } = useListened()

  const decadeGroups = useMemo(() => {
    const groups = {}
    for (const album of albums) {
      if (!groups[album.decade]) groups[album.decade] = []
      groups[album.decade].push(album)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [])

  return (
    <div className="min-h-screen">
      <header className="border-b-4 border-ink bg-paper sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy">1001 discos</p>
            <h1 className="font-display text-xl sm:text-2xl uppercase leading-none">
              Para se ouvir antes de morrer
            </h1>
          </div>
          <nav className="hidden md:flex gap-1 font-mono text-xs">
            {decadeGroups.map(([decade]) => (
              <a
                key={decade}
                href={`#${decade}`}
                className="px-2 py-1 text-ink/60 hover:text-burgundy transition-colors"
              >
                {decade}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12">
        <DashboardStats listenedIds={listenedIds} />

        <Randomizer isListened={isListened} onToggle={toggle} />

        <div className="flex flex-col gap-14">
          {decadeGroups.map(([decade, decadeAlbums]) => (
            <DecadeSection
              key={decade}
              decade={decade}
              albums={decadeAlbums}
              isListened={isListened}
              onToggle={toggle}
            />
          ))}
        </div>
      </main>

      <footer className="border-t border-ink/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-mono text-[11px] text-ink/40 uppercase tracking-wide">
          Baseado em "1001 Albums You Must Hear Before You Die", org. Robert Dimery
        </div>
      </footer>
    </div>
  )
}
