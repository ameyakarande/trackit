import { useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, Download, Plus, Trash2, Users, X } from 'lucide-react'

import { TONE_STYLES } from '../constants'
import { useAuth } from '../context/AuthContext'
import { downloadCsvReport, downloadPdfReport } from '../lib/reports'
import { cn, formatMonthLabel } from '../lib/utils'
import type {
  Category,
  Contribution,
  Expense,
  ExportFilter,
  SessionUser,
  TrackingMode,
  TrackingSpace,
} from '../types'

const Overlay = ({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string
  subtitle: string
  children: ReactNode
  onClose: () => void
}) => (
  <div className="fixed inset-0 z-50 bg-black/18 px-4 py-6 backdrop-blur-sm">
    <div className="mx-auto max-w-md rounded-[30px] border border-white/80 bg-[#fcfbfa] p-6 shadow-[0_30px_80px_rgba(24,24,27,0.12)]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">{title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:text-zinc-900"
        >
          <X className="size-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
)

const Field = ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
      {label}
    </span>
    {children}
  </label>
)

const inputClass =
  'w-full rounded-2xl border border-[#ece7e2] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300'

export const ExpenseModal = ({
  expense,
  categories,
  users,
  defaultMonth,
  onClose,
  onSave,
  onDelete,
}: {
  expense?: Expense
  categories: Category[]
  users: SessionUser[]
  defaultMonth: string
  onClose: () => void
  onSave: (payload: {
    title: string
    amount: number
    categoryId: string
    paidBy: string
    date: string
  }) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}) => {
  const [title, setTitle] = useState(expense?.title ?? '')
  const [amount, setAmount] = useState(expense?.amount.toString() ?? '')
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? categories[0]?.id ?? '')
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? users[0]?.id ?? '')
  const [date, setDate] = useState(expense?.date ?? `${defaultMonth}-01`)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({
        title,
        amount: Number(amount),
        categoryId,
        paidBy,
        date,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay
      title={expense ? 'Edit Expense' : 'Add Expense'}
      subtitle="Every expense is assigned to the month of its selected date, including backdated entries."
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Title">
          <input disabled={loading} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <input disabled={loading} type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Date">
            <input disabled={loading} type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Category">
          <select disabled={loading} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={inputClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Paid by">
          <select disabled={loading} value={paidBy} onChange={(event) => setPaidBy(event.target.value)} className={inputClass}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {onDelete ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-full bg-[#18181b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save expense'}
        </button>
      </div>
    </Overlay>
  )
}

export const ContributionModal = ({
  contribution,
  users,
  defaultMonth,
  onClose,
  onSave,
  onDelete,
}: {
  contribution?: Contribution
  users: SessionUser[]
  defaultMonth: string
  onClose: () => void
  onSave: (payload: { userId: string; amount: number; month: string }) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}) => {
  const [userId, setUserId] = useState(contribution?.userId ?? users[0]?.id ?? '')
  const [amount, setAmount] = useState(contribution?.amount.toString() ?? '')
  const [month, setMonth] = useState(contribution?.month ?? defaultMonth)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({ userId, amount: Number(amount), month })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay
      title={contribution ? 'Edit Contribution' : 'Add Contribution'}
      subtitle="Tie contributions to the correct ledger month so old months stay intact."
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Member">
          <select disabled={loading} value={userId} onChange={(event) => setUserId(event.target.value)} className={inputClass}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <input disabled={loading} type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Month">
            <input disabled={loading} type="month" value={month} onChange={(event) => setMonth(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between gap-3">
        {onDelete ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-full bg-[#18181b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save contribution'}
        </button>
      </div>
    </Overlay>
  )
}

export const CategoryModal = ({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (payload: { name: string; tone: Category['tone']; icon: string }) => Promise<void> | void
}) => {
  const [name, setName] = useState('')
  const [tone, setTone] = useState<Category['tone']>('emerald')
  const [icon, setIcon] = useState('WalletCards')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({ name, tone, icon })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay
      title="Add Category"
      subtitle="Create a custom spending bucket for this tracker."
      onClose={onClose}
    >
      <div className="space-y-4">
        <Field label="Category name">
          <input disabled={loading} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Accent">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TONE_STYLES).map(([toneName, styles]) => (
              <button
                key={toneName}
                type="button"
                disabled={loading}
                onClick={() => setTone(toneName as Category['tone'])}
                className={cn(
                  'rounded-2xl px-3 py-3 text-xs font-semibold capitalize transition',
                  styles.badge,
                  tone === toneName ? 'ring-2 ring-zinc-300' : '',
                )}
              >
                {toneName}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Icon label">
          <input disabled={loading} value={icon} onChange={(event) => setIcon(event.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={handleSave}
          className="rounded-full bg-[#18181b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save category'}
        </button>
      </div>
    </Overlay>
  )
}

export const WorkspaceManagerModal = ({
  spaces,
  currentSpaceId,
  onClose,
}: {
  spaces: TrackingSpace[]
  currentSpaceId: string | null
  onClose: () => void
}) => {
  const { createSpace, joinGroupSpace, selectSpace } = useAuth()
  const [mode, setMode] = useState<'individual' | 'group' | 'join'>('individual')
  const [spaceName, setSpaceName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

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
      onClose()
    } catch (err) {
      setMessage('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay
      title="Tracking Spaces"
      subtitle="Switch between personal and group trackers, or add a new one."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          {spaces.map((space) => (
            <button
              key={space.id}
              type="button"
              disabled={loading}
              onClick={() => {
                selectSpace(space.id)
                onClose()
              }}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition',
                currentSpaceId === space.id
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-[#ece7e2] bg-white text-zinc-900',
              )}
            >
              <div>
                <div className="text-sm font-semibold">{space.name}</div>
                <div className={cn('text-xs', currentSpaceId === space.id ? 'text-zinc-300' : 'text-zinc-400')}>
                  {space.mode === 'group' ? 'Shared workspace' : 'Personal tracker'}
                </div>
              </div>
              <div className={cn('rounded-full px-3 py-1 text-xs font-medium', currentSpaceId === space.id ? 'bg-white text-zinc-900' : 'bg-zinc-100 text-zinc-600')}>
                {space.mode}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] bg-[#f7f5f3] p-4">
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-[20px] bg-zinc-100 p-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => setMode('individual')}
              className={cn('rounded-[16px] px-3 py-2 text-sm font-medium transition', mode === 'individual' ? 'bg-[#111214] text-white' : 'text-zinc-500')}
            >
              Personal
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setMode('group')}
              className={cn('rounded-[16px] px-3 py-2 text-sm font-medium transition', mode === 'group' ? 'bg-[#111214] text-white' : 'text-zinc-500')}
            >
              Group
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setMode('join')}
              className={cn('rounded-[16px] px-3 py-2 text-sm font-medium transition', mode === 'join' ? 'bg-[#111214] text-white' : 'text-zinc-500')}
            >
              Join
            </button>
          </div>

          {mode === 'join' ? (
            <input
              disabled={loading}
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="Enter invite code"
              className={inputClass}
            />
          ) : (
            <input
              disabled={loading}
              value={spaceName}
              onChange={(event) => setSpaceName(event.target.value)}
              placeholder={mode === 'individual' ? 'Personal tracker name' : 'Group tracker name'}
              className={inputClass}
            />
          )}

          {message ? <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{message}</div> : null}

          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#18181b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                <Users className="size-4" />
                {mode === 'join' ? 'Join group tracker' : mode === 'group' ? 'Create group tracker' : 'Create personal tracker'}
              </>
            )}
          </button>
        </div>
      </div>
    </Overlay>
  )
}

export const ReportModal = ({
  month,
  contributions,
  expenses,
  users,
  categories,
  onClose,
}: {
  month: string
  contributions: Contribution[]
  expenses: Expense[]
  users: SessionUser[]
  categories: Category[]
  onClose: () => void
}) => {
  const [filter, setFilter] = useState<ExportFilter>({ mode: 'month', month })

  useEffect(() => {
    setFilter({ mode: 'month', month })
  }, [month])

  return (
    <Overlay
      title="Download Report"
      subtitle="Export the selected ledger as a polished PDF or spreadsheet-ready CSV."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex rounded-full bg-[#f4f1ee] p-1">
          <button
            type="button"
            onClick={() => setFilter({ mode: 'month', month })}
            className={cn(
              'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
              filter.mode === 'month' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500',
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() =>
              setFilter({
                mode: 'range',
                startDate: `${month}-01`,
                endDate: `${month}-28`,
              })
            }
            className={cn(
              'flex-1 rounded-full px-4 py-2 text-sm font-medium transition',
              filter.mode === 'range' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500',
            )}
          >
            Date range
          </button>
        </div>

        {filter.mode === 'month' ? (
          <div className="rounded-2xl bg-[#f8f6f4] px-4 py-4 text-sm text-zinc-600">
            <div className="mb-1 flex items-center gap-2 font-medium text-zinc-900">
              <CalendarDays className="size-4" />
              {formatMonthLabel(filter.month)}
            </div>
            Report includes summary, contributions, expenses, and category breakdown for the month.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                value={filter.startDate}
                onChange={(event) =>
                  setFilter((current) =>
                    current.mode === 'range'
                      ? { ...current, startDate: event.target.value }
                      : current,
                  )
                }
                className={inputClass}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={filter.endDate}
                onChange={(event) =>
                  setFilter((current) =>
                    current.mode === 'range'
                      ? { ...current, endDate: event.target.value }
                      : current,
                  )
                }
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() =>
            downloadCsvReport({
              expenses,
              users,
              categories,
              filter,
            })
          }
          className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-[#faf9f8]"
        >
          <Download className="size-4" />
          CSV
        </button>
        <button
          type="button"
          onClick={() =>
            downloadPdfReport({
              contributions,
              expenses,
              users,
              categories,
              filter,
            })
          }
          className="flex items-center justify-center gap-2 rounded-full bg-[#18181b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
        >
          <Download className="size-4" />
          PDF
        </button>
      </div>
    </Overlay>
  )
}

export const FloatingActionButton = ({
  onClick,
}: {
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="fixed bottom-24 right-4 z-40 flex h-14 min-w-[10.5rem] items-center justify-center gap-2 rounded-full bg-[#18181b] px-5 text-white shadow-[0_18px_40px_rgba(24,24,27,0.22)] transition hover:scale-[1.01] hover:bg-black sm:right-6 lg:bottom-8 lg:right-[max(2rem,calc(50%-39rem))]"
  >
    <Plus className="size-5" />
    Add expense
  </button>
)
