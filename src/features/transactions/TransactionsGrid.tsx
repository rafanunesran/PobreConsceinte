import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { TransactionCompactCard } from './TransactionCompactCard'
import { CardInvoiceRowCard } from '../cards/CardInvoiceRowCard'
import { groupCardTransactionsByInvoice, type CardInvoiceGroup } from '../cards/invoiceUtils'
import { formatBRL } from '../../lib/utils'
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
  cardGroups: CardInvoiceGroup[]
  categoriesById: Map<string, Category>
  accountsById: Map<string, Account>
}

function TransactionColumn({
  title,
  icon: Icon,
  colorClass,
  emptyLabel,
  items,
  cardGroups,
  categoriesById,
  accountsById,
}: TransactionColumnProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon size={18} className={colorClass} />
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">{title}</p>
      </div>
      {items.length === 0 && cardGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-light py-6 text-center text-xs text-light-secondary dark:border-border-dark dark:text-dark-secondary">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cardGroups.map((group) => (
            <CardInvoiceRowCard key={`${group.cardId}-${group.period.end}`} group={group} />
          ))}
          {items.map((transaction) => {
            // Cartão nunca chega aqui — sempre representado pelo
            // CardInvoiceRowCard agregado acima (ver groupCardTransactionsByInvoice).
            const linkedName = accountsById.get(transaction.accountId ?? '')?.name
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
  const cards = useMemo(() => Array.from(cardsById.values()), [cardsById])

  const { expenses, incomes, expenseGroups, incomeGroups, totalExpenses, totalIncomes } = useMemo(() => {
    // Cartão é representado pela fatura agregada (ver abaixo), nunca linha a
    // linha — só transações de conta entram na listagem individual, e essas
    // sim usam a data da própria movimentação pro filtro de mês.
    const accountTransactions = transactions.filter((t) => t.accountId !== undefined)
    const ofMonth = accountTransactions.filter((t) => t.date.startsWith(selectedMonth))

    // Agrupa TODAS as transações de cartão primeiro (sem filtrar por mês da
    // compra) e só então filtra pelo mês de VENCIMENTO — uma compra feita
    // depois do fechamento vence no mês seguinte, não no mês da compra.
    // Só o que ainda está em aberto (unpaidAmount) entra aqui: uma fatura
    // já paga tem sua própria transação "Pagamento fatura X" (vinculada à
    // conta, aparece na listagem individual abaixo) — mostrar o total
    // histórico aqui TAMBÉM duplicaria esse valor no extrato.
    const allGroups = groupCardTransactionsByInvoice(transactions, cards)
    const groupsOfMonth = allGroups.filter((g) => g.dueMonth === selectedMonth && g.unpaidAmount !== 0)

    const expenses = ofMonth.filter((t) => t.type === 'expense')
    const incomes = ofMonth.filter((t) => t.type === 'income')
    const expenseGroups = groupsOfMonth.filter((g) => g.unpaidAmount > 0)
    const incomeGroups = groupsOfMonth.filter((g) => g.unpaidAmount < 0)

    const totalExpenses =
      expenses.reduce((sum, t) => sum + t.amount, 0) + expenseGroups.reduce((sum, g) => sum + g.unpaidAmount, 0)
    const totalIncomes =
      incomes.reduce((sum, t) => sum + t.amount, 0) +
      incomeGroups.reduce((sum, g) => sum + Math.abs(g.unpaidAmount), 0)

    return { expenses, incomes, expenseGroups, incomeGroups, totalExpenses, totalIncomes }
  }, [transactions, selectedMonth, cards])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border-light bg-surface-light p-4 dark:border-border-dark dark:bg-surface-dark-elevated">
        <div className="min-w-0">
          <p className="text-xs text-light-secondary dark:text-dark-secondary">Despesas</p>
          <p className="truncate text-lg font-semibold text-danger">{formatBRL(totalExpenses)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-light-secondary dark:text-dark-secondary">Receitas</p>
          <p className="truncate text-lg font-semibold text-brand-500">{formatBRL(totalIncomes)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TransactionColumn
          title="Despesas"
          icon={ArrowDownCircle}
          colorClass="text-danger"
          emptyLabel="Nenhuma despesa neste mês"
          items={expenses}
          cardGroups={expenseGroups}
          categoriesById={categoriesById}
          accountsById={accountsById}
        />
        <TransactionColumn
          title="Receitas"
          icon={ArrowUpCircle}
          colorClass="text-brand-500"
          emptyLabel="Nenhuma receita neste mês"
          items={incomes}
          cardGroups={incomeGroups}
          categoriesById={categoriesById}
          accountsById={accountsById}
        />
      </div>
    </div>
  )
}
