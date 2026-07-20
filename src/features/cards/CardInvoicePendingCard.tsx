import { Link } from 'react-router-dom'
import { CreditCard as CreditCardIcon } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'

interface CardInvoicePendingCardProps {
  cardId: string
  cardName: string
  amount: number
  periodOffset: number
  selected: boolean
  onToggleSelect: () => void
}

// Representa UMA fatura de cartão (não necessariamente a aberta — pode ser
// uma já vencida ou uma futura, ver groupCardTransactionsByInvoice) como um
// item só em "Despesas pendentes", em vez de uma linha por compra do
// cartão. O checkbox só entra na soma exibida no cabeçalho da coluna — a
// fatura continua sendo paga pelo fluxo dedicado (precisa escolher a conta
// de origem), não pelo "Pagar (N)" genérico dos itens de conta.
export function CardInvoicePendingCard({
  cardId,
  cardName,
  amount,
  periodOffset,
  selected,
  onToggleSelect,
}: CardInvoicePendingCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          aria-label="Selecionar"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 shrink-0 accent-brand-500"
        />
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
          <CreditCardIcon size={14} />
        </span>
        <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
          Fatura {cardName}
        </p>
      </div>
      <p className="text-sm font-semibold text-danger">-{formatBRL(amount)}</p>
      <Link to={`/cartoes/${cardId}/fatura/pagar?offset=${periodOffset}`}>
        <Button type="button" variant="secondary" className="w-full px-2 py-1.5 text-xs">
          Pagar
        </Button>
      </Link>
    </Card>
  )
}
