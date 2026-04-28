export type AppUser = {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

export type SessionUser = Omit<AppUser, 'password'>

export type TrackingMode = 'individual' | 'group'

export type TrackingSpace = {
  id: string
  name: string
  mode: TrackingMode
  inviteCode: string | null
  ownerId: string
  memberIds: string[]
  createdAt: string
}

export type CategoryTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate'

export type Category = {
  id: string
  spaceId: string
  name: string
  icon: string
  tone: CategoryTone
  isDefault: boolean
  createdAt: string
}

export type Contribution = {
  id: string
  spaceId: string
  userId: string
  amount: number
  month: string
  createdAt: string
}

export type Expense = {
  id: string
  spaceId: string
  title: string
  amount: number
  categoryId: string
  paidBy: string
  date: string
  month: string
  createdAt: string
  updatedAt: string
}

export type AppDatabase = {
  users: AppUser[]
  spaces: TrackingSpace[]
  categories: Category[]
  contributions: Contribution[]
  expenses: Expense[]
}

export type ExportFilter =
  | {
      mode: 'month'
      month: string
    }
  | {
      mode: 'range'
      startDate: string
      endDate: string
    }
