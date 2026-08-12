# 1001 Discos

Webapp pra listar, marcar e sortear discos da lista "1001 Albums You Must Hear Before You Die".

## Stack
React + Vite + Tailwind. Estado de "ouvido" hoje fica em `localStorage` (arquivo `src/hooks/useListened.js`) —
quando quiser persistir por usuário/dispositivo, trocar esse hook por chamadas ao Supabase mantendo a mesma
assinatura (`toggle`, `isListened`, `listenedIds`).

## Rodar localmente
```
npm install
npm run dev
```

## Dados
`src/data/albums.js` tem os 1001 discos da edição 2008 do livro (título, artista, ano e década corretos,
curados a partir de github.com/arcctgx/1001-albums — fonte com boa qualidade de dados e formato máquina-legível).

Campos **de propósito vazios**, pra preencher aos poucos ou automatizar depois:
- `genre` e `country` — não incluídos porque não há fonte confiável pros 1001 de uma vez
- `blurb` — frase curta sobre o disco
- `coverUrl` — se vazio, o card mostra um placeholder tipográfico
- `spotifyUrl` — hoje é um link de **busca** (`open.spotify.com/search/artista+título`), não o link exato
  do álbum. Funciona (leva direto ao resultado certo), mas não é o ID real do álbum.

Schema de cada disco:
```js
{
  id: 'slug-unico',
  artist: 'Nome do Artista',
  title: 'Nome do Álbum',
  year: 1971,
  decade: '1970s',
  genre: '',
  country: '',
  coverUrl: '',
  spotifyUrl: 'https://open.spotify.com/search/...',
  blurb: '',
}
```

## Autenticação (Supabase) — login e senha por usuário
Cada pessoa tem sua própria lista de discos ouvidos, salva no Supabase (não mais no navegador).

**1. Criar o projeto no Supabase** (supabase.com, gratuito) — pode ser um projeto novo só pra este app,
ou reaproveitar um que você já tenha.

**2. Criar a tabela.** No dashboard do projeto: SQL Editor > New query > cola o conteúdo de
`supabase/schema.sql` deste repo > Run. Isso cria a tabela `listened_albums` com segurança por linha
(cada usuário só vê e altera os próprios registros).

**3. Pegar as chaves.** Dashboard > Settings > API. Vai precisar de:
- `Project URL`
- `anon public` key (essa é segura pra expor no front-end — é feita pra isso, a proteção real vem do
  RLS que o schema.sql já configurou)

**4. Configurar na Vercel** (sem precisar de terminal nem `.env`): projeto na Vercel > Settings >
Environment Variables > adiciona:
- `VITE_SUPABASE_URL` = a Project URL
- `VITE_SUPABASE_ANON_KEY` = a anon public key

Depois de salvar, vai em Deployments > Redeploy pra aplicar.

**5. Pronto.** A ferramenta agora pede login/cadastro antes de mostrar a lista. Por padrão o Supabase
exige confirmação por e-mail no cadastro (dá pra desligar em Authentication > Providers > Email >
"Confirm email" se quiser testar mais rápido).

## Como subir as mudanças (sem terminal)
Este projeto é atualizado por upload manual no GitHub:
1. No repo, entra nas pastas que mudaram e usa "Add file > Upload files" pra substituir os arquivos
2. Ou apaga os arquivos antigos e sobe os novos da pasta que te entreguei aqui
3. A Vercel redeploya sozinha assim que detecta o commit
Script em `scripts/sync-spotify.mjs` que resolve, pra cada disco, o link exato do álbum, a capa e o
gênero principal do artista — via Spotify Web API (Client Credentials Flow, não precisa o usuário logar).

**Passo a passo:**
1. Cria um app grátis em https://developer.spotify.com/dashboard (1 minuto, não precisa aprovação)
2. Copia `.env.example` pra `.env` e cola o `Client ID` e `Client Secret` do app
3. Roda `npm run spotify:sync`

O script:
- processa só os discos que ainda não têm capa/link resolvido (idempotente — rodar de novo não repete trabalho)
- salva progresso a cada disco em `scripts/.spotify-cache.json` (fica de fora do git), então se cair no
  meio (rate limit, queda de internet) é só rodar de novo que ele continua de onde parou
- respeita rate limit da Spotify automaticamente (espera e tenta de novo em vez de quebrar)
- no final, reescreve `src/data/albums.js` já com os campos preenchidos

Pra testar em um lote pequeno antes de rodar os 1001: `npm run spotify:sync -- --limit=20`
Pra tentar de novo os que não foram encontrados numa execução anterior: `npm run spotify:sync -- --retry-failed`

Os 1001 discos devem levar uns 10-15 minutos pra processar por completo (rate limit da Spotify + 1 request
extra por artista novo pra pegar o gênero).

## Estrutura
- `src/components/DashboardStats.jsx` — resumo de progresso na home (total + barra por década)
- `src/components/Randomizer.jsx` — sorteador com filtro de década/gênero/não-ouvidos
- `src/components/DecadeSection.jsx` + `AlbumCard.jsx` — listagem agrupada por década
- `src/hooks/useListened.js` — estado de "ouvido" (trocar por Supabase quando for produção)

## Deploy
Padrão Vercel: conectar o repo, build command `npm run build`, output `dist`.
