import { STORAGE_KEYS } from '../constants'
import type { AppDatabase } from '../types'

const fallbackDatabase: AppDatabase = {
  users: [],
  spaces: [],
  categories: [],
  contributions: [],
  expenses: [],
}

export const readDatabase = (): AppDatabase => {
  const raw = window.localStorage.getItem(STORAGE_KEYS.database)
  if (!raw) {
    return fallbackDatabase
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppDatabase>
    return {
      users: parsed.users ?? [],
      spaces: parsed.spaces ?? [],
      categories: parsed.categories ?? [],
      contributions: parsed.contributions ?? [],
      expenses: parsed.expenses ?? [],
    }
  } catch {
    return fallbackDatabase
  }
}

export const writeDatabase = (database: AppDatabase) => {
  window.localStorage.setItem(STORAGE_KEYS.database, JSON.stringify(database))
}
