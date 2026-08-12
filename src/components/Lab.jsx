import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useOtherAllowedUsers } from '../hooks/useAccessControl'
import { useBandSuggestions } from '../hooks/useBandSuggestions'
import BandSuggestForm from './lab/BandSuggestForm'
import BandSuggestionCard from './lab/BandSuggestionCard'

export default function Lab() {
  const { user } = useAuth()
  const { others, loading: othersLoading } = useOtherAllowedUsers(user?.id)
  const { sent, received, loading, addSuggestion, saveEvaluation, release, remove } = useBandSuggestions(user?.id)
  const [tab, setTab] = useState('received')

  const nameById = useMemo(() => {
    const map = {}
    for (const o of others) map[o.user_id] = o.display_name || 'alguém'
    return map
  }, [others])

  const pendingReceivedCount = received.filter((s) => s.status === 'pending').length

  if (othersLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-ink/50 uppercase tracking-wide">Carregando...</p>
      </div>
    )
  }

  if (others.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <p className="font-body text-sm text-ink/60 max-w-sm">
          Ainda não tem mais ninguém liberado nessa área além de você. Libera outra pessoa em
          allowed_users no Supabase pra poder trocar sugestões de banda.
        </p>
      </div>
    )
  }

  const tabs = [
    { key: 'received', label: `Recebidas${pendingReceivedCount ? ` (${pendingReceivedCount})` : ''}` },
    { key: 'sent', label: 'Enviadas' },
    { key: 'suggest', label: 'Sugerir' },
  ]

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy mb-1">1001 discos</p>
        <h1 className="font-display text-2xl uppercase mb-1">Bandas pra conhecer</h1>
        <p className="font-body text-sm text-ink/60 mb-6">
          Sugestões de bandas trocadas entre vocês, com playlist direto no Spotify.
        </p>

        <div className="flex gap-1 mb-6 font-mono text-xs uppercase">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 rounded-sm transition-colors ${
                tab === t.key ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink bg-paperDark'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'suggest' && <BandSuggestForm others={others} onAdd={addSuggestion} />}

        {tab === 'received' && (
          <div className="flex flex-col gap-3">
            {received.length === 0 ? (
              <p className="font-mono text-xs text-ink/40 text-center py-8">
                Ninguém te sugeriu nenhuma banda ainda.
              </p>
            ) : (
              received.map((s) => (
                <BandSuggestionCard
                  key={s.id}
                  suggestion={s}
                  role="received"
                  otherName={nameById[s.from_user_id] || 'alguém'}
                  onSaveEvaluation={saveEvaluation}
                  onRelease={release}
                />
              ))
            )}
          </div>
        )}

        {tab === 'sent' && (
          <div className="flex flex-col gap-3">
            {sent.length === 0 ? (
              <p className="font-mono text-xs text-ink/40 text-center py-8">
                Você ainda não sugeriu nenhuma banda.
              </p>
            ) : (
              sent.map((s) => (
                <BandSuggestionCard
                  key={s.id}
                  suggestion={s}
                  role="sent"
                  otherName={nameById[s.to_user_id] || 'alguém'}
                  onRemove={remove}
                />
              ))
            )}
          </div>
        )}

        <a
          href="/"
          className="inline-block mt-8 font-mono text-xs uppercase text-petrol underline underline-offset-2"
        >
          ← Voltar pro app
        </a>
      </div>
    </div>
  )
}
