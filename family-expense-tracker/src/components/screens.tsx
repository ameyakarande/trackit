import type { ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Copy,
  Download,
  FolderKanban,
  Search,
  ShoppingBasket,
  Users,
  WalletCards,
  Wifi,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { TONE_STYLES } from '../constants'
import { cn, formatCurrency, formatMonthLabel, getInitials } from '../lib/utils'
import type {
  Category,
  Contribution,
  Expense,
  SessionUser,
  TrackingMode,
} from '../types'

const formatTooltipValue = (
  value: string | number | ReadonlyArray<string | number> | undefined,
) => {
  if (typeof value === 'number') {
    return formatCurrency(value)
  }

  if (Array.isArray(value)) {
    return value.join(', ')
  }

  return String(value ?? '')
}

const iconMap = {
  Building2,
  ShoppingBasket,
  Zap,
  Wifi,
  WalletCards,
} as const

const Card = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <section
    className={cn(
      'rounded-[28px] border border-[#ece7e2] bg-white p-5 shadow-[0_12px_34px_rgba(24,24,27,0.06)]',
      className,
    )}
  >
    {children}
  </section>
)

const SectionTitle = ({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="text-base font-semibold text-zinc-950 md:text-lg">{title}</h2>
    {action}
  </div>
)

export const AppHeader = ({
  name,
  onSearch,
  onOpenSpaces,
}: {
  name: string
  onSearch: () => void
  onOpenSpaces: () => void
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-full bg-[#191919] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(25,25,25,0.16)]">
        {getInitials(name)}
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-400">Switch between your trackers</p>
        <h1 className="text-xl font-semibold text-zinc-950 md:text-2xl">{name}</h1>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onSearch}
        className="rounded-full border border-zinc-200 bg-white p-3 text-zinc-500 transition hover:text-zinc-900"
      >
        <Search className="size-4" />
      </button>
      <button
        type="button"
        onClick={onOpenSpaces}
        className="rounded-full border border-zinc-200 bg-white p-3 text-zinc-500 transition hover:text-zinc-900"
      >
        <FolderKanban className="size-4" />
      </button>
    </div>
  </div>
)

export const OverviewScreen = ({
  spaceName,
  spaceMode,
  inviteCode,
  members,
  totalBalance,
  totalContributions,
  totalExpenses,
  contributions,
  expenses,
  categories,
  users,
  searchOpen,
  searchTerm,
  onSearchTermChange,
  onOpenExpense,
  onOpenContribution,
  onOpenReport,
  onCopyInvite,
  onEditExpense,
}: {
  spaceName: string
  spaceMode: TrackingMode
  inviteCode: string | null
  members: SessionUser[]
  totalBalance: number
  totalContributions: number
  totalExpenses: number
  contributions: Contribution[]
  expenses: Expense[]
  categories: Category[]
  users: SessionUser[]
  searchOpen: boolean
  searchTerm: string
  onSearchTermChange: (value: string) => void
  onOpenExpense: () => void
  onOpenContribution: () => void
  onOpenReport: () => void
  onCopyInvite: () => void
  onEditExpense: (expense: Expense) => void
}) => {
  const contributionByUser = users.map((user) => ({
    user,
    total: contributions
      .filter((entry) => entry.userId === user.id)
      .reduce((sum, entry) => sum + entry.amount, 0),
  }))

  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const topCategories = categories
    .map((category) => {
      const spent = expenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0)
      return { category, spent }
    })
    .filter((entry) => entry.spent > 0)
    .sort((left, right) => right.spent - left.spent)
    .slice(0, 4)

  const filteredExpenses = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-5 md:space-y-6">
      <Card className="overflow-hidden bg-[linear-gradient(160deg,#232529_0%,#17181c_100%)] text-white md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">{spaceName}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-300">
              {spaceMode === 'group' ? <Users className="size-4" /> : <WalletCards className="size-4" />}
              {spaceMode === 'group'
                ? `${members.length} group member${members.length === 1 ? '' : 's'}`
                : 'Personal tracker'}
            </div>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-zinc-200">
            {spaceMode === 'group' && inviteCode ? `Invite: ${inviteCode}` : 'Personal'}
          </div>
        </div>
        <p className="text-sm text-zinc-400">Current Balance</p>
        <div className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {formatCurrency(totalBalance)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <button
            type="button"
            onClick={onOpenExpense}
            className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-[#151515]"
          >
            Add expense
          </button>
          <button
            type="button"
            onClick={onOpenContribution}
            className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-200"
          >
            Add contribution
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-200"
          >
            Download report
          </button>
          {spaceMode === 'group' && inviteCode ? (
            <button
              type="button"
              onClick={onCopyInvite}
              className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-200"
            >
              Copy invite code
            </button>
          ) : (
            <div className="rounded-full bg-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-200">
              Personal space
            </div>
          )}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white/8 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
              <ArrowUpRight className="size-4 text-emerald-300" />
              Contributions
            </div>
            <div className="mt-3 text-xl font-semibold">{formatCurrency(totalContributions)}</div>
          </div>
          <div className="rounded-3xl bg-white/8 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
              <ArrowDownRight className="size-4 text-rose-300" />
              Expenses
            </div>
            <div className="mt-3 text-xl font-semibold">{formatCurrency(totalExpenses)}</div>
          </div>
        </div>
      </Card>

      {searchOpen ? (
        <label className="flex items-center gap-3 rounded-full border border-[#ece7e2] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(24,24,27,0.04)]">
          <Search className="size-4 text-zinc-400" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={`Search ${spaceMode === 'group' ? 'group' : 'personal'} transactions`}
            className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </label>
      ) : null}

      <div className="grid gap-5 md:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <SectionTitle
            title={spaceMode === 'group' ? 'Members' : 'Contributions by You'}
            action={
              spaceMode === 'group' && inviteCode ? (
                <button
                  type="button"
                  onClick={onCopyInvite}
                  className="rounded-full bg-[#18181b] px-4 py-2 text-xs font-semibold text-white"
                >
                  Copy invite
                </button>
              ) : undefined
            }
          />
          {spaceMode === 'group' && inviteCode ? (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-[#f8f6f4] px-4 py-3 text-sm text-zinc-500">
              <Copy className="size-4" />
              Share <span className="font-semibold text-zinc-950">{inviteCode}</span> so another member can
              join this group tracker.
            </div>
          ) : null}
          <div className="space-y-3">
            {contributionByUser.map(({ user, total }) => (
              <div key={user.id} className="flex items-center justify-between rounded-2xl bg-[#f8f6f4] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-900 shadow-[0_6px_16px_rgba(24,24,27,0.06)]">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-950">{user.name}</p>
                    <p className="text-xs text-zinc-400">{spaceMode === 'group' ? user.email : 'Owner'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-zinc-950">{formatCurrency(total)}</div>
                  <div className="text-xs text-zinc-400">Contributed</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Category Spend" />
          <div className="space-y-4">
            {topCategories.length === 0 ? (
              <div className="rounded-2xl bg-[#f8f6f4] px-4 py-6 text-center text-sm text-zinc-400">
                No category spending yet for this month.
              </div>
            ) : (
              topCategories.map(({ category, spent }) => {
                const share = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0
                const styles = TONE_STYLES[category.tone]
                const Icon = iconMap[category.icon as keyof typeof iconMap] ?? WalletCards

                return (
                  <div key={category.id} className="rounded-2xl bg-[#f8f6f4] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('rounded-2xl p-2', styles.badge)}>
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-950">{category.name}</p>
                          <p className="text-xs text-zinc-400">{share}% of total monthly spend</p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-zinc-950">{formatCurrency(spent)}</div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300', styles.progress)}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="pb-4">
        <SectionTitle title={`Recent ${spaceMode === 'group' ? 'Group' : 'Personal'} Transactions`} />
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="rounded-2xl bg-[#f8f6f4] px-4 py-6 text-center text-sm text-zinc-400">
              Add your first expense to start tracking this month.
            </div>
          ) : (
            filteredExpenses.slice(0, 8).map((expense) => {
              const category = categories.find((entry) => entry.id === expense.categoryId)
              const user = users.find((entry) => entry.id === expense.paidBy)
              return (
                <button
                  key={expense.id}
                  type="button"
                  onClick={() => onEditExpense(expense)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#f1ece6] bg-white px-4 py-4 text-left transition hover:bg-[#fcfbfa]"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-950">{expense.title}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {category?.name ?? 'Misc'} • {user?.name ?? 'Unknown'} • {expense.date}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-zinc-950">{formatCurrency(expense.amount)}</div>
                </button>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

export const BudgetsScreen = ({
  month,
  totalBalance,
  totalContributions,
  totalExpenses,
  daysLeft,
  categories,
  expenses,
  onAddCategory,
  onOpenContribution,
}: {
  month: string
  totalBalance: number
  totalContributions: number
  totalExpenses: number
  daysLeft: number
  categories: Category[]
  expenses: Expense[]
  onAddCategory: () => void
  onOpenContribution: () => void
}) => {
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="rounded-[24px] bg-[#f8f6f4] p-5">
            <p className="text-sm text-zinc-400">Left for {daysLeft} days</p>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">
              {formatCurrency(totalBalance)}
            </div>
            <div className="mt-2 text-sm text-zinc-400">{formatMonthLabel(month)}</div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-[#2ecc71] transition-all duration-300"
                style={{
                  width: `${Math.min((totalExpenses / Math.max(totalContributions, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-zinc-500">
              <span>Spent {formatCurrency(totalExpenses)}</span>
              <span>Pool {formatCurrency(totalContributions)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Spending Controls"
            action={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onOpenContribution}
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800"
                >
                  Contribution
                </button>
                <button
                  type="button"
                  onClick={onAddCategory}
                  className="rounded-full bg-[#18181b] px-4 py-2 text-xs font-semibold text-white"
                >
                  Add category
                </button>
              </div>
            }
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-[#f8f6f4] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Categories</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{categories.length}</p>
            </div>
            <div className="rounded-2xl bg-[#f8f6f4] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Spent</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-2xl bg-[#f8f6f4] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Transactions</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">{expenses.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Category Spend Totals" />
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const categoryExpenses = expenses.filter((expense) => expense.categoryId === category.id)
            const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
            const share = totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0
            const styles = TONE_STYLES[category.tone]

            return (
              <div key={category.id} className="rounded-3xl bg-[#f8f6f4] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-950">{category.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {categoryExpenses.length} transaction{categoryExpenses.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', styles.badge)}>
                    {share}% share
                  </span>
                </div>
                <div className="mb-3 text-lg font-semibold text-zinc-950">{formatCurrency(spent)}</div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300', styles.progress)}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

export const InsightsScreen = ({
  month,
  contributions,
  expenses,
  categories,
  users,
  onDownload,
}: {
  month: string
  contributions: Contribution[]
  expenses: Expense[]
  categories: Category[]
  users: SessionUser[]
  onDownload: () => void
}) => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalContributions = contributions.reduce((sum, contribution) => sum + contribution.amount, 0)

  const dailyData = expenses.reduce<Array<{ day: string; spent: number }>>((accumulator, expense) => {
    const existing = accumulator.find((entry) => entry.day === expense.date)
    if (existing) {
      existing.spent += expense.amount
    } else {
      accumulator.push({ day: expense.date, spent: expense.amount })
    }
    return accumulator
  }, [])

  const categoryData = categories
    .map((category) => ({
      name: category.name,
      total: expenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0),
      color:
        category.tone === 'emerald'
          ? '#22c55e'
          : category.tone === 'amber'
            ? '#f59e0b'
            : category.tone === 'rose'
              ? '#f43f5e'
              : category.tone === 'sky'
                ? '#60a5fa'
                : '#71717a',
    }))
    .filter((entry) => entry.total > 0)

  const memberData = users.map((user) => ({
    name: user.name,
    contributed: contributions
      .filter((entry) => entry.userId === user.id)
      .reduce((sum, entry) => sum + entry.amount, 0),
  }))

  return (
    <div className="space-y-5 md:space-y-6">
      <Card>
        <SectionTitle
          title="Monthly Spending Summary"
          action={
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center gap-2 rounded-full bg-[#18181b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-black"
            >
              <Download className="size-3.5" />
              Download report
            </button>
          }
        />
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-[#f8f6f4] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Month</p>
            <div className="mt-2 text-sm font-semibold text-zinc-950">{formatMonthLabel(month)}</div>
          </div>
          <div className="rounded-2xl bg-[#f8f6f4] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Pool</p>
            <div className="mt-2 text-sm font-semibold text-zinc-950">
              {formatCurrency(totalContributions)}
            </div>
          </div>
          <div className="rounded-2xl bg-[#f8f6f4] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Spent</p>
            <div className="mt-2 text-sm font-semibold text-zinc-950">{formatCurrency(totalExpenses)}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <SectionTitle title="Spending Flow" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="spend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111214" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#111214" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#ece7e2" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
                <Tooltip formatter={formatTooltipValue} />
                <Area type="monotone" dataKey="spent" stroke="#111214" fill="url(#spend)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Category Breakdown" />
          <div className="grid gap-5">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="total" nameKey="name" innerRadius={56} outerRadius={82}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatTooltipValue} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryData.length === 0 ? (
                <div className="rounded-2xl bg-[#f8f6f4] px-4 py-6 text-sm text-zinc-400">
                  Add expenses to unlock insights.
                </div>
              ) : (
                categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-[#f8f6f4] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="size-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm font-medium text-zinc-950">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-950">{formatCurrency(entry.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle title="Contribution Mix" />
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={memberData}>
              <CartesianGrid stroke="#ece7e2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <YAxis tick={{ fontSize: 11, fill: '#a1a1aa' }} />
              <Tooltip formatter={formatTooltipValue} />
              <Bar dataKey="contributed" fill="#18181b" radius={[14, 14, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
