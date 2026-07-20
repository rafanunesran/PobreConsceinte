import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard as CreditCardIcon } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { cn, formatBRL } from '../../lib/utils'
import type { CardInvoiceGroup } from './invoiceUtils'

function formatDisplayDate(date: string): string {
  return format(new Date(`${date}T00:00:00`), "d 'de' MMM", { locale: ptBR })
}

interface CardInvoiceRowCardProps {
  group: CardInvoiceGroup
}

// Representa TODA a fatura de um cartão (cartão + período de fechamento)
// como um único registro no extrato geral, em vez de uma linha por compra
// — ver groupCardTransactionsByInvoice em invoiceUtils.ts. Clica e vai
// direto pra fatura correspondente (periodOffset já calculado no grupo).
export function CardInvoiceRowCard({ group }: CardInvoiceRowCardProps) {
  return (
    <Link to={`/cartoes/${group.cardId}/fatura?offset=${group.periodOffset}`}>
      <Card className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <CreditCardIcon size={14} />
          </span>
          <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
            Fatura {group.cardName}
          </p>
        </div>
        <div>
          <p className="truncate text-xs text-light-secondary dark:text-dark-secondary">
            Vence {formatDisplayDate(group.dueDate)}
          </p>
          <p
            className={cn('text-sm font-semibold', group.amount >= 0 ? 'text-danger' : 'text-brand-500')}
          >
            {group.amount >= 0 ? '-' : '+'}
            {formatBRL(Math.abs(group.amount))}
          </p>
        </div>
      </Card>
    </Link>
  )
}
