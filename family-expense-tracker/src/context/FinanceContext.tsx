import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { STORAGE_KEYS } from '../constants'
import { useAuth } from './AuthContext'
import { getMonthKey, getCurrentMonth } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { Category, Contribution, Expense } from '../types'

type ExpenseInput = {
  title: string
  amount: number
  categoryId: string
  paidBy: string
  date: string
}

type ContributionInput = {
  userId: string
  amount: number
  month: string
}

type CategoryInput = {
  name: string
  tone: Category['tone']
  icon: string
}

type FinanceContextValue = {
  expenses: Expense[]
  contributions: Contribution[]
  categories: Category[]
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  addExpense: (input: ExpenseInput) => Promise<void>
  updateExpense: (id: string, input: ExpenseInput) => Promise<void>
  deleteExpense: (id: string) => Promise<void>
  addContribution: (input: ContributionInput) => Promise<void>
  updateContribution: (id: string, input: ContributionInput) => Promise<void>
  deleteContribution: (id: string) => Promise<void>
  addCategory: (input: CategoryInput) => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { currentSpace } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMonth, setSelectedMonthState] = useState(
    () => window.localStorage.getItem(STORAGE_KEYS.selectedMonth) ?? getCurrentMonth(),
  )

  const spaceId = currentSpace?.id ?? null

  // Fetch initial data
  useEffect(() => {
    if (!spaceId) {
      setExpenses([])
      setContributions([])
      setCategories([])
      return
    }

    const fetchData = async () => {
      const [
        { data: expData },
        { data: contData },
        { data: catData }
      ] = await Promise.all([
        supabase.from('expenses').select('*').eq('space_id', spaceId).order('date', { ascending: false }),
        supabase.from('contributions').select('*').eq('space_id', spaceId),
        supabase.from('categories').select('*').eq('space_id', spaceId)
      ])

      if (expData) setExpenses(expData.map(e => ({
        id: e.id,
        spaceId: e.space_id,
        title: e.title,
        amount: Number(e.amount),
        categoryId: e.category_id,
        paidBy: e.paid_by,
        date: e.date,
        month: e.month,
        createdAt: e.created_at,
        updatedAt: e.updated_at
      })))
      
      if (contData) setContributions(contData.map(c => ({
        id: c.id,
        spaceId: c.space_id,
        userId: c.user_id,
        amount: Number(c.amount),
        month: c.month,
        createdAt: c.created_at
      })))

      if (catData) setCategories(catData.map(c => ({
        id: c.id,
        spaceId: c.space_id,
        name: c.name,
        icon: c.icon,
        tone: c.tone,
        isDefault: c.is_default,
        createdAt: c.created_at
      })))
    }

    fetchData()

    // Real-time subscriptions
    const expensesSub = supabase.channel('expenses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: space_id=eq. }, () => fetchData())
      .subscribe()

    const contributionsSub = supabase.channel('contributions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contributions', filter: space_id=eq. }, () => fetchData())
      .subscribe()

    const categoriesSub = supabase.channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: space_id=eq. }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(expensesSub)
      supabase.removeChannel(contributionsSub)
      supabase.removeChannel(categoriesSub)
    }
  }, [spaceId])

  const setSelectedMonth = (month: string) => {
    setSelectedMonthState(month)
    window.localStorage.setItem(STORAGE_KEYS.selectedMonth, month)
  }

  const addExpense = async (input: ExpenseInput) => {
    if (!spaceId) return
    await supabase.from('expenses').insert({
      space_id: spaceId,
      title: input.title,
      amount: input.amount,
      category_id: input.categoryId,
      paid_by: input.paidBy,
      date: input.date,
      month: getMonthKey(input.date)
    })
  }

  const updateExpense = async (id: string, input: ExpenseInput) => {
    await supabase.from('expenses').update({
      title: input.title,
      amount: input.amount,
      category_id: input.categoryId,
      paid_by: input.paidBy,
      date: input.date,
      month: getMonthKey(input.date),
      updated_at: new Date().toISOString()
    }).eq('id', id)
  }

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id)
  }

  const addContribution = async (input: ContributionInput) => {
    if (!spaceId) return
    await supabase.from('contributions').insert({
      space_id: spaceId,
      user_id: input.userId,
      amount: input.amount,
      month: input.month
    })
  }

  const updateContribution = async (id: string, input: ContributionInput) => {
    await supabase.from('contributions').update({
      user_id: input.userId,
      amount: input.amount,
      month: input.month
    }).eq('id', id)
  }

  const deleteContribution = async (id: string) => {
    await supabase.from('contributions').delete().eq('id', id)
  }

  const addCategory = async (input: CategoryInput) => {
    if (!spaceId) return
    await supabase.from('categories').insert({
      space_id: spaceId,
      name: input.name,
      tone: input.tone,
      icon: input.icon,
      is_default: false
    })
  }

  const value = useMemo<FinanceContextValue>(
    () => ({
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
    }),
    [categories, contributions, expenses, selectedMonth],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export const useFinance = () => {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }
  return context
}
