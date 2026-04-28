import { useEffect, useMemo, useState } from 'react'
import { Check, LogOut } from 'lucide-react'

import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider, useFinance } from './context/FinanceContext'
import { AuthScreen } from './components/AuthScreen'
import { BottomNav } from './components/BottomNav'
import { FamilySetupScreen } from './components/FamilySetupScreen'
import { MonthSwitcher } from './components/MonthSwitcher'
import {
  CategoryModal,
  ContributionModal,
  ExpenseModal,
  FloatingActionButton,
  ReportModal,
  WorkspaceManagerModal,
} from './components/modals'
import {
  AppHeader,
  BudgetsScreen,
  InsightsScreen,
  OverviewScreen,
} from './components/screens'
import { buildMonthOptions, getDaysLeftInMonth } from './lib/utils'
import type { Contribution, Expense } from './types'

const Dashboard = () => {
  const {
    user,
    currentSpace,
    currentSpaceMembers,
    accessibleSpaces,
    logout,
  } = useAuth()
  const {
    expenses,
    contributions,
    categories,
    selectedMonth,
    setSelectedMonth,
    addExpense,
    updateExpense,
    deleteExpense,
    addContribution,
    updateContribution,
    deleteContribution,
    addCategory,
  } = useFinance()
  const [tab, setTab] = useState<'overview' | 'insights' | 'budgets'>('overview')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [expenseModal, setExpenseModal] = useState<{ open: boolean; expense?: Expense }>({
    open: false,
  })
  const [contributionModal, setContributionModal] = useState<{
    open: boolean
    contribution?: Contribution
  }>({ open: false })
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => expense.month === selectedMonth),
    [expenses, selectedMonth],
  )

  const monthContributions = useMemo(
    () => contributions.filter((contribution) => contribution.month === selectedMonth),
    [contributions, selectedMonth],
  )

  const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalContributions = monthContributions.reduce(
    (sum, contribution) => sum + contribution.amount,
    0,
  )
  const totalBalance = totalContributions - totalExpenses
  const daysLeft = getDaysLeftInMonth(selectedMonth)
  const monthOptions = buildMonthOptions([
    ...expenses.map((expense) => expense.month),
    ...contributions.map((contribution) => contribution.month),
  ])

  useEffect(() => {
    if (!copiedInvite) {
      return
    }

    const timeout = window.setTimeout(() => setCopiedInvite(false), 2200)
    return () => window.clearTimeout(timeout)
  }, [copiedInvite])

  if (!user) {
    return <AuthScreen />
  }

  if (accessibleSpaces.length === 0) {
    return <FamilySetupScreen />
  }

  if (!currentSpace) {
    return null
  }

  const copyInvite = async () => {
    if (!currentSpace.inviteCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(currentSpace.inviteCode)
      setCopiedInvite(true)
    } catch {
      setCopiedInvite(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eceae8_0%,#e5e2df_100%)] text-zinc-900">
      <div className="mx-auto max-w-md px-4 pb-40 pt-6 sm:max-w-2xl lg:max-w-6xl lg:px-6">
        <div className="rounded-[38px] border border-white/80 bg-[#f5f3f1] px-4 pb-8 pt-5 shadow-[0_24px_80px_rgba(90,82,74,0.14)] sm:px-5 lg:px-8 lg:pb-10 lg:pt-6">
          <AppHeader
            name={user.name}
            onSearch={() => setSearchOpen((current) => !current)}
            onOpenSpaces={() => setWorkspaceModalOpen(true)}
          />

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1">
              <MonthSwitcher
                selectedMonth={selectedMonth}
                months={monthOptions}
                onChange={setSelectedMonth}
              />
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-zinc-200 bg-white p-3 text-zinc-500 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:text-zinc-900"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>

          {copiedInvite ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <Check className="size-4" />
              Invite code copied. Family members can paste it to join this group.
            </div>
          ) : null}

          <div className="mt-5">
            {tab === 'overview' ? (
              <OverviewScreen
                spaceName={currentSpace.name}
                spaceMode={currentSpace.mode}
                inviteCode={currentSpace.inviteCode}
                members={currentSpaceMembers}
                totalBalance={totalBalance}
                totalContributions={totalContributions}
                totalExpenses={totalExpenses}
                contributions={monthContributions}
                expenses={monthExpenses}
                categories={categories}
                users={currentSpaceMembers}
                searchOpen={searchOpen}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onOpenExpense={() => setExpenseModal({ open: true })}
                onOpenContribution={() => setContributionModal({ open: true })}
                onOpenReport={() => setReportModalOpen(true)}
                onCopyInvite={copyInvite}
                onEditExpense={(expense) => setExpenseModal({ open: true, expense })}
              />
            ) : null}

            {tab === 'budgets' ? (
              <BudgetsScreen
                month={selectedMonth}
                totalBalance={totalBalance}
                totalContributions={totalContributions}
                totalExpenses={totalExpenses}
                daysLeft={daysLeft}
                categories={categories}
                expenses={monthExpenses}
                onAddCategory={() => setCategoryModalOpen(true)}
                onOpenContribution={() => setContributionModal({ open: true })}
              />
            ) : null}

            {tab === 'insights' ? (
              <InsightsScreen
                month={selectedMonth}
                contributions={monthContributions}
                expenses={monthExpenses}
                categories={categories}
                users={currentSpaceMembers}
                onDownload={() => setReportModalOpen(true)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <FloatingActionButton onClick={() => setExpenseModal({ open: true })} />
      <BottomNav activeTab={tab} onChange={setTab} />

      {expenseModal.open ? (
        <ExpenseModal
          expense={expenseModal.expense}
          categories={categories}
          users={currentSpaceMembers}
          defaultMonth={selectedMonth}
          onClose={() => setExpenseModal({ open: false })}
          onSave={(payload) => {
            if (expenseModal.expense) {
              updateExpense(expenseModal.expense.id, payload)
              return
            }
            addExpense(payload)
          }}
          onDelete={
            expenseModal.expense
              ? () => {
                  deleteExpense(expenseModal.expense!.id)
                  setExpenseModal({ open: false })
                }
              : undefined
          }
        />
      ) : null}

      {contributionModal.open ? (
        <ContributionModal
          contribution={contributionModal.contribution}
          users={currentSpaceMembers}
          defaultMonth={selectedMonth}
          onClose={() => setContributionModal({ open: false })}
          onSave={(payload) => {
            if (contributionModal.contribution) {
              updateContribution(contributionModal.contribution.id, payload)
              return
            }
            addContribution(payload)
          }}
          onDelete={
            contributionModal.contribution
              ? () => {
                  deleteContribution(contributionModal.contribution!.id)
                  setContributionModal({ open: false })
                }
              : undefined
          }
        />
      ) : null}

      {categoryModalOpen ? (
        <CategoryModal
          onClose={() => setCategoryModalOpen(false)}
          onSave={(payload) => addCategory(payload)}
        />
      ) : null}

      {workspaceModalOpen ? (
        <WorkspaceManagerModal
          spaces={accessibleSpaces}
          currentSpaceId={currentSpace.id}
          onClose={() => setWorkspaceModalOpen(false)}
        />
      ) : null}

      {reportModalOpen ? (
        <ReportModal
          month={selectedMonth}
          contributions={contributions}
          expenses={expenses}
          users={currentSpaceMembers}
          categories={categories}
          onClose={() => setReportModalOpen(false)}
        />
      ) : null}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <Dashboard />
      </FinanceProvider>
    </AuthProvider>
  )
}

export default App
