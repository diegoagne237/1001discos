import { useCallback, useMemo, useState } from 'react'
import { albums as staticAlbums } from './data/albums'
import { useAuth } from './hooks/useAuth'
import { useListened } from './hooks/useListened'
import { useAlbumMetadata, mergeAlbumsWithMetadata } from './hooks/useAlbumMetadata'
import { useHasAccess } from './hooks/useAccessControl'
import AuthModal from './components/AuthModal'
import DashboardStats from './components/DashboardStats'
import DecadeSection from './components/DecadeSection'
import Randomizer from './components/Randomizer'
import SyncSpotify from './components/SyncSpotify'
import SyncCovers from './components/SyncCovers'
import Lab from './components/Lab'
import BackToTop from './components/BackToTop'
import AlbumModal from './components/AlbumModal'
import Onboarding, { hasSeenOnboarding } from './components/Onboarding'
import ShareProgress from './components/ShareProgress'

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    listenedIds,
    toggle,
    isListened,
    getRating,
    setRating,
    favorites,
    isFavorite,
    setFavorite,
    getComment,
    setComment,
  } = useListened(user?.id)
  const { metadata } = useAlbumMetadata()
  const { hasAccess: hasLabAccess, loading: labAccessLoading } = useHasAccess(user?.id)

  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(() => user && !hasSeenOnboarding())
  const [showShare, setShowShare] = useState(false)
  const [authModalReason, setAuthModalReason] = useState(null) // string | null — null = fechado

  // /?sync=1 abre a página de sincronização com o Spotify (roda no navegador, veja SyncSpotify.jsx)
  const isSyncPage = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('sync')
  // /?covers=1 abre a sincronização de capas via iTunes (não precisa de login nem chave)
  const isCoversPage = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('covers')
  // /?lab=1 abre a área escondida, liberada só pra quem está na tabela allowed_users
  const isLabPage = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('lab')

  const albums = useMemo(() => mergeAlbumsWithMetadata(staticAlbums, metadata), [metadata])

  const decadeGroups = useMemo(() => {
    const groups = {}
    for (const album of albums) {
      if (!groups[album.decade]) groups[album.decade] = []
      groups[album.decade].push(album)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [albums])

  // Envolve qualquer ação que precise de login: se a pessoa ainda é visitante, abre o modal
  // de cadastro/login em vez de executar a ação. Se já está logada, executa normal.
  const requireAuth = useCallback(
    (fn, reason) =>
      (...args) => {
        if (!user) {
          setAuthModalReason(reason)
          return
        }
        fn(...args)
      },
    [user]
  )

  const guardedToggle = requireAuth(toggle, 'Cria uma conta pra marcar discos como ouvidos')
  const guardedSetRating = requireAuth(setRating, 'Cria uma conta pra avaliar os discos')
  const guardedSetFavorite = requireAuth(setFavorite, 'Cria uma conta pra favoritar discos')
  const guardedSetComment = requireAuth(setComment, 'Cria uma conta pra deixar comentários')

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-ink/50 uppercase tracking-wide">Carregando...</p>
      </div>
    )
  }

  if (isSyncPage) {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <p className="font-display text-xl uppercase mb-3">Precisa estar logado</p>
            <button
              onClick={() => setAuthModalReason('Entra pra acessar a sincronização com o Spotify')}
              className="font-mono text-xs uppercase px-4 py-2 rounded-sm bg-burgundy text-paper"
            >
              Entrar
            </button>
          </div>
          {authModalReason && (
            <AuthModal reason={authModalReason} onClose={() => setAuthModalReason(null)} />
          )}
        </div>
      )
    }
    return <SyncSpotify />
  }

  if (isCoversPage) {
    return <SyncCovers />
  }

  if (isLabPage) {
    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <p className="font-display text-xl uppercase mb-3">Precisa estar logado</p>
            <button
              onClick={() => setAuthModalReason('Entra pra acessar essa área')}
              className="font-mono text-xs uppercase px-4 py-2 rounded-sm bg-burgundy text-paper"
            >
              Entrar
            </button>
          </div>
          {authModalReason !== null && (
            <AuthModal reason={authModalReason || null} onClose={() => setAuthModalReason(null)} />
          )}
        </div>
      )
    }
    if (labAccessLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="font-mono text-sm text-ink/50 uppercase tracking-wide">Carregando...</p>
        </div>
      )
    }
    if (!hasLabAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <p className="font-mono text-sm text-ink/50 uppercase tracking-wide text-center">
            Você não tem acesso a essa área.
          </p>
        </div>
      )
    }
    return <Lab />
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
            {user && (
              <button
                onClick={() => setShowOnboarding(true)}
                aria-label="Como funciona"
                className="w-6 h-6 rounded-full border border-ink/30 text-ink/50 hover:border-burgundy hover:text-burgundy text-xs font-mono flex items-center justify-center shrink-0"
              >
                ?
              </button>
            )}
            {user ? (
              <button
                onClick={signOut}
                className="font-mono text-[11px] uppercase text-ink/50 hover:text-burgundy shrink-0"
                title={user.email}
              >
                Sair
              </button>
            ) : (
              <button
                onClick={() => setAuthModalReason('')}
                className="font-mono text-[11px] uppercase px-3 py-1.5 rounded-sm bg-burgundy text-paper hover:bg-burgundy-dark transition-colors shrink-0"
              >
                Entrar / Criar conta
              </button>
            )}
          </div>
        </div>

        {!user && (
          <div className="bg-mustard/25 border-t border-mustard/40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
              <p className="font-mono text-[11px] text-ink/70">
                Você está navegando como visitante — dá pra explorar a lista à vontade. Pra marcar
                discos, avaliar, favoritar ou comentar, cria uma conta (é rápido).
              </p>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12">
        <DashboardStats
          listenedIds={listenedIds}
          albums={albums}
          onShare={() => (user ? setShowShare(true) : setAuthModalReason('Cria uma conta pra acompanhar e compartilhar seu progresso'))}
        />

        <Randomizer albums={albums} isListened={isListened} onToggle={guardedToggle} />

        <div className="flex flex-col gap-14">
          {decadeGroups.map(([decade, decadeAlbums], index) => (
            <DecadeSection
              key={decade}
              decade={decade}
              albums={decadeAlbums}
              isListened={isListened}
              onToggle={guardedToggle}
              getRating={getRating}
              onRate={guardedSetRating}
              isFavorite={isFavorite}
              onOpenAlbum={setSelectedAlbum}
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

      <BackToTop />

      {selectedAlbum && (
        <AlbumModal
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          isListened={isListened}
          onToggle={guardedToggle}
          rating={getRating(selectedAlbum.id)}
          onRate={guardedSetRating}
          favorite={isFavorite(selectedAlbum.id)}
          onFavorite={guardedSetFavorite}
          comment={getComment(selectedAlbum.id)}
          onSaveComment={guardedSetComment}
        />
      )}

      {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}

      {showShare && (
        <ShareProgress
          albums={albums}
          listenedIds={listenedIds}
          favorites={favorites}
          onClose={() => setShowShare(false)}
        />
      )}

      {authModalReason !== null && (
        <AuthModal reason={authModalReason || null} onClose={() => setAuthModalReason(null)} />
      )}
    </div>
  )
}
