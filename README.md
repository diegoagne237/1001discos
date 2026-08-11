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

## Onde entram os dados reais
`src/data/albums.js` tem 9 discos de exemplo (um por década, 1950s–2010s) só pra validar a estrutura visual.
Cada disco segue este formato:

```js
{
  id: 'slug-unico',
  artist: 'Nome do Artista',
  title: 'Nome do Álbum',
  year: 1971,
  decade: '1970s',       // precisa bater com o agrupamento
  genre: 'Soul',
  country: 'EUA',
  coverUrl: '',           // opcional — se vazio, mostra placeholder tipográfico
  spotifyUrl: 'https://open.spotify.com/album/...',
  blurb: 'Uma frase curta sobre o disco.',
}
```

Quando formos incluir os 1001 de verdade, dá pra substituir esse array inteiro (ex. importar de um JSON
gerado a partir da lista da Wikipedia + busca de álbum na API do Spotify pros links).

## Estrutura
- `src/components/DashboardStats.jsx` — resumo de progresso na home (total + barra por década)
- `src/components/Randomizer.jsx` — sorteador com filtro de década/gênero/não-ouvidos
- `src/components/DecadeSection.jsx` + `AlbumCard.jsx` — listagem agrupada por década
- `src/hooks/useListened.js` — estado de "ouvido" (trocar por Supabase quando for produção)

## Deploy
Padrão Vercel: conectar o repo, build command `npm run build`, output `dist`.
