import { generateId } from './lib/utils'
import type { Category } from './types'

export const STORAGE_KEYS = {
  database: 'family-expense-tracker-db-v3',
  session: 'family-expense-tracker-session-v1',
  selectedMonth: 'family-expense-tracker-selected-month-v1',
  selectedSpace: 'family-expense-tracker-selected-space-v1',
} as const

const DEFAULT_CATEGORY_TEMPLATES = [
  {
    name: 'Rent',
    icon: 'Building2',
    tone: 'sky',
  },
  {
    name: 'Groceries',
    icon: 'ShoppingBasket',
    tone: 'emerald',
  },
  {
    name: 'Electricity',
    icon: 'Zap',
    tone: 'amber',
  },
  {
    name: 'Internet',
    icon: 'Wifi',
    tone: 'sky',
  },
  {
    name: 'Misc',
    icon: 'WalletCards',
    tone: 'slate',
  },
] as const satisfies Array<Pick<Category, 'name' | 'icon' | 'tone'>>

export const createDefaultCategories = (spaceId: string): Category[] =>
  DEFAULT_CATEGORY_TEMPLATES.map((category) => ({
    id: generateId('cat'),
    spaceId,
    ...category,
    isDefault: true,
    createdAt: new Date().toISOString(),
  }))

export const TONE_STYLES = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    progress: 'bg-emerald-500',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    progress: 'bg-amber-500',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
    progress: 'bg-rose-500',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
    progress: 'bg-sky-500',
  },
  slate: {
    badge: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
    progress: 'bg-slate-500',
  },
} as const

export const MAX_USERS = 4
