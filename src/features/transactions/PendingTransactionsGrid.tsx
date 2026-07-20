import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useCategories } from '../categories/useCategories'
import { useConfirmPending } from './useConfirmPending'
import { PendingTransactionCompactCard } from './PendingTransactionCompactCard'
import type { Transaction } from './types'

interface PendingTransactionsGridProps {
  uid: string
  transactions: Transaction[]
  selectedMonth: string // 'YYYY-MM'
}

interface PendingColumnProps {
  title: string
  icon: typeof ArrowDownCircle
  colorClass: string
  emptyLabel: string
  items: Transaction[]
  categoriesById: Map<string, ReturnType<typeof useCategories>['categories'][number]>
  confirmingId: string | null
  onConfirm: (transaction: Transaction) => void
}

function PendingColumn({
  title,
  icon: Icon,
  colorClass,
  emptyLabel,
  items,
  categoriesById,
  confirmingId,
  onConfirm,
}: PendingColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon size={18} className={colorClass} />
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">{title}</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-light py-6 text-center text-xs text-light-secondary dark:border-border-dark dark:text-dark-secondary">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((transaction) => (
            <PendingTransactionCompactCard
              key={transaction.id}
              transaction={transaction}
              category={categoriesById.get(transaction.categoryId)}
              confirming={confirmingId === transaction.id}
              onConfirm={() => onConfirm(transaction)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function PendingTransactionsGrid({ uid, transactions, selectedMonth }: PendingTransactionsGridProps) {
  const { categories } = useCategories(uid)
  const { confirmingId, confirm } = useConfirmPending(uid)

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])

  const { expenses, incomes } = useMemo(() => {
    const pendingOfMonth = transactions.filter((t) => !t.paid && t.date.startsWith(selectedMonth))
    return {
      expenses: pendingOfMonth.filter((t) => t.type === 'expense'),
      incomes: pendingOfMonth.filter((t) => t.type === 'income'),
    }
  }, [transactions, selectedMonth])

  return (
    <div className="grid grid-cols-2 gap-3">
      <PendingColumn
        title="Despesas pendentes"
        icon={ArrowDownCircle}
        colorClass="text-danger"
        emptyLabel="Nenhuma despesa pendente neste mês"
        items={expenses}
        categoriesById={categoriesById}
        confirmingId={confirmingId}
        onConfirm={confirm}
      />
      <PendingColumn
        title="Receitas pendentes"
        icon={ArrowUpCircle}
        colorClass="text-brand-500"
        emptyLabel="Nenhuma receita pendente neste mês"
        items={incomes}
        categoriesById={categoriesById}
        confirmingId={confirmingId}
        onConfirm={confirm}
      />
    </div>
  )
}
