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
