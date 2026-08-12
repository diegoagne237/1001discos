import { useMemo } from 'react'
import { albums as staticAlbums } from './data/albums'
import { useAuth } from './hooks/useAuth'
import { useListened } from './hooks/useListened'
import { useAlbumMetadata, mergeAlbumsWithMetadata } from './hooks/useAlbumMetadata'
import Auth from './components/Auth'
import DashboardStats from './components/DashboardStats'
import DecadeSection from './components/DecadeSection'
import Randomizer from './components/Randomizer'
import SyncSpotify from './components/SyncSpotify'

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { listenedIds, toggle, isListened, getRating, setRating } = useListened(user?.id)
  const { metadata } = useAlbumMetadata()

  // /?sync=1 abre a página de sincronização com o Spotify (roda no navegador, veja SyncSpotify.jsx)
  const isSyncPage = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sync')

  const albums = useMemo(() => mergeAlbumsWithMetadata(staticAlbums, metadata), [metadata])

  const decadeGroups = useMemo(() => {
    const groups = {}
    for (const album of albums) {
      if (!groups[album.decade]) groups[album.decade] = []
      groups[album.decade].push(album)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [albums])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-ink/50 uppercase tracking-wide">Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  if (isSyncPage) {
    return <SyncSpotify />
  }

  return (
    <div className="min-h-screen">
      <header className="border-b-4 border-ink bg-paper sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy">1001 discos</p>
            <h1 className="font-display text-xl sm:text-2xl uppercase leading-none">
              Para se ouvir antes de morrer
            </h1>
          </div>
          <div className="flex items-center gap-4">
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
            <button
              onClick={signOut}
              className="font-mono text-[11px] uppercase text-ink/50 hover:text-burgundy shrink-0"
              title={user.email}
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12">
        <DashboardStats listenedIds={listenedIds} />

        <Randomizer albums={albums} isListened={isListened} onToggle={toggle} />

        <div className="flex flex-col gap-14">
          {decadeGroups.map(([decade, decadeAlbums], index) => (
            <DecadeSection
              key={decade}
              decade={decade}
              albums={decadeAlbums}
              isListened={isListened}
              onToggle={toggle}
              getRating={getRating}
              onRate={setRating}
              defaultOpen={index === 0}
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
