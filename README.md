# 1001 Discos

Webapp pra listar, marcar e sortear discos da lista "1001 Albums You Must Hear Before You Die", com
login por usuário (Supabase).

## Stack
React + Vite + Tailwind + Supabase (auth + dados). Deploy na Vercel.

## Rodar localmente
```
npm install
npm run dev
```

## Dados
`src/data/albums.js` tem os 1001 discos da edição 2008 do livro (título, artista, ano e década corretos,
curados a partir de github.com/arcctgx/1001-albums). Schema de cada disco:

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
`genre`, `country`, `coverUrl` e o link exato do `spotifyUrl` ficam vazios até rodar a sincronização com
o Spotify (veja abaixo).

## Autenticação (Supabase) — login e senha por usuário
Cada pessoa tem sua própria lista de discos ouvidos, salva no Supabase.

1. **Criar o projeto no Supabase** (supabase.com, gratuito).
2. **Criar a tabela.** Dashboard do projeto > SQL Editor > New query > cola o conteúdo de
   `supabase/schema.sql` > Run.
3. **Pegar as chaves.** Dashboard > Settings > API: `Project URL` e a chave `anon public`
   (ou o novo formato `sb_publishable_...` — funciona igual, é segura pra expor no front-end).
4. **Configurar na Vercel** (sem terminal): projeto na Vercel > Settings > Environments > Production >
   adiciona `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Por padrão o Supabase exige confirmação por e-mail no cadastro. Pra desligar:
   Authentication > Sign In / Providers > Email > desliga "Confirm email".

## Integração com Spotify — via GitHub Actions (sem terminal)
O script que busca capa, link exato do álbum e gênero de cada disco roda dentro do próprio GitHub,
com um clique, sem precisar de Node instalado no seu computador.

1. **Criar o app no Spotify**: developer.spotify.com/dashboard > Create app. Em "Which API/SDKs" marca
   só **Web API**. Depois entra em Settings do app e pega `Client ID` e `Client Secret`.
2. **Guardar as credenciais no GitHub** (não é a mesma coisa da Vercel): no repositório, Settings >
   Secrets and variables > Actions > New repository secret. Cria `SPOTIFY_CLIENT_ID` e
   `SPOTIFY_CLIENT_SECRET`.
3. **Rodar**: aba Actions do repositório > workflow "Sincronizar dados do Spotify" > botão
   **Run workflow**. Pra testar antes dos 1001, preenche o campo "limit" com `20`.
4. No final ele mesmo commita o `src/data/albums.js` atualizado — a Vercel redeploya sozinha.
5. Se parar no meio (rate limit), roda o workflow de novo — ele só processa o que ainda falta.

Leva uns 10-15 minutos pra processar os 1001 discos.

## Como subir mudanças de código (sem terminal)
No repositório do GitHub: "Add file > Upload files" pra substituir os arquivos, ou apaga e sobe os
novos. A Vercel redeploya sozinha assim que detecta o commit.

## Estrutura
- `src/components/DashboardStats.jsx` — resumo de progresso na home
- `src/components/Randomizer.jsx` — sorteador com filtros
- `src/components/DecadeSection.jsx` + `AlbumCard.jsx` — listagem por década
- `src/components/Auth.jsx` + `src/hooks/useAuth.js` — login/cadastro
- `src/hooks/useListened.js` — estado de "ouvido" por usuário, via Supabase
- `scripts/sync-spotify.mjs` + `.github/workflows/spotify-sync.yml` — sincronização com o Spotify

## Deploy
Vercel: framework Vite, build command `npm run build`, output `dist`.
