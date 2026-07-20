import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Receipt } from 'lucide-react'
import { CATEGORY_ICON_COMPONENTS } from '../categories/types'
import type { Category } from '../categories/types'
import { Card } from '../../components/ui/Card'
import { cn, formatBRL } from '../../lib/utils'
import type { Transaction } from './types'

interface TransactionCompactCardProps {
  transaction: Transaction
  category: Category | undefined
  linkedName: string | undefined
}

export function TransactionCompactCard({ transaction, category, linkedName }: TransactionCompactCardProps) {
  const Icon = category ? CATEGORY_ICON_COMPONENTS[category.icon] : Receipt
  const kind = transaction.type === 'expense' ? 'despesa' : 'receita'

  return (
    <Link to={`/registros/${kind}/${transaction.id}/editar`}>
      <Card className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: category?.color ?? '#6B7280' }}
          >
            <Icon size={14} />
          </span>
          <p className="truncate text-sm font-medium text-light-primary dark:text-dark-primary">
            {transaction.description}
          </p>
        </div>
        <div>
          <p className="truncate text-xs text-light-secondary dark:text-dark-secondary">
            {format(new Date(`${transaction.date}T00:00:00`), "d 'de' MMM", { locale: ptBR })}
            {linkedName ? ` · ${linkedName}` : ''}
          </p>
          <p
            className={cn(
              'text-sm font-semibold',
              transaction.type === 'expense' ? 'text-danger' : 'text-brand-500',
            )}
          >
            {transaction.type === 'expense' ? '-' : '+'}
            {formatBRL(transaction.amount)}
          </p>
        </div>
      </Card>
    </Link>
  )
}
