import { clsx } from 'clsx'
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'

export const cn = (...values: Array<string | false | null | undefined>) =>
  clsx(values)

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

export const formatMonthLabel = (month: string) =>
  format(parseISO(`${month}-01`), 'MMMM yyyy')

export const getMonthKey = (date: string | Date) => {
  const source = typeof date === 'string' ? parseISO(date) : date
  return format(source, 'yyyy-MM')
}

export const getCurrentMonth = () => format(new Date(), 'yyyy-MM')

export const generateId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`

export const generateInviteCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase()

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')

export const getDaysLeftInMonth = (month: string) => {
  const today = new Date()
  const monthDate = parseISO(`${month}-01`)
  const lastDay = endOfMonth(monthDate)

  if (getMonthKey(today) !== month) {
    return differenceInCalendarDays(lastDay, startOfMonth(monthDate)) + 1
  }

  return Math.max(differenceInCalendarDays(lastDay, today), 0)
}

export const getMonthRange = (month: string) => {
  const date = parseISO(`${month}-01`)
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

export const isDateInFilter = (
  date: string,
  filter:
    | { mode: 'month'; month: string }
    | { mode: 'range'; startDate: string; endDate: string },
) => {
  const parsed = parseISO(date)

  if (filter.mode === 'month') {
    const range = getMonthRange(filter.month)
    return isWithinInterval(parsed, range)
  }

  return isWithinInterval(parsed, {
    start: parseISO(filter.startDate),
    end: parseISO(filter.endDate),
  })
}

export const buildMonthOptions = (months: string[]) => {
  const set = new Set(months)
  const current = new Date()

  for (let offset = 0; offset < 12; offset += 1) {
    set.add(format(subMonths(current, offset), 'yyyy-MM'))
  }

  set.add(format(addMonths(current, 1), 'yyyy-MM'))

  return Array.from(set).sort((left, right) => right.localeCompare(left))
}
