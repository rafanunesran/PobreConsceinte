import { useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { cn, formatBRL } from '../../lib/utils'
import type { Transaction } from './types'

interface BalanceteCardProps {
  transactions: Transaction[]
  selectedMonth: string // 'YYYY-MM'
}

export function BalanceteCard({ transactions, selectedMonth }: BalanceteCardProps) {
  const balancete = useMemo(() => {
    const ofMonth = transactions.filter((t) => t.date.startsWith(selectedMonth))
    const sum = (predicate: (t: (typeof ofMonth)[number]) => boolean) =>
      ofMonth.filter(predicate).reduce((acc, t) => acc + t.amount, 0)

    const recebido = sum((t) => t.type === 'income' && t.paid)
    const pago = sum((t) => t.type === 'expense' && t.paid)
    const aReceber = sum((t) => t.type === 'income' && !t.paid)
    const aPagar = sum((t) => t.type === 'expense' && !t.paid)

    return { recebido, pago, aReceber, aPagar, resultado: recebido - pago }
  }, [transactions, selectedMonth])

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-medium text-light-primary dark:text-dark-primary">
        Balancete do mês
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-light-secondary dark:text-dark-secondary">Recebido</p>
          <p className="font-semibold text-brand-500">{formatBRL(balancete.recebido)}</p>
        </div>
        <div>
          <p className="text-light-secondary dark:text-dark-secondary">Pago</p>
          <p className="font-semibold text-danger">{formatBRL(balancete.pago)}</p>
        </div>
        <div>
          <p className="text-light-secondary dark:text-dark-secondary">A receber</p>
          <p className="font-semibold text-light-primary dark:text-dark-primary">
            {formatBRL(balancete.aReceber)}
          </p>
        </div>
        <div>
          <p className="text-light-secondary dark:text-dark-secondary">A pagar</p>
          <p className="font-semibold text-light-primary dark:text-dark-primary">
            {formatBRL(balancete.aPagar)}
          </p>
        </div>
      </div>
      <div className="border-t border-border-light pt-3 dark:border-border-dark">
        <p className="text-light-secondary dark:text-dark-secondary">Resultado</p>
        <p
          className={cn(
            'text-lg font-semibold',
            balancete.resultado >= 0 ? 'text-brand-500' : 'text-danger',
          )}
        >
          {formatBRL(balancete.resultado)}
        </p>
      </div>
    </Card>
  )
}
