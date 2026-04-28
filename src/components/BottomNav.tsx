import { BarChart3, LayoutGrid, Wallet } from 'lucide-react'

import { cn } from '../lib/utils'

type Tab = 'overview' | 'insights' | 'budgets'

const items: Array<{ id: Tab; label: string; icon: typeof LayoutGrid }> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Wallet },
]

export const BottomNav = ({
  activeTab,
  onChange,
}: {
  activeTab: Tab
  onChange: (tab: Tab) => void
}) => (
  <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-5">
    <div className="pointer-events-auto flex w-full max-w-[21.5rem] items-center rounded-full bg-[#111214] p-1.5 shadow-[0_18px_45px_rgba(17,18,20,0.35)]">
      {items.map((item) => {
        const Icon = item.icon
        const active = item.id === activeTab
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center rounded-full px-3 py-2.5 text-[11px] font-medium transition',
              active
                ? 'bg-white text-[#111214] shadow-[0_6px_18px_rgba(255,255,255,0.18)]'
                : 'text-zinc-500 hover:text-zinc-200',
            )}
          >
            <Icon className="mb-1 size-4" />
            {item.label}
          </button>
        )
      })}
    </div>
  </div>
)
