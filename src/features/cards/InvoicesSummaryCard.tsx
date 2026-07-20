import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'
import type { CardInvoiceWindow } from './invoiceUtils'

interface InvoicesSummaryCardProps {
  baseOffset: number
  onBaseOffsetChange: (offset: number) => void
  windows: CardInvoiceWindow[]
}

function monthLabel(periodEnd: string): string {
  const label = format(new Date(`${periodEnd}T00:00:00`), 'MMMM', { locale: ptBR })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Janela fixa por cartão: a fatura que fechou mais recentemente, a aberta
// (que ainda vai fechar) e as próximas projetadas — ver computeInvoiceWindows
// em invoiceUtils.ts. As setas deslocam a janela inteira pra frente/trás,
// tipo uma faixa móvel; "Fechada"/"Aberta" continuam corretas mesmo assim
// porque o status vem calculado relativo a hoje, não à posição da janela.
export function InvoicesSummaryCard({ baseOffset, onBaseOffsetChange, windows }: InvoicesSummaryCardProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-light-primary dark:text-dark-primary">Faturas</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Faturas anteriores"
            onClick={() => onBaseOffsetChange(baseOffset - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            aria-label="Próximas faturas"
            onClick={() => onBaseOffsetChange(baseOffset + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border-light text-light-secondary transition-colors duration-200 hover:text-light-primary dark:border-border-dark dark:text-dark-secondary dark:hover:text-dark-primary"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {windows.length === 0 ? (
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          Nenhum cartão cadastrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {windows.map((window) => (
            <div key={window.cardId} className="flex flex-col gap-2">
              <p className="truncate text-xs font-medium text-light-secondary dark:text-dark-secondary">
                {window.cardName}
              </p>
              <div className="flex flex-col gap-1.5">
                {window.entries.map((entry) => (
                  <div
                    key={entry.offset}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-light px-3 py-2 dark:border-border-dark"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-light-primary dark:text-dark-primary">
                        {monthLabel(entry.periodEnd)}
                        {entry.status === 'closed' ? (
                          <span className="text-light-secondary dark:text-dark-secondary"> · Fechada</span>
                        ) : entry.status === 'open' ? (
                          <span className="text-brand-500"> · Aberta</span>
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
                    {entry.offset <= 0 && entry.amount > 0 ? (
                      <Link to={`/cartoes/${window.cardId}/fatura/pagar?offset=${entry.offset}`}>
                        <Button type="button" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs">
                          Pagar
                        </Button>
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
