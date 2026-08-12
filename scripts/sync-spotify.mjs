#!/usr/bin/env node
/**
 * Sincroniza src/data/albums.js com a Spotify Web API (Client Credentials Flow).
 *
 * Para cada disco ainda não resolvido, busca no Spotify por artista + título e preenche:
 *   - spotifyUrl (link exato do álbum, substitui o link de busca)
 *   - coverUrl   (capa do álbum)
 *   - genre      (gênero principal do artista, quando disponível)
 *
 * É seguro rodar várias vezes: usa um cache em disco (scripts/.spotify-cache.json) e só
 * processa o que ainda não foi resolvido ou que falhou antes. Se cair no meio (rate limit,
 * queda de rede), roda de novo e ele continua de onde parou.
 *
 * Uso:
 *   1. Crie um app em https://developer.spotify.com/dashboard (gratuito, 1 minuto)
 *   2. Copie .env.example para .env e cole SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
 *   3. npm run spotify:sync
 *
 * Flags opcionais:
 *   --limit=50       processa só os N primeiros discos ainda não resolvidos (bom pra testar)
 *   --retry-failed    também tenta de novo os que falharam ("not_found") em execuções anteriores
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ALBUMS_PATH = path.join(ROOT, 'src/data/albums.js')
const CACHE_PATH = path.join(__dirname, '.spotify-cache.json')
const ENV_PATH = path.join(ROOT, '.env')

// --- .env sem depender de pacote externo ---
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return
  const content = fs.readFileSync(ENV_PATH, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}
loadEnv()

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Faltam credenciais. Defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET no .env (veja .env.example).')
  process.exit(1)
}

const args = process.argv.slice(2)
const limitArg = args.find((a) => a.startsWith('--limit='))
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity
const RETRY_FAILED = args.includes('--retry-failed')

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {}
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

async function getAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) {
    throw new Error(`Falha ao autenticar na Spotify API: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.access_token
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function spotifyFetch(url, token, attempt = 1) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10)
    console.log(`  rate limit, esperando ${retryAfter}s...`)
    await sleep((retryAfter + 1) * 1000)
    return spotifyFetch(url, token, attempt)
  }
  if (res.status === 401) {
    throw new Error('TOKEN_EXPIRED')
  }
  if (!res.ok) {
    if (attempt < 3) {
      await sleep(1000 * attempt)
      return spotifyFetch(url, token, attempt + 1)
    }
    throw new Error(`Spotify API ${res.status}`)
  }
  return res.json()
}

async function searchAlbum(artist, title, token) {
  const q = `album:${title} artist:${artist}`
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=album&limit=1`
  const data = await spotifyFetch(url, token)
  const item = data?.albums?.items?.[0]
  if (!item) return null
  return {
    spotifyUrl: item.external_urls?.spotify || null,
    coverUrl: item.images?.[0]?.url || null,
    spotifyAlbumId: item.id,
    artistId: item.artists?.[0]?.id || null,
  }
}

async function getArtistGenre(artistId, token, artistGenreCache) {
  if (!artistId) return ''
  if (artistGenreCache[artistId] !== undefined) return artistGenreCache[artistId]
  const data = await spotifyFetch(`https://api.spotify.com/v1/artists/${artistId}`, token)
  const genre = data?.genres?.[0] || ''
  artistGenreCache[artistId] = genre
  return genre
}

function serializeAlbums(albums) {
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const lines = []
  lines.push('// Lista completa: 1001 Albums You Must Hear Before You Die (edição 2008)')
  lines.push('// title/artist/year curados a partir de github.com/arcctgx/1001-albums.')
  lines.push('// spotifyUrl, coverUrl e genre resolvidos via scripts/sync-spotify.mjs (Spotify Web API).')
  lines.push('// Rode `npm run spotify:sync` de novo a qualquer momento para preencher o que faltar.')
  lines.push('')
  lines.push('export const albums = [')
  for (const a of albums) {
    lines.push('  {')
    lines.push(`    id: '${esc(a.id)}',`)
    lines.push(`    artist: '${esc(a.artist)}',`)
    lines.push(`    title: '${esc(a.title)}',`)
    lines.push(`    year: ${a.year},`)
    lines.push(`    decade: '${a.decade}',`)
    lines.push(`    genre: '${esc(a.genre || '')}',`)
    lines.push(`    country: '${esc(a.country || '')}',`)
    lines.push(`    coverUrl: '${esc(a.coverUrl || '')}',`)
    lines.push(`    spotifyUrl: '${esc(a.spotifyUrl || '')}',`)
    lines.push(`    blurb: '${esc(a.blurb || '')}',`)
    lines.push('  },')
  }
  lines.push(']')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const { albums } = await import(pathToFileURL(ALBUMS_PATH).href)
  const cache = loadCache()
  const artistGenreCache = cache.__artistGenres || {}

  let token = await getAccessToken()
  console.log(`Autenticado. ${albums.length} discos no total.`)

  let processed = 0
  let resolved = 0
  let notFound = 0

  for (const album of albums) {
    // já resolvido no próprio albums.js (persiste entre execuções via git, sem depender do cache local)
    const alreadyResolvedInFile = album.coverUrl && album.spotifyUrl && !album.spotifyUrl.includes('/search/')
    const cached = cache[album.id]
    const alreadyFailed = cached?.status === 'not_found'

    if (alreadyResolvedInFile) continue
    if (alreadyFailed && !RETRY_FAILED) continue
    if (processed >= LIMIT) break

    processed++
    process.stdout.write(`[${processed}] ${album.artist} - ${album.title}... `)

    try {
      const match = await searchAlbum(album.artist, album.title, token)
      if (!match) {
        console.log('não encontrado')
        cache[album.id] = { status: 'not_found' }
        notFound++
        continue
      }

      const genre = await getArtistGenre(match.artistId, token, artistGenreCache)

      album.spotifyUrl = match.spotifyUrl
      album.coverUrl = match.coverUrl
      if (genre) album.genre = genre

      cache[album.id] = {
        status: 'resolved',
        spotifyUrl: match.spotifyUrl,
        coverUrl: match.coverUrl,
        genre,
      }
      resolved++
      console.log('ok')
    } catch (err) {
      if (err.message === 'TOKEN_EXPIRED') {
        token = await getAccessToken()
        processed--
        continue
      }
      console.log(`erro: ${err.message}`)
      cache[album.id] = { status: 'error', message: err.message }
    }

    // salva progresso a cada disco — se cair no meio, não perde o que já foi feito
    cache.__artistGenres = artistGenreCache
    saveCache(cache)

    // respeito básico ao rate limit da Spotify
    await sleep(120)
  }

  // reaplica tudo que já estava resolvido em execuções anteriores (mesmo além do --limit)
  for (const album of albums) {
    const cached = cache[album.id]
    if (cached?.status === 'resolved') {
      album.spotifyUrl = cached.spotifyUrl
      album.coverUrl = cached.coverUrl
      if (cached.genre) album.genre = cached.genre
    }
  }

  fs.writeFileSync(ALBUMS_PATH, serializeAlbums(albums))

  const totalResolved = albums.filter((a) => a.coverUrl).length
  console.log('\n--- resumo desta execução ---')
  console.log(`processados agora: ${processed}`)
  console.log(`resolvidos agora: ${resolved}`)
  console.log(`não encontrados agora: ${notFound}`)
  console.log(`total já resolvido no dataset: ${totalResolved}/${albums.length}`)
  if (totalResolved < albums.length) {
    console.log('\nRode `npm run spotify:sync` de novo para continuar de onde parou.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
