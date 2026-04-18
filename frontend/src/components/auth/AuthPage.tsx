import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export function AuthPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (password !== confirmPassword) { setError('Heslá sa nezhodujú'); return }
      if (password.length < 6) { setError('Heslo musí mať aspoň 6 znakov'); return }
      if (!email.includes('@')) { setError('Zadajte platný email'); return }
    }
    if (!username.trim()) { setError('Zadajte používateľské meno'); return }
    if (!password) { setError('Zadajte heslo'); return }

    try {
      setLoading(true)
      if (mode === 'login') {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), email.trim(), password)
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (detail) {
        setError(detail)
      } else {
        setError(mode === 'login' ? 'Prihlásenie zlyhalo' : 'Registrácia zlyhala')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">UC</span>
          </div>
          <div>
            <span className="text-xl font-bold text-slate-800">UCMS</span>
            <p className="text-xs text-slate-400 leading-none mt-0.5">Use Case Modeling System</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">
            {mode === 'login' ? 'Prihlásenie' : 'Vytvorenie účtu'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Používateľské meno</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                className="field-input"
                placeholder="napr. jan.novak"
                autoFocus
                autoComplete="username"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  className="field-input"
                  placeholder="jan@example.com"
                  autoComplete="email"
                />
              </div>
            )}

            <div>
              <label className="field-label">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                className="field-input"
                placeholder={mode === 'register' ? 'Aspoň 6 znakov' : ''}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="field-label">Potvrdiť heslo</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  className="field-input"
                  placeholder=""
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading
                ? (mode === 'login' ? 'Prihlasujem...' : 'Registrujem...')
                : (mode === 'login' ? 'Prihlásiť sa' : 'Vytvoriť účet')}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-500">
                Nemáte účet?{' '}
                <button onClick={() => { setMode('register'); setError('') }} className="text-teal-600 hover:text-teal-700 font-medium">
                  Zaregistrujte sa
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Máte účet?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-teal-600 hover:text-teal-700 font-medium">
                  Prihláste sa
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
