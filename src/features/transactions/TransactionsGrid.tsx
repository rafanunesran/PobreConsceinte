import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { TransactionCompactCard } from './TransactionCompactCard'
import type { Transaction } from './types'
import type { Category } from '../categories/types'
import type { Account } from '../accounts/types'
import type { CreditCard } from '../cards/types'

interface TransactionsGridProps {
  transactions: Transaction[]
  categoriesById: Map<string, Category>
  accountsById: Map<string, Account>
  cardsById: Map<string, CreditCard>
  selectedMonth: string // 'YYYY-MM'
}

interface TransactionColumnProps {
  title: string
  icon: typeof ArrowDownCircle
  colorClass: string
  emptyLabel: string
  items: Transaction[]
  categoriesById: Map<string, Category>
  accountsById: Map<string, Account>
  cardsById: Map<string, CreditCard>
}

function TransactionColumn({
  title,
  icon: Icon,
  colorClass,
  emptyLabel,
  items,
  categoriesById,
  accountsById,
  cardsById,
}: TransactionColumnProps) {
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
          {items.map((transaction) => {
            const linkedName =
              transaction.accountId !== undefined
                ? accountsById.get(transaction.accountId)?.name
                : transaction.cardId !== undefined
                  ? cardsById.get(transaction.cardId)?.name
                  : undefined
            return (
              <TransactionCompactCard
                key={transaction.id}
                transaction={transaction}
                category={categoriesById.get(transaction.categoryId)}
                linkedName={linkedName}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function TransactionsGrid({
  transactions,
  categoriesById,
  accountsById,
  cardsById,
  selectedMonth,
}: TransactionsGridProps) {
  const { expenses, incomes } = useMemo(() => {
    const ofMonth = transactions.filter((t) => t.date.startsWith(selectedMonth))
    return {
      expenses: ofMonth.filter((t) => t.type === 'expense'),
      incomes: ofMonth.filter((t) => t.type === 'income'),
    }
  }, [transactions, selectedMonth])

  return (
    <div className="grid grid-cols-2 gap-3">
      <TransactionColumn
        title="Despesas"
        icon={ArrowDownCircle}
        colorClass="text-danger"
        emptyLabel="Nenhuma despesa neste mês"
        items={expenses}
        categoriesById={categoriesById}
        accountsById={accountsById}
        cardsById={cardsById}
      />
      <TransactionColumn
        title="Receitas"
        icon={ArrowUpCircle}
        colorClass="text-brand-500"
        emptyLabel="Nenhuma receita neste mês"
        items={incomes}
        categoriesById={categoriesById}
        accountsById={accountsById}
        cardsById={cardsById}
      />
    </div>
  )
}
