import { useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { cn, formatBRL } from '../../lib/utils'
import { effectiveMonth } from '../cards/invoiceUtils'
import type { CreditCard } from '../cards/types'
import type { Transaction } from './types'

interface BalanceteCardProps {
  transactions: Transaction[]
  selectedMonth: string // 'YYYY-MM'
  cardsById: Map<string, CreditCard>
}

export function BalanceteCard({ transactions, selectedMonth, cardsById }: BalanceteCardProps) {
  const balancete = useMemo(() => {
    // Pago/recebido já são fatos consumados — usam a data real do
    // movimento. A pagar/a receber ainda não aconteceram: pra cartão, só
    // fazem sentido no mês de VENCIMENTO da fatura (pode ser diferente do
    // mês da compra), não na data da compra em si.
    const paidOfMonth = transactions.filter((t) => t.paid && t.date.startsWith(selectedMonth))
    const unpaidOfMonth = transactions.filter(
      (t) => !t.paid && effectiveMonth(t, cardsById) === selectedMonth,
    )

    const recebido = paidOfMonth
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const pago = paidOfMonth
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    const aReceber = unpaidOfMonth
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const aPagar = unpaidOfMonth
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return { recebido, pago, aReceber, aPagar, resultado: recebido - pago }
  }, [transactions, selectedMonth, cardsById])

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
        Balancete do mês
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <p className="text-light-secondary dark:text-dark-secondary">Recebido</p>
          <p className="truncate font-semibold text-brand-500">{formatBRL(balancete.recebido)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-light-secondary dark:text-dark-secondary">Pago</p>
          <p className="truncate font-semibold text-danger">{formatBRL(balancete.pago)}</p>
        </div>
        <div className="min-w-0">
          <p className="text-light-secondary dark:text-dark-secondary">A receber</p>
          <p className="truncate font-semibold text-light-primary dark:text-dark-primary">
            {formatBRL(balancete.aReceber)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-light-secondary dark:text-dark-secondary">A pagar</p>
          <p className="truncate font-semibold text-light-primary dark:text-dark-primary">
            {formatBRL(balancete.aPagar)}
          </p>
        </div>
      </div>
      <div className="min-w-0 border-t border-border-light pt-3 dark:border-border-dark">
        <p className="text-light-secondary dark:text-dark-secondary">Resultado</p>
        <p
          className={cn(
            'truncate text-lg font-semibold',
            balancete.resultado >= 0 ? 'text-brand-500' : 'text-danger',
          )}
        >
          {formatBRL(balancete.resultado)}
        </p>
      </div>
    </Card>
  )
}
