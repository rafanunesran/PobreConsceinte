import { Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { ACCOUNT_TYPE_LABELS, type Account } from './types'
import { Card } from '../../components/ui/Card'
import { formatBRL } from '../../lib/utils'

interface AccountTileProps {
  account: Account
}

export function AccountTile({ account }: AccountTileProps) {
  return (
    <div className="relative">
      <Link
        to={`/contas/${account.id}/editar`}
        aria-label="Editar conta"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-light-secondary transition-colors duration-200 hover:text-light-primary dark:text-dark-secondary dark:hover:text-dark-primary"
      >
        <Settings size={16} />
      </Link>
      <Link to={`/contas/${account.id}`} className="block">
        <Card className="transition-all duration-200 hover:border-brand-500">
          <p className="text-sm text-light-secondary dark:text-dark-secondary">
            {ACCOUNT_TYPE_LABELS[account.type]}
          </p>
          <p className="mt-1 pr-8 font-medium text-light-primary dark:text-dark-primary">
            {account.name}
          </p>
          <p className="mt-3 text-xl font-semibold text-light-primary dark:text-dark-primary">
            {formatBRL(account.balance)}
          </p>
        </Card>
      </Link>
    </div>
  )
}
