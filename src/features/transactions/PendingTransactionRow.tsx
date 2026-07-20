import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CircleDashed } from 'lucide-react'
import { CATEGORY_ICON_COMPONENTS } from '../categories/types'
import type { Category } from '../categories/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { formatBRL } from '../../lib/utils'
import type { Transaction } from './types'

interface PendingTransactionRowProps {
  transaction: Transaction
  category: Category | undefined
  confirming: boolean
  onConfirm: () => void
}

export function PendingTransactionRow({
  transaction,
  category,
  confirming,
  onConfirm,
}: PendingTransactionRowProps) {
  const Icon = category ? CATEGORY_ICON_COMPONENTS[category.icon] : CircleDashed

  return (
    <Card className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: category?.color ?? '#6B7280' }}
      >
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-light-primary dark:text-dark-primary">
          {transaction.description}
        </p>
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          {format(new Date(`${transaction.date}T00:00:00`), "d 'de' MMM", { locale: ptBR })}
          {' · '}
          {transaction.type === 'expense' ? '-' : '+'}
          {formatBRL(transaction.amount)}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="shrink-0"
        disabled={confirming}
        onClick={onConfirm}
      >
        {confirming ? 'Salvando...' : transaction.type === 'expense' ? 'Marcar como pago' : 'Marcar como recebido'}
      </Button>
    </Card>
  )
}
