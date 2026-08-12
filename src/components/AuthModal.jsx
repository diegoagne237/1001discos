import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AuthModal({ onClose, reason }) {
  const [mode, setMode] = useState('signup') // signup primeiro faz mais sentido quando é contextual
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(traduzErro(error.message))
      return
    }

    if (mode === 'signup') {
      setConfirmSent(true)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-burgundy mb-1">1001 discos</p>
          {reason && (
            <p className="font-body text-sm text-ink/70 mt-2 bg-paperDark inline-block px-3 py-1.5 rounded-sm">
              {reason}
            </p>
          )}
        </div>

        <div className="bg-paper border border-ink/10 rounded-sm p-6 relative">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 text-ink/40 hover:text-ink text-lg leading-none"
          >
            ✕
          </button>

          {confirmSent ? (
            <div className="text-center py-4">
              <p className="font-display text-lg uppercase mb-2">Quase lá</p>
              <p className="font-body text-sm text-ink/70">
                Enviamos um link de confirmação pro seu e-mail. Confirma por lá pra poder entrar.
              </p>
              <button
                onClick={() => {
                  setConfirmSent(false)
                  setMode('signin')
                }}
                className="font-mono text-xs uppercase mt-4 text-petrol underline underline-offset-2"
              >
                Voltar pro login
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-1 mb-6 font-mono text-xs uppercase">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 rounded-sm transition-colors ${
                    mode === 'signup' ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 rounded-sm transition-colors ${
                    mode === 'signin' ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  Entrar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-paperDark border border-ink/20 rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:border-burgundy"
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-paperDark border border-ink/20 rounded-sm px-3 py-2 font-body text-sm focus:outline-none focus:border-burgundy"
                />

                {error && <p className="font-body text-xs text-burgundy">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="font-display uppercase tracking-wide bg-burgundy text-paper py-2.5 rounded-sm hover:bg-burgundy-dark transition-colors disabled:opacity-50 mt-1"
                >
                  {loading ? 'Só um instante...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function traduzErro(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (msg.includes('User already registered')) return 'Já existe conta com esse e-mail — tenta entrar.'
  if (msg.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}
