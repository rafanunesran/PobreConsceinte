import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useCategories } from '../categories/useCategories'
import { useConfirmPending } from './useConfirmPending'
import { PendingTransactionCompactCard } from './PendingTransactionCompactCard'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'
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
  confirmingIds: Set<string>
  onConfirm: (transaction: Transaction) => void
  extraRows?: CardInvoiceRow[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onConfirmSelected: () => void
}

function PendingColumn({
  title,
  icon: Icon,
  colorClass,
  emptyLabel,
  items,
  categoriesById,
  confirmingIds,
  onConfirm,
  extraRows,
  selectedIds,
  onToggleSelect,
  onConfirmSelected,
}: PendingColumnProps) {
  const hasExtraRows = extraRows !== undefined && extraRows.length > 0
  const selectedTotal = items
    .filter((t) => selectedIds.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0)
  const isConfirmingSelected = [...selectedIds].some((id) => confirmingIds.has(id))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <Icon size={18} className={cn('shrink-0', colorClass)} />
          <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
            {title}
          </p>
        </div>
        {selectedIds.size > 0 ? (
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-semibold text-light-primary dark:text-dark-primary">
              {formatBRL(selectedTotal)}
            </span>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 px-2 py-1 text-xs"
              disabled={isConfirmingSelected}
              onClick={onConfirmSelected}
            >
              {isConfirmingSelected ? 'Pagando' : `Pagar (${selectedIds.size})`}
            </Button>
          </div>
        ) : null}
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
              confirming={confirmingIds.has(transaction.id)}
              onConfirm={() => onConfirm(transaction)}
              selected={selectedIds.has(transaction.id)}
              onToggleSelect={() => onToggleSelect(transaction.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

export function PendingTransactionsGrid({ uid, transactions, selectedMonth }: PendingTransactionsGridProps) {
  const { categories } = useCategories(uid)
  const { cards } = useCards(uid)
  const { confirmingIds, confirm, confirmMany } = useConfirmPending(uid)
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set())
  const [selectedIncomeIds, setSelectedIncomeIds] = useState<Set<string>>(new Set())

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

  async function handleConfirmSelectedExpenses() {
    const selected = expenses.filter((t) => selectedExpenseIds.has(t.id))
    await confirmMany(selected)
    setSelectedExpenseIds(new Set())
  }

  async function handleConfirmSelectedIncomes() {
    const selected = incomes.filter((t) => selectedIncomeIds.has(t.id))
    await confirmMany(selected)
    setSelectedIncomeIds(new Set())
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <PendingColumn
        title="Despesas pendentes"
        icon={ArrowDownCircle}
        colorClass="text-danger"
        emptyLabel="Nenhuma despesa pendente neste mês"
        items={expenses}
        categoriesById={categoriesById}
        confirmingIds={confirmingIds}
        onConfirm={confirm}
        extraRows={cardInvoiceRows}
        selectedIds={selectedExpenseIds}
        onToggleSelect={(id) => setSelectedExpenseIds((prev) => toggleInSet(prev, id))}
        onConfirmSelected={handleConfirmSelectedExpenses}
      />
      <PendingColumn
        title="Receitas pendentes"
        icon={ArrowUpCircle}
        colorClass="text-brand-500"
        emptyLabel="Nenhuma receita pendente neste mês"
        items={incomes}
        categoriesById={categoriesById}
        confirmingIds={confirmingIds}
        onConfirm={confirm}
        selectedIds={selectedIncomeIds}
        onToggleSelect={(id) => setSelectedIncomeIds((prev) => toggleInSet(prev, id))}
        onConfirmSelected={handleConfirmSelectedIncomes}
      />
    </div>
  )
}
