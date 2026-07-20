import { useMemo } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useCategories } from '../categories/useCategories'
import { useConfirmPending } from './useConfirmPending'
import { PendingTransactionCompactCard } from './PendingTransactionCompactCard'
import { currentYearMonth } from './dateUtils'
import { useCards } from '../cards/useCards'
import { CardInvoicePendingCard } from '../cards/CardInvoicePendingCard'
import { computeInvoiceRows, getInvoicePeriod, todayDateString, type CardInvoiceRow } from '../cards/invoiceUtils'
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
  extraRows?: CardInvoiceRow[]
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
  extraRows,
}: PendingColumnProps) {
  const hasExtraRows = extraRows !== undefined && extraRows.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon size={18} className={colorClass} />
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">{title}</p>
      </div>
      {items.length === 0 && !hasExtraRows ? (
        <div className="rounded-2xl border border-dashed border-border-light py-6 text-center text-xs text-light-secondary dark:border-border-dark dark:text-dark-secondary">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {hasExtraRows
            ? extraRows.map((row) => (
                <CardInvoicePendingCard
                  key={row.cardId}
                  cardId={row.cardId}
                  cardName={row.cardName}
                  amount={row.periodOwed}
                />
              ))
            : null}
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
  const { cards } = useCards(uid)
  const { confirmingId, confirm } = useConfirmPending(uid)

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])

  // Transações do período ABERTO de cada cartão — essas ficam de fora da
  // lista individual porque são representadas por um card agregado
  // ("Fatura {nome}"), não uma linha por compra.
  const openPeriodTransactionIds = useMemo(() => {
    const today = todayDateString()
    const ids = new Set<string>()
    for (const card of cards) {
      const period = getInvoicePeriod(card.closingDay, today)
      for (const t of transactions) {
        if (t.cardId === card.id && t.date >= period.start && t.date <= period.end) ids.add(t.id)
      }
    }
    return ids
  }, [cards, transactions])

  const { expenses, incomes } = useMemo(() => {
    const pendingOfMonth = transactions.filter(
      (t) => !t.paid && t.date.startsWith(selectedMonth) && !openPeriodTransactionIds.has(t.id),
    )
    return {
      expenses: pendingOfMonth.filter((t) => t.type === 'expense'),
      incomes: pendingOfMonth.filter((t) => t.type === 'income'),
    }
  }, [transactions, selectedMonth, openPeriodTransactionIds])

  // Só faz sentido mostrar a fatura do "mês vigente" quando o usuário está
  // vendo o mês vigente de verdade — navegando pra outro mês do balancete,
  // o conceito de fatura aberta não se aplica àquele mês.
  const cardInvoiceRows = useMemo(() => {
    if (selectedMonth !== currentYearMonth()) return []
    return computeInvoiceRows(cards, transactions, 0).rows.filter((row) => row.periodOwed > 0)
  }, [cards, transactions, selectedMonth])

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
        extraRows={cardInvoiceRows}
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
