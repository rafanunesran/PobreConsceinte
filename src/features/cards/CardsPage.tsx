import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard as CreditCardIcon, Plus } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useCards } from './useCards'
import { useTransactions } from '../transactions/useTransactions'
import { CardsTotalCard } from './CardsTotalCard'
import { InvoicesSummaryCard, type InvoiceRow } from './InvoicesSummaryCard'
import { CardTile } from './CardTile'
import {
  cardOccupiedLimit,
  getInvoicePeriod,
  previousInvoicePeriod,
  sumUnpaid,
  todayDateString,
  transactionsInPeriod,
} from './invoiceUtils'
import { Button } from '../../components/ui/Button'

export function CardsPage() {
  const user = useAuthStore((state) => state.user)
  // NOTE: hooks não podem ser condicionais — chama sempre, com uid vazio se
  // `user` ainda não resolveu, e só corta a renderização depois.
  const { cards, loading, error } = useCards(user?.uid ?? '')
  const { transactions } = useTransactions(user?.uid ?? '')
  const [invoiceView, setInvoiceView] = useState<'aberta' | 'fechada'>('aberta')

  const occupiedByCard = useMemo(() => {
    const map = new Map<string, number>()
    for (const card of cards) map.set(card.id, cardOccupiedLimit(transactions, card.id))
    return map
  }, [cards, transactions])

  const { totalLimit, totalOccupied, totalAvailable } = useMemo(() => {
    const limit = cards.reduce((sum, card) => sum + card.limit, 0)
    const occupied = cards.reduce((sum, card) => sum + (occupiedByCard.get(card.id) ?? 0), 0)
    return { totalLimit: limit, totalOccupied: occupied, totalAvailable: limit - occupied }
  }, [cards, occupiedByCard])

  const { rows, invoicesTotal } = useMemo(() => {
    const today = todayDateString()
    const invoiceRows: InvoiceRow[] = cards.map((card) => {
      const openPeriod = getInvoicePeriod(card.closingDay, today)
      const period = invoiceView === 'aberta' ? openPeriod : previousInvoicePeriod(card.closingDay, openPeriod)
      const owed = sumUnpaid(transactionsInPeriod(transactions, card.id, period))
      return { cardId: card.id, cardName: card.name, periodOwed: owed }
    })
    return { rows: invoiceRows, invoicesTotal: invoiceRows.reduce((sum, row) => sum + row.periodOwed, 0) }
  }, [cards, transactions, invoiceView])

  // Só renderiza atrás de <ProtectedRoute>, `user` nunca deveria ser null
  // aqui de verdade — o guard é só pro TS não reclamar.
  if (!user) return null

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
          Cartões
        </h1>
        <Link to="/cartoes/novo">
          <Button type="button" className="gap-1.5">
            <Plus size={18} />
            Novo cartão
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border-light bg-surface-light dark:border-border-dark dark:bg-surface-dark-elevated"
            />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          Não foi possível carregar seus cartões. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-light py-16 text-center dark:border-border-dark">
          <CreditCardIcon size={32} className="text-light-secondary dark:text-dark-secondary" />
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            Nenhum cartão ainda.
          </p>
          <Link to="/cartoes/novo">
            <Button type="button" variant="secondary">
              Adicionar o primeiro cartão
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="lg:w-1/4">
            <CardsTotalCard
              totalLimit={totalLimit}
              totalOccupied={totalOccupied}
              totalAvailable={totalAvailable}
            />
          </div>

          <div className="flex flex-col gap-6 lg:w-3/4">
            <InvoicesSummaryCard
              view={invoiceView}
              onViewChange={setInvoiceView}
              rows={rows}
              total={invoicesTotal}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  occupied={occupiedByCard.get(card.id) ?? 0}
                  available={card.limit - (occupiedByCard.get(card.id) ?? 0)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
