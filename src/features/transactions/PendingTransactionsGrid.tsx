import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useCategories } from '../categories/useCategories'
import { useConfirmPending } from './useConfirmPending'
import { PendingTransactionCompactCard } from './PendingTransactionCompactCard'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'
import { useCards } from '../cards/useCards'
import { CardInvoicePendingCard } from '../cards/CardInvoicePendingCard'
import { groupCardTransactionsByInvoice, type CardInvoiceGroup } from '../cards/invoiceUtils'
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
  extraRows?: CardInvoiceGroup[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onConfirmSelected: () => void
  selectedExtraIds?: Set<string>
  onToggleExtraSelect?: (cardId: string) => void
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
  selectedExtraIds,
  onToggleExtraSelect,
}: PendingColumnProps) {
  const hasExtraRows = extraRows !== undefined && extraRows.length > 0
  const selectedItemsTotal = items
    .filter((t) => selectedIds.has(t.id))
    .reduce((sum, t) => sum + t.amount, 0)
  const selectedExtraTotal = (extraRows ?? [])
    .filter((row) => selectedExtraIds?.has(row.cardId))
    .reduce((sum, row) => sum + row.unpaidAmount, 0)
  const selectedTotal = selectedItemsTotal + selectedExtraTotal
  const hasAnySelection = selectedIds.size > 0 || (selectedExtraIds?.size ?? 0) > 0
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
        {hasAnySelection ? (
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-xs font-semibold text-light-primary dark:text-dark-primary">
              {formatBRL(selectedTotal)}
            </span>
            {selectedIds.size > 0 ? (
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 px-2 py-1 text-xs"
                disabled={isConfirmingSelected}
                onClick={onConfirmSelected}
              >
                {isConfirmingSelected ? 'Pagando' : `Pagar (${selectedIds.size})`}
              </Button>
            ) : null}
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
                  key={`${row.cardId}-${row.period.end}`}
                  cardId={row.cardId}
                  cardName={row.cardName}
                  amount={row.unpaidAmount}
                  periodOffset={row.periodOffset}
                  selected={selectedExtraIds?.has(row.cardId) ?? false}
                  onToggleSelect={() => onToggleExtraSelect?.(row.cardId)}
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
  const [selectedCardInvoiceIds, setSelectedCardInvoiceIds] = useState<Set<string>>(new Set())

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])

  // Cartão nunca entra na lista individual — sempre representado pelo card
  // agregado "Fatura {nome}" (ver groupCardTransactionsByInvoice), alocado
  // pelo mês de VENCIMENTO da fatura, não pela data da compra. Isso vale
  // pra qualquer mês navegado, não só o vigente: uma fatura futura ou já
  // vencida aparece igual, no mês em que vence.
  const { expenses, incomes } = useMemo(() => {
    const pendingOfMonth = transactions.filter(
      (t) => !t.paid && t.accountId !== undefined && t.date.startsWith(selectedMonth),
    )
    return {
      expenses: pendingOfMonth.filter((t) => t.type === 'expense'),
      incomes: pendingOfMonth.filter((t) => t.type === 'income'),
    }
  }, [transactions, selectedMonth])

  // Só o que ainda está em aberto (>0) — um saldo credor de cartão sem
  // nenhuma cobrança pendente pra abater não é "a pagar" de verdade, e não
  // dá pra "Pagar" uma fatura sem valor devido (payCardInvoice exige
  // owed > 0), então nem faz sentido esse card aparecer aqui.
  const cardInvoiceRows = useMemo(() => {
    const allGroups = groupCardTransactionsByInvoice(transactions, cards)
    return allGroups.filter((g) => g.dueMonth === selectedMonth && g.unpaidAmount > 0)
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
        selectedExtraIds={selectedCardInvoiceIds}
        onToggleExtraSelect={(cardId) => setSelectedCardInvoiceIds((prev) => toggleInSet(prev, cardId))}
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
