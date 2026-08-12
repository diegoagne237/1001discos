import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'

const DECADES_ORDER = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s']

export default function ShareProgress({ albums, listenedIds, favorites, onClose }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

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

        {/* card que vira imagem */}
        <div
          ref={cardRef}
          className="bg-ink text-paper rounded-sm p-8 relative overflow-hidden"
          style={{ aspectRatio: '4 / 5' }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border-4 border-mustard/20" />
          <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full border-4 border-burgundy/20" />

          <p className="font-mono text-mustard text-[10px] tracking-[0.25em] uppercase mb-1">1001 discos</p>
          <p className="font-display text-sm uppercase text-paper/70 mb-8">
            Para se ouvir antes de morrer
          </p>

          <p className="font-display text-7xl leading-none">{listened}</p>
          <p className="font-mono text-paper/50 text-sm mb-6">de {total} discos ouvidos</p>

          <div className="h-2 bg-paper/15 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-mustard" style={{ width: `${pct}%` }} />
          </div>
          <p className="font-mono text-xs text-paper/60 mb-8">{pct}% da lista completa</p>

          <div className="flex gap-6">
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

          <p className="absolute bottom-6 left-8 right-8 font-mono text-[9px] text-paper/30 uppercase tracking-wide">
            baseado em "1001 Albums You Must Hear Before You Die"
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full mt-4 font-display uppercase tracking-wide bg-burgundy text-paper py-2.5 rounded-sm hover:bg-burgundy-dark transition-colors disabled:opacity-50"
        >
          {downloading ? 'Gerando imagem...' : 'Baixar imagem'}
        </button>
      </div>
    </div>
  )
}
