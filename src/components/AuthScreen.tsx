import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'

import { MAX_USERS } from '../constants'
import { useAuth } from '../context/AuthContext'

export const AuthScreen = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup, allUsers } = useAuth()

  const submit = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result =
        mode === 'login'
          ? await login(email.trim(), password)
          : await signup(name.trim(), email.trim(), password)

      if (!result.success) {
        setMessage(result.message ?? 'Something went wrong.')
      }
    } catch (err) {
      setMessage('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eceae8_0%,#e5e2df_100%)] px-5 py-8 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between">
        <div className="space-y-6">
          <div className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
            Family Expense Tracker
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
              Shared money, beautifully clear.
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Create a family workspace for four members with persistent login, month-by-month
              history, and clean budgeting dashboards.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-[#f7f5f3] p-6 shadow-[0_24px_70px_rgba(90,82,74,0.12)]">
            <div className="mb-6 flex rounded-full bg-zinc-100 p-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('signup')
                  setMessage('')
                }}
                className={lex-1 rounded-full px-4 py-2 text-sm font-medium transition }
              >
                Sign up
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('login')
                  setMessage('')
                }}
                className={lex-1 rounded-full px-4 py-2 text-sm font-medium transition }
              >
                Login
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'signup' ? (
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <UserRound className="size-4 text-zinc-400" />
                  <input
                    disabled={loading}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </label>
              ) : null}

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <Mail className="size-4 text-zinc-400" />
                <input
                  type="email"
                  disabled={loading}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <LockKeyhole className="size-4 text-zinc-400" />
                <input
                  type="password"
                  disabled={loading}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </label>

              {message ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{message}</div>
              ) : null}

              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111214] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
              >
                {loading ? 'Processing...' : mode === 'signup' ? 'Create family access' : 'Continue'}
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/70 bg-white p-5 text-sm text-zinc-500 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between">
            <span>Active members</span>
            <span className="font-semibold text-zinc-950">
              {allUsers.length}/{MAX_USERS}
            </span>
          </div>
          <p className="mt-2 leading-6">
            Signup stays intentionally simple and the session remains on this device until logout.
          </p>
        </div>
      </div>
    </div>
  )
}
