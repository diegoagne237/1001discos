// Diferente de /api/spotify-token (que exige o SYNC_SECRET e é só pra sincronização em massa),
// esta rota é de uso normal dentro do app: qualquer pessoa autenticada no Supabase pode chamar,
// usada pela busca de bandas na área escondida. Valida a sessão antes de emprestar o token.
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || ''
  const userToken = authHeader.replace('Bearer ', '')

  if (!userToken) {
    res.status(401).json({ error: 'Sessão ausente.' })
    return
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Faltam variáveis do Supabase no servidor.' })
    return
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: userData, error: userError } = await supabase.auth.getUser(userToken)

  if (userError || !userData?.user) {
    res.status(401).json({ error: 'Sessão inválida — faça login de novo.' })
    return
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    res.status(500).json({ error: 'Faltam SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET nas variáveis da Vercel.' })
    return
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    const detail = await tokenRes.text()
    res.status(502).json({ error: 'Falha ao autenticar na Spotify.', detail })
    return
  }

  const data = await tokenRes.json()
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in })
}
