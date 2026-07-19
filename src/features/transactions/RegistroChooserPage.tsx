import { Link } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

export function RegistroChooserPage() {
  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        Novo registro
      </h1>

      <div className="flex flex-col gap-3">
        <Link
          to="/registros/despesa/nova"
          className="flex items-center gap-4 rounded-2xl border border-border-light bg-surface-light p-4 transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
            <ArrowDownCircle size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Nova despesa</p>
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              Vinculada a uma conta ou cartão
            </p>
          </div>
        </Link>

        <Link
          to="/registros/receita/nova"
          className="flex items-center gap-4 rounded-2xl border border-border-light bg-surface-light p-4 transition-colors duration-200 hover:border-brand-500 dark:border-border-dark dark:bg-surface-dark-elevated"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
            <ArrowUpCircle size={24} />
          </span>
          <div>
            <p className="font-medium text-light-primary dark:text-dark-primary">Nova receita</p>
            <p className="text-sm text-light-secondary dark:text-dark-secondary">
              Vinculada a uma conta
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
