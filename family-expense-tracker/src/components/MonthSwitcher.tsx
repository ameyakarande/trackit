import { ChevronDown } from 'lucide-react'

import { formatMonthLabel } from '../lib/utils'

export const MonthSwitcher = ({
  selectedMonth,
  months,
  onChange,
}: {
  selectedMonth: string
  months: string[]
  onChange: (month: string) => void
}) => (
  <label className="relative flex items-center rounded-full border border-zinc-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
    <span className="mr-2 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
      Month
    </span>
    <select
      value={selectedMonth}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none bg-transparent pr-6 text-sm font-medium text-zinc-900 outline-none"
    >
      {months.map((month) => (
        <option key={month} value={month}>
          {formatMonthLabel(month)}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 size-4 text-zinc-400" />
  </label>
)
