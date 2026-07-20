import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'
import type { CardInvoiceRow } from './invoiceUtils'

interface InvoicesSummaryCardProps {
  periodOffset: number
  onPeriodOffsetChange: (offset: number) => void
  rows: CardInvoiceRow[]
  total: number
}

function offsetLabel(offset: number): string {
  if (offset === 0) return 'Fatura atual'
  if (offset < 0) return `${-offset} fatura${offset < -1 ? 's' : ''} atrás`
  return `Em ${offset} fatura${offset > 1 ? 's' : ''}`
}

export function InvoicesSummaryCard({
  periodOffset,
  onPeriodOffsetChange,
  rows,
  total,
}: InvoicesSummaryCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">Faturas</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Fatura anterior"
            onClick={() => onPeriodOffsetChange(periodOffset - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="min-w-[7rem] text-center text-xs text-light-secondary dark:text-dark-secondary">
            {offsetLabel(periodOffset)}
          </span>
          <button
            type="button"
            aria-label="Próxima fatura"
            onClick={() => onPeriodOffsetChange(periodOffset + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          Nenhum cartão cadastrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.cardId}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-light px-3 py-2.5 dark:border-border-dark"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
                  {row.cardName}
                </p>
                <p className="text-sm text-light-secondary dark:text-dark-secondary">
                  {formatBRL(row.periodOwed)}
                </p>
              </div>
              {periodOffset <= 0 && row.periodOwed > 0 ? (
                <Link to={`/cartoes/${row.cardId}/fatura/pagar?offset=${periodOffset}`}>
                  <Button type="button" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs">
                    Pagar
                  </Button>
                </Link>
              ) : periodOffset <= 0 ? (
                <span className="flex shrink-0 items-center gap-1 text-xs text-brand-500">
                  <CheckCircle2 size={14} />
                  Em dia
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border-light pt-3 dark:border-border-dark">
        <p className="text-sm text-light-secondary dark:text-dark-secondary">Total</p>
        <p className="text-lg font-semibold text-light-primary dark:text-dark-primary">
          {formatBRL(total)}
        </p>
      </div>
    </Card>
  )
}
