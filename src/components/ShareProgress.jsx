import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'

const DECADES_ORDER = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']

const CARD_W = 360
const CARD_H = 450

// posições do "leque" de capas — valores fixos em px, já que o card agora tem tamanho fixo
// (não depende mais da largura da tela, então não precisa ser tudo em %)
const COVER_SLOTS = [
  { left: 12, bottom: 10, size: 78, rotate: -14, z: 3 },
  { left: 82, bottom: 34, size: 78, rotate: 9, z: 4 },
  { left: 152, bottom: 4, size: 78, rotate: -7, z: 5 },
  { left: 222, bottom: 30, size: 78, rotate: 13, z: 4 },
  { left: 288, bottom: 2, size: 78, rotate: -11, z: 3 },
  { left: -22, bottom: 52, size: 64, rotate: 17, z: 2 },
  { left: 350, bottom: 46, size: 64, rotate: -19, z: 2 },
]

function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function ShareProgress({ albums, listenedIds, favorites, onClose }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  const total = albums.length
  const listened = albums.filter((a) => listenedIds.has(a.id)).length
  const pct = total ? Math.round((listened / total) * 100) : 0
  const favoriteCount = favorites ? favorites.size : 0

  const byDecade = DECADES_ORDER.map((decade) => {
    const inDecade = albums.filter((a) => a.decade === decade)
    const heard = inDecade.filter((a) => listenedIds.has(a.id)).length
    return { decade, total: inDecade.length, heard }
  }).filter((d) => d.total > 0)

  const topDecade = [...byDecade].sort((a, b) => b.heard - a.heard)[0]

  const coverPool = useMemo(
    () => albums.filter((a) => listenedIds.has(a.id) && a.coverUrl),
    [albums, listenedIds]
  )

  const randomCovers = useMemo(
    () => shuffle(coverPool).slice(0, 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [coverPool, shuffleSeed]
  )

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.download = `1001-discos-progresso.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
      <div className="bg-paper max-w-md w-full rounded-sm p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl uppercase">Compartilhar progresso</h2>
          <button onClick={onClose} aria-label="Fechar" className="text-ink/40 hover:text-ink text-xl leading-none">
            ✕
          </button>
        </div>

        {/* card que vira imagem — tamanho fixo em px, igual em qualquer tela */}
        <div className="mx-auto overflow-x-auto">
          <div
            ref={cardRef}
            className="bg-ink text-paper rounded-sm relative overflow-hidden shrink-0"
            style={{ width: CARD_W, height: CARD_H, padding: 28 }}
          >
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border-4 border-mustard/20" />

            <p className="font-mono text-mustard text-[10px] tracking-[0.25em] uppercase mb-1">1001 discos</p>
            <p className="font-display text-sm uppercase text-paper/70 mb-1">
              Para se ouvir antes de morrer
            </p>
            <p className="font-mono text-[8px] text-paper/25 uppercase tracking-wide mb-6">
              baseado em "1001 Albums You Must Hear Before You Die"
            </p>

            <p className="font-display text-7xl leading-none">{listened}</p>
            <p className="font-mono text-paper/50 text-sm mb-6">de {total} discos ouvidos</p>

            <div className="h-2 bg-paper/15 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-mustard" style={{ width: `${pct}%` }} />
            </div>
            <p className="font-mono text-xs text-paper/60 mb-8">{pct}% da lista completa</p>

            <div className="flex gap-6 relative z-10">
              {topDecade && (
                <div>
                  <p className="font-display text-2xl">{topDecade.heard}</p>
                  <p className="font-mono text-[10px] text-paper/50 uppercase">discos dos {topDecade.decade}</p>
                </div>
              )}
              <div>
                <p className="font-display text-2xl">{favoriteCount}</p>
                <p className="font-mono text-[10px] text-paper/50 uppercase">favoritos</p>
              </div>
            </div>

            {/* leque de capas dos discos já ouvidos */}
            {randomCovers.length > 0 && (
              <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: 150 }}>
                {randomCovers.map((album, i) => {
                  const slot = COVER_SLOTS[i]
                  return (
                    <img
                      key={album.id}
                      src={album.coverUrl}
                      alt=""
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                      className="absolute rounded-sm object-cover"
                      style={{
                        left: slot.left,
                        bottom: slot.bottom,
                        width: slot.size,
                        height: slot.size,
                        transform: `rotate(${slot.rotate}deg)`,
                        zIndex: slot.z,
                      }}
                    />
                  )
                })}
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, #1B1710 0%, rgba(27,23,16,0) 55%)' }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {randomCovers.length > 0 && (
            <button
              onClick={() => setShuffleSeed((s) => s + 1)}
              title="Trocar as capas mostradas"
              className="font-mono text-xs uppercase px-4 py-2.5 rounded-sm border border-ink/20 text-ink/60 hover:border-ink hover:text-ink transition-colors shrink-0"
            >
              🔀
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 font-display uppercase tracking-wide bg-burgundy text-paper py-2.5 rounded-sm hover:bg-burgundy-dark transition-colors disabled:opacity-50"
          >
            {downloading ? 'Gerando imagem...' : 'Baixar imagem'}
          </button>
        </div>
      </div>
    </div>
  )
}
