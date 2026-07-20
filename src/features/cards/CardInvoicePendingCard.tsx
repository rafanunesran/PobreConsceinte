import { Link } from 'react-router-dom'
import { CreditCard as CreditCardIcon } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'

interface CardInvoicePendingCardProps {
  cardId: string
  cardName: string
  amount: number
}

// Representa a fatura ABERTA de um cartão como um item só em "Despesas
// pendentes" — em vez de uma linha por compra do cartão. Pagar sempre abre
// a fatura aberta (offset 0), que é exatamente o valor sendo somado aqui.
export function CardInvoicePendingCard({ cardId, cardName, amount }: CardInvoicePendingCardProps) {
  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
          <CreditCardIcon size={14} />
        </span>
        <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
          Fatura {cardName}
        </p>
      </div>
      <p className="text-sm font-semibold text-danger">-{formatBRL(amount)}</p>
      <Link to={`/cartoes/${cardId}/fatura/pagar?offset=0`}>
        <Button type="button" variant="secondary" className="w-full px-2 py-1.5 text-xs">
          Pagar
        </Button>
      </Link>
    </Card>
  )
}
