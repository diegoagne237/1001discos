import { useRef, useState } from 'react'
import { albums } from '../data/albums'
import { supabase } from '../lib/supabaseClient'

const SECRET_STORAGE_KEY = '1001-discos:sync-secret'

export default function SyncSpotify() {
  const [secret, setSecret] = useState(() => localStorage.getItem(SECRET_STORAGE_KEY) || '')
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState([])
  const [progress, setProgress] = useState({ done: 0, total: 0, resolved: 0, notFound: 0 })
  const stopRef = useRef(false)

  const appendLog = (line) => setLog((prev) => [...prev.slice(-300), line])

  async function getToken() {
    const res = await fetch(`/api/spotify-token?secret=${encodeURIComponent(secret)}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Falha ao autenticar (${res.status})`)
    }
    const data = await res.json()
    return { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 - 30_000 }
  }

  async function fetchWithRetry(url, token) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10)
        appendLog(`  rate limit, esperando ${retryAfter}s...`)
        await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000))
        continue
      }
      if (!res.ok) throw new Error(`Spotify respondeu ${res.status}`)
      return res.json()
    }
    throw new Error('excesso de tentativas seguidas')
  }

  async function upsertMetadata(row) {
    const { error } = await supabase.from('album_metadata').upsert(row)
    if (error) appendLog(`  erro ao salvar no Supabase: ${error.message}`)
  }

  async function run() {
    if (!secret) {
      appendLog('Cola o código de sincronização antes de rodar.')
      return
    }
    localStorage.setItem(SECRET_STORAGE_KEY, secret)

    setRunning(true)
    stopRef.current = false
    setLog([])

    try {
      const { data: existing, error } = await supabase.from('album_metadata').select('album_id, cover_url')
      if (error) throw error

      const resolvedIds = new Set((existing || []).filter((r) => r.cover_url).map((r) => r.album_id))
      const pending = albums.filter((a) => !resolvedIds.has(a.id))

      setProgress({ done: 0, total: pending.length, resolved: 0, notFound: 0 })
      appendLog(`${pending.length} discos ainda por resolver (de ${albums.length} no total).`)

      if (pending.length === 0) {
        appendLog('Nada a fazer — tudo já resolvido!')
        setRunning(false)
        return
      }

      let tokenInfo = await getToken()
      let resolvedCount = 0
      let notFoundCount = 0
      const artistGenreCache = {}

      for (let i = 0; i < pending.length; i++) {
        if (stopRef.current) {
          appendLog('Parado. Pode fechar essa página e voltar depois — continua de onde parou.')
          break
        }
        if (Date.now() > tokenInfo.expiresAt) {
          tokenInfo = await getToken()
        }

        const album = pending[i]
        appendLog(`[${i + 1}/${pending.length}] ${album.artist} - ${album.title}...`)

        try {
          const q = `album:${album.title} artist:${album.artist}`
          const searchData = await fetchWithRetry(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=1`,
            tokenInfo.token
          )
          const item = searchData?.albums?.items?.[0]

          if (!item) {
            notFoundCount++
            await upsertMetadata({ album_id: album.id, spotify_url: null, cover_url: null, genre: null })
          } else {
            const artistId = item.artists?.[0]?.id
            let genre = artistId ? artistGenreCache[artistId] : ''
            if (genre === undefined && artistId) {
              const artistData = await fetchWithRetry(
                `https://api.spotify.com/v1/artists/${artistId}`,
                tokenInfo.token
              )
              genre = artistData?.genres?.[0] || ''
              artistGenreCache[artistId] = genre
            }
            resolvedCount++
            await upsertMetadata({
              album_id: album.id,
              spotify_url: item.external_urls?.spotify || null,
              cover_url: item.images?.[0]?.url || null,
              genre: genre || null,
            })
          }
        } catch (err) {
          appendLog(`  erro: ${err.message}`)
        }

        setProgress({ done: i + 1, total: pending.length, resolved: resolvedCount, notFound: notFoundCount })
        await new Promise((r) => setTimeout(r, 150))
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
        <h1 className="font-display text-2xl uppercase mb-3">Sincronizar com o Spotify</h1>
        <p className="font-body text-sm text-ink/60 mb-6">
          Roda direto neste navegador (evita o bloqueio que às vezes acontece quando as chamadas saem de
          servidores/CI). Precisa ficar com esta aba aberta enquanto processa. Dá pra fechar e voltar
          depois — continua de onde parou.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="password"
            placeholder="Código de sincronização"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="flex-1 bg-paperDark border border-ink/20 rounded-sm px-3 py-2 font-mono text-sm focus:outline-none focus:border-burgundy"
          />
          {!running ? (
            <button
              onClick={run}
              className="font-display uppercase tracking-wide bg-burgundy text-paper px-5 py-2 rounded-sm hover:bg-burgundy-dark transition-colors"
            >
              Rodar
            </button>
          ) : (
            <button
              onClick={() => {
                stopRef.current = true
              }}
              className="font-display uppercase tracking-wide bg-ink text-paper px-5 py-2 rounded-sm"
            >
              Parar
            </button>
          )}
        </div>

        {progress.total > 0 && (
          <div className="mb-4">
            <div className="h-2 bg-paperDark rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-mustard transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
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
