import { useEffect, useState } from 'react'

const SEEN_KEY = '1001-discos:onboarding-seen'

const STEPS = [
  { icon: '✓', text: 'Marca os discos que já ouviu e acompanha seu progresso por década.' },
  { icon: '★', text: 'Avalia de 1 a 5 estrelas, favorita e deixa um comentário rápido sobre cada um.' },
  { icon: '⚄', text: 'Sem ideia do que ouvir? Usa o sorteador com filtro de década, gênero ou só não ouvidos.' },
  { icon: '♪', text: 'Cada disco tem link direto pro Spotify assim que a gente resolve o link certo.' },
]

export function hasSeenOnboarding() {
  return typeof window !== 'undefined' && localStorage.getItem(SEEN_KEY) === '1'
}

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && dismiss()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1')
    onClose()
  }

  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4">
      <div className="bg-paper max-w-sm w-full rounded-sm p-6">
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy mb-1">1001 discos</p>
        <h2 className="font-display text-xl uppercase mb-5">Como funciona</h2>

        <div className="flex items-start gap-3 mb-8 min-h-[64px]">
          <span className="font-display text-2xl text-mustard shrink-0">{STEPS[step].icon}</span>
          <p className="font-body text-sm text-ink/80 leading-relaxed">{STEPS[step].text}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === step ? 'bg-burgundy' : 'bg-ink/15'}`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={dismiss}
              className="font-mono text-[11px] uppercase text-ink/40 hover:text-ink/70"
            >
              Pular
            </button>
            <button
              onClick={() => (isLast ? dismiss() : setStep((s) => s + 1))}
              className="font-display uppercase tracking-wide bg-burgundy text-paper px-4 py-2 rounded-sm hover:bg-burgundy-dark transition-colors text-sm"
            >
              {isLast ? 'Entendi' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
