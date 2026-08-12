// Função serverless da Vercel. Roda no servidor, nunca no navegador — é a única parte que
// precisa do Client Secret da Spotify, então ele nunca fica exposto no código do site.
// O navegador chama esta rota, recebe um token de acesso de curta duração, e usa ESSE token
// pra fazer as buscas de álbum diretamente (a Spotify permite chamadas via navegador/CORS),
// o que evita o bloqueio que às vezes acontece quando as chamadas saem de servidores/CI.
export default async function handler(req, res) {
  const { secret } = req.query

  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    res.status(401).json({ error: 'Código de sincronização inválido.' })
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
