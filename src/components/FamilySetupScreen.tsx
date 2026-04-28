import { useState } from 'react'
import { ArrowRight, HousePlus, Users } from 'lucide-react'

import { MAX_USERS } from '../constants'
import { useAuth } from '../context/AuthContext'
import type { TrackingMode } from '../types'

export const FamilySetupScreen = () => {
  const [mode, setMode] = useState<'individual' | 'group' | 'join'>('individual')
  const [spaceName, setSpaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { createSpace, joinGroupSpace } = useAuth()

  const submit = async () => {
    setLoading(true)
    setMessage('')
    try {
      const result =
        mode === 'join'
          ? await joinGroupSpace(inviteCode.trim())
          : await createSpace(spaceName.trim(), mode as TrackingMode)

      if (!result.success) {
        setMessage(result.message ?? 'Something went wrong.')
        return
      }

      setMessage('')
      setSpaceName('')
      setInviteCode('')
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
            Tracking spaces
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
              Start with personal or group tracking.
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Create a personal tracker for yourself, a shared group tracker for the family, or
              join an existing group with an invite code.
            </p>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-[#f7f5f3] p-6 shadow-[0_24px_70px_rgba(90,82,74,0.12)]">
            <div className="mb-6 grid grid-cols-3 gap-2 rounded-[24px] bg-zinc-100 p-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('individual')
                  setMessage('')
                }}
                className={ounded-[20px] px-3 py-2 text-sm font-medium transition }
              >
                Personal
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('group')
                  setMessage('')
                }}
                className={ounded-[20px] px-3 py-2 text-sm font-medium transition }
              >
                Group
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('join')
                  setMessage('')
                }}
                className={ounded-[20px] px-3 py-2 text-sm font-medium transition }
              >
                Join
              </button>
            </div>

            <div className="space-y-4">
              {mode === 'join' ? (
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <Users className="size-4 text-zinc-400" />
                  <input
                    disabled={loading}
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="Enter group invite code"
                    className="w-full bg-transparent text-sm uppercase tracking-[0.18em] text-zinc-900 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400"
                  />
                </label>
              ) : (
                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <HousePlus className="size-4 text-zinc-400" />
                  <input
                    disabled={loading}
                    value={spaceName}
                    onChange={(event) => setSpaceName(event.target.value)}
                    placeholder={
                      mode === 'individual'
                        ? 'Name your personal tracker'
                        : 'Name your family or group tracker'
                    }
                    className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  />
                </label>
              )}

              {message ? (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{message}</div>
              ) : null}

              <button
                type="button"
                disabled={loading}
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111214] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
              >
                {loading ? 'Processing...' : mode === 'join'
                  ? 'Join group tracker'
                  : mode === 'group'
                    ? 'Create group tracker'
                    : 'Create personal tracker'}
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/70 bg-white p-5 text-sm text-zinc-500 shadow-[0_12px_36px_rgba(15,23,42,0.05)]">
          Group trackers support up to {MAX_USERS} members. You can create multiple personal and
          group trackers under the same account.
        </div>
      </div>
    </div>
  )
}
