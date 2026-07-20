import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'

export interface InvoiceRow {
  cardId: string
  cardName: string
  periodOwed: number
}

interface InvoicesSummaryCardProps {
  view: 'aberta' | 'fechada'
  onViewChange: (view: 'aberta' | 'fechada') => void
  rows: InvoiceRow[]
  total: number
}

export function InvoicesSummaryCard({ view, onViewChange, rows, total }: InvoicesSummaryCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">Faturas</p>
        <div className="flex gap-2">
          {(['aberta', 'fechada'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onViewChange(option)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all duration-200',
                view === option
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
              )}
            >
              {option}
            </button>
          ))}
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
              {row.periodOwed > 0 ? (
                <Link to={`/cartoes/${row.cardId}/fatura/pagar?period=${view}`}>
                  <Button type="button" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs">
                    Pagar
                  </Button>
                </Link>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-xs text-brand-500">
                  <CheckCircle2 size={14} />
                  Em dia
                </span>
              )}
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
