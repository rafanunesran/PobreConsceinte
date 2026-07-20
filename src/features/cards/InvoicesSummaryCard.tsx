import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'
import type { CardInvoiceMonth } from './invoiceUtils'

interface InvoicesSummaryCardProps {
  offset: number
  onOffsetChange: (offset: number) => void
  month: CardInvoiceMonth
}

function monthLabel(periodEnd: string): string {
  const label = format(new Date(`${periodEnd}T00:00:00`), 'MMMM', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Uma fatura por vez, com todos os cartões juntos — ver computeInvoiceMonth
// em invoiceUtils.ts. As setas trocam o mês (offset relativo a hoje); o
// rótulo de mês vem do primeiro cartão só pra exibição, já que "Fechada"/
// "Aberta" dependem do offset em si, não do mês calendário exato de cada
// cartão.
export function InvoicesSummaryCard({ offset, onOffsetChange, month }: InvoicesSummaryCardProps) {
  const headerPeriodEnd = month.entries[0]?.periodEnd
  const label = headerPeriodEnd ? monthLabel(headerPeriodEnd) : null

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-light-primary dark:text-dark-primary">Faturas</p>
          {label ? (
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              {label}
              {month.status === 'closed' ? (
                <span> · Fechada</span>
              ) : month.status === 'open' ? (
                <span className="text-brand-500"> · Aberta</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Fatura anterior"
            onClick={() => onOffsetChange(offset - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Próxima fatura"
            onClick={() => onOffsetChange(offset + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {month.entries.length === 0 ? (
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          Nenhum cartão cadastrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {month.entries.map((entry) => (
            <div
              key={entry.cardId}
              className="flex items-center justify-between gap-3 rounded-xl border border-border-light px-3 py-2 dark:border-border-dark"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-light-primary dark:text-dark-primary">
                  {entry.cardName}
                  {headerPeriodEnd && entry.periodEnd.slice(0, 7) !== headerPeriodEnd.slice(0, 7) ? (
                    <span className="text-xs text-light-secondary dark:text-dark-secondary">
                      {' '}
                      ({monthLabel(entry.periodEnd)})
                    </span>
                  ) : null}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    entry.amount > 0 ? 'text-danger' : 'text-light-secondary dark:text-dark-secondary',
                  )}
                >
                  {formatBRL(entry.amount)}
                </p>
              </div>
              {offset <= 0 && entry.amount > 0 ? (
                <Link to={`/cartoes/${entry.cardId}/fatura/pagar?offset=${offset}`}>
                  <Button type="button" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs">
                    Pagar
                  </Button>
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
