import { useRef, useState } from 'react'
import { albums } from '../data/albums'
import { supabase } from '../lib/supabaseClient'

async function searchItunesAlbum(artist, title) {
  const term = encodeURIComponent(`${artist} ${title}`)
  const res = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=1`)
  if (!res.ok) throw new Error(`iTunes respondeu ${res.status}`)
  const data = await res.json()
  return data.results?.[0] || null
}

function highResArtwork(url) {
  if (!url) return null
  return url.replace(/\d+x\d+bb\.jpg$/, '600x600bb.jpg')
}

export default function SyncCovers() {
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState({ done: 0, total: 0, resolved: 0, notFound: 0 })
  const stopRef = useRef(false)

  const appendLog = (line) => setLog((prev) => [...prev.slice(-300), line])

  async function upsertMetadata(row) {
    const { error } = await supabase.from('album_metadata').upsert(row)
    if (error) appendLog(`  erro ao salvar no Supabase: ${error.message}`)
  }

  async function run() {
    setRunning(true)
    stopRef.current = false
    setLog([])

    try {
      const { data: existing, error } = await supabase.from('album_metadata').select('album_id, cover_url')
      if (error) throw error

      const resolvedIds = new Set((existing || []).filter((r) => r.cover_url).map((r) => r.album_id))
      const pending = albums.filter((a) => {
        if (resolvedIds.has(a.id)) return false
        return !a.coverUrl // já tem capa (ex. resolvida via Spotify antes) → pula
      })

      setProgress({ done: 0, total: pending.length, resolved: 0, notFound: 0 })
      appendLog(`${pending.length} discos sem capa ainda (de ${albums.length} no total).`)

      if (pending.length === 0) {
        appendLog('Nada a fazer — todas as capas já estão resolvidas!')
        setRunning(false)
        return
      }

      let resolvedCount = 0
      let notFoundCount = 0

      for (let i = 0; i < pending.length; i++) {
        if (stopRef.current) {
          appendLog('Parado. Pode fechar essa página e voltar depois — continua de onde parou.')
          break
        }

        const album = pending[i]
        appendLog(`[${i + 1}/${pending.length}] ${album.artist} - ${album.title}...`)

        try {
          const match = await searchItunesAlbum(album.artist, album.title)
          const coverUrl = highResArtwork(match?.artworkUrl100)

          if (!coverUrl) {
            notFoundCount++
            appendLog('  não encontrado')
          } else {
            resolvedCount++
            await upsertMetadata({
              album_id: album.id,
              cover_url: coverUrl,
              genre: match.primaryGenreName || null,
            })
          }
        } catch (err) {
          appendLog(`  erro: ${err.message}`)
        }

        setProgress({ done: i + 1, total: pending.length, resolved: resolvedCount, notFound: notFoundCount })
        await new Promise((r) => setTimeout(r, 700)) // ~85 chamadas/min, bem abaixo do limite da iTunes
      }

      if (!stopRef.current) appendLog('Concluído!')
    } catch (err) {
      appendLog(`Erro geral: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="min-h-screen bg-paper px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy mb-1">1001 discos</p>
        <h1 className="font-display text-2xl uppercase mb-3">Sincronizar capas (iTunes)</h1>
        <p className="font-body text-sm text-ink/60 mb-6">
          Usa a API pública da Apple pra buscar as capas — não precisa de login nem chave, e não
          tem o bloqueio que a gente vem enfrentando com a Spotify. Não traz link de música, só
          capa e gênero (o link do Spotify continua sendo o de busca por enquanto).
        </p>

        {!running ? (
          <button
            onClick={run}
            className="font-display uppercase tracking-wide bg-burgundy text-paper px-5 py-2 rounded-sm hover:bg-burgundy-dark transition-colors mb-4"
          >
            Rodar
          </button>
        ) : (
          <button
            onClick={() => {
              stopRef.current = true
            }}
            className="font-display uppercase tracking-wide bg-ink text-paper px-5 py-2 rounded-sm mb-4"
          >
            Parar
          </button>
        )}

        {progress.total > 0 && (
          <div className="mb-4">
            <div className="h-2 bg-paperDark rounded-full overflow-hidden mb-1">
              <div className="h-full bg-mustard transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <p className="font-mono text-xs text-ink/60">
              {progress.done}/{progress.total} nesta sessão · resolvidos: {progress.resolved} · não
              encontrados: {progress.notFound}
            </p>
          </div>
        )}

        <div className="bg-ink text-paper/80 font-mono text-[11px] p-4 rounded-sm h-96 overflow-y-auto whitespace-pre-wrap">
          {log.length === 0 ? 'Aguardando...' : log.join('\n')}
        </div>

        <a href="/" className="inline-block mt-6 font-mono text-xs uppercase text-petrol underline underline-offset-2">
          ← Voltar pro app
        </a>
      </div>
    </div>
  )
}
