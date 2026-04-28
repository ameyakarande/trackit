import { format } from 'date-fns'

import { formatCurrency, formatMonthLabel, isDateInFilter } from './utils'
import type {
  Category,
  Contribution,
  Expense,
  ExportFilter,
  SessionUser,
} from '../types'

type ReportArgs = {
  contributions: Contribution[]
  expenses: Expense[]
  users: SessionUser[]
  categories: Category[]
  filter: ExportFilter
}

const resolveTitle = (filter: ExportFilter) =>
  filter.mode === 'month'
    ? `Family Expense Report - ${formatMonthLabel(filter.month)}`
    : `Family Expense Report - ${format(new Date(filter.startDate), 'dd MMM yyyy')} to ${format(
        new Date(filter.endDate),
        'dd MMM yyyy',
      )}`

const getFilteredExpenses = (expenses: Expense[], filter: ExportFilter) =>
  expenses.filter((expense) => isDateInFilter(expense.date, filter))

const getFilteredContributions = (
  contributions: Contribution[],
  filter: ExportFilter,
) =>
  filter.mode === 'month'
    ? contributions.filter((contribution) => contribution.month === filter.month)
    : contributions.filter((contribution) =>
        isDateInFilter(`${contribution.month}-01`, filter),
      )

export const downloadCsvReport = ({
  expenses,
  users,
  categories,
  filter,
}: Omit<ReportArgs, 'contributions'>) => {
  const rows = getFilteredExpenses(expenses, filter).map((expense) => {
    const user = users.find((entry) => entry.id === expense.paidBy)
    const category = categories.find((entry) => entry.id === expense.categoryId)

    return [
      expense.date,
      expense.title,
      category?.name ?? 'Uncategorized',
      expense.amount.toFixed(2),
      user?.name ?? 'Unknown',
    ]
  })

  const csv = [
    ['Date', 'Title', 'Category', 'Amount', 'Paid By'].join(','),
    ...rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')),
  ].join('\n')

  const filename = `${resolveTitle(filter).toLowerCase().replaceAll(' ', '-')}.csv`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const downloadPdfReport = async ({
  contributions,
  expenses,
  users,
  categories,
  filter,
}: ReportArgs) => {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const filteredExpenses = getFilteredExpenses(expenses, filter)
  const filteredContributions = getFilteredContributions(contributions, filter)
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
  const totalContributions = filteredContributions.reduce(
    (sum, item) => sum + item.amount,
    0,
  )
  const remainingBalance = totalContributions - totalExpenses
  const title = resolveTitle(filter)

  const doc = new jsPDF()
  const docWithTables = doc as typeof doc & { lastAutoTable?: { finalY: number } }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total Contributions: ${formatCurrency(totalContributions)}`, 14, 28)
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 14, 34)
  doc.text(`Remaining Balance: ${formatCurrency(remainingBalance)}`, 14, 40)

  autoTable(doc, {
    startY: 48,
    head: [['Contributor', 'Month', 'Amount']],
    body: filteredContributions.map((contribution) => {
      const user = users.find((entry) => entry.id === contribution.userId)

      return [
        user?.name ?? 'Unknown',
        contribution.month,
        formatCurrency(contribution.amount),
      ]
    }),
    theme: 'grid',
    headStyles: { fillColor: [21, 128, 61] },
  })

  autoTable(doc, {
    startY: docWithTables.lastAutoTable?.finalY ? docWithTables.lastAutoTable.finalY + 8 : 90,
    head: [['Date', 'Title', 'Category', 'Amount', 'Paid By']],
    body: filteredExpenses.map((expense) => {
      const user = users.find((entry) => entry.id === expense.paidBy)
      const category = categories.find((entry) => entry.id === expense.categoryId)

      return [
        expense.date,
        expense.title,
        category?.name ?? 'Uncategorized',
        formatCurrency(expense.amount),
        user?.name ?? 'Unknown',
      ]
    }),
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
  })

  const categorySummary = categories
    .map((category) => {
      const total = filteredExpenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0)

      return {
        name: category.name,
        total,
        share: totalExpenses > 0 ? `${Math.round((total / totalExpenses) * 100)}%` : '0%',
      }
    })
    .filter((entry) => entry.total > 0)

  autoTable(doc, {
    startY: docWithTables.lastAutoTable?.finalY ? docWithTables.lastAutoTable.finalY + 8 : 150,
    head: [['Category', 'Total', 'Share']],
    body: categorySummary.map((entry) => [
      entry.name,
      formatCurrency(entry.total),
      entry.share,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [14, 116, 144] },
  })

  doc.save(`${title.toLowerCase().replaceAll(' ', '-')}.pdf`)
}
