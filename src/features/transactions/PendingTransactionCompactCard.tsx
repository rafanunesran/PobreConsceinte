import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, CircleDashed } from 'lucide-react'
import { CATEGORY_ICON_COMPONENTS } from '../categories/types'
import type { Category } from '../categories/types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { cn, formatBRL } from '../../lib/utils'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { useUserProfiles } from '../family/useUserProfiles'
import type { Transaction } from './types'

interface PendingTransactionCompactCardProps {
  transaction: Transaction
  category: Category | undefined
  confirming: boolean
  onConfirm: () => void
  selected: boolean
  onToggleSelect: () => void
}

export function PendingTransactionCompactCard({
  transaction,
  category,
  confirming,
  onConfirm,
  selected,
  onToggleSelect,
}: PendingTransactionCompactCardProps) {
  const Icon = category ? CATEGORY_ICON_COMPONENTS[category.icon] : CircleDashed
  const family = useWorkspaceStore((state) => state.family)
  const profiles = useUserProfiles(family ? [transaction.createdBy] : [])
  const authorName = family ? profiles.get(transaction.createdBy)?.displayName : undefined

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
        <p className="text-xs text-light-secondary dark:text-dark-secondary">
          {format(new Date(`${transaction.date}T00:00:00`), "d 'de' MMM", { locale: ptBR })}
          {authorName ? ` · ${authorName}` : ''}
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
      <Button
        type="button"
        variant="secondary"
        className="w-full gap-1 px-2 py-1.5 text-xs"
        disabled={confirming}
        onClick={onConfirm}
      >
        <CheckCircle2 size={14} />
        {confirming ? 'Salvando' : transaction.type === 'expense' ? 'Pago' : 'Recebido'}
      </Button>
    </Card>
  )
}
