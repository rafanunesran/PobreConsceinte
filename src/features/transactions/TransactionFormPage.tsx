import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useAccounts } from '../accounts/useAccounts'
import { useCards } from '../cards/useCards'
import { useCategories } from '../categories/useCategories'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { cn } from '../../lib/utils'
import { expenseSchema, incomeSchema, type ExpenseFormData, type IncomeFormData } from './schemas'
import { createTransaction, deleteTransaction, getTransaction, updateTransaction } from './api'
import type { TransactionFormData } from './types'

type Kind = 'despesa' | 'receita'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionFormPage() {
  const navigate = useNavigate()
  const { kind, transactionId } = useParams<{ kind: Kind; transactionId?: string }>()
  const isExpense = kind === 'despesa'
  const isEditMode = Boolean(transactionId)
  const user = useAuthStore((state) => state.user)

  const { accounts } = useAccounts(user?.uid ?? '')
  const { cards } = useCards(user?.uid ?? '')
  const { categories } = useCategories(user?.uid ?? '')
  const relevantCategories = categories.filter((c) => c.type === (isExpense ? 'expense' : 'income'))

  const [formError, setFormError] = useState<string | null>(null)
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(isEditMode)
  const [loadError, setLoadError] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      date: todayISO(),
      description: '',
      categoryId: '',
      linkedType: 'account',
      accountId: '',
      cardId: '',
    },
  })
  const incomeForm = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { amount: 0, date: todayISO(), description: '', categoryId: '', accountId: '' },
  })

  useEffect(() => {
    if (!user || !transactionId) return
    let cancelled = false
    getTransaction(user.uid, transactionId)
      .then((transaction) => {
        if (cancelled) return
        if (!transaction) {
          navigate('/registros', { replace: true })
          return
        }
        if (isExpense) {
          expenseForm.reset({
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.description,
            categoryId: transaction.categoryId,
            linkedType: transaction.accountId !== undefined ? 'account' : 'card',
            accountId: transaction.accountId ?? '',
            cardId: transaction.cardId ?? '',
          })
        } else {
          incomeForm.reset({
            amount: transaction.amount,
            date: transaction.date,
            description: transaction.description,
            categoryId: transaction.categoryId,
            accountId: transaction.accountId ?? '',
          })
        }
        setIsLoadingTransaction(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError(true)
        setIsLoadingTransaction(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, transactionId, isExpense, navigate])

  if (!user) return null

  async function onSubmitExpense(data: ExpenseFormData) {
    if (!user) return
    setFormError(null)
    const payload: TransactionFormData = {
      type: 'expense',
      amount: data.amount,
      date: data.date,
      description: data.description,
      categoryId: data.categoryId,
      ...(data.linkedType === 'account' ? { accountId: data.accountId } : { cardId: data.cardId }),
    }
    try {
      if (transactionId) {
        await updateTransaction(user.uid, transactionId, payload)
      } else {
        await createTransaction(user.uid, payload)
      }
      navigate('/registros')
    } catch {
      setFormError('Não foi possível salvar a despesa. Tente novamente.')
    }
  }

  async function onSubmitIncome(data: IncomeFormData) {
    if (!user) return
    setFormError(null)
    const payload: TransactionFormData = {
      type: 'income',
      amount: data.amount,
      date: data.date,
      description: data.description,
      categoryId: data.categoryId,
      accountId: data.accountId,
    }
    try {
      if (transactionId) {
        await updateTransaction(user.uid, transactionId, payload)
      } else {
        await createTransaction(user.uid, payload)
      }
      navigate('/registros')
    } catch {
      setFormError('Não foi possível salvar a receita. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!user || !transactionId) return
    setIsDeleting(true)
    try {
      await deleteTransaction(user.uid, transactionId)
      navigate('/registros')
    } catch {
      setFormError('Não foi possível excluir. Tente novamente.')
      setIsDeleting(false)
    }
  }

  if (isEditMode && isLoadingTransaction) {
    return (
      <div className="px-6 pt-4 text-sm text-light-secondary dark:text-dark-secondary">
        Carregando...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-4">
        <p className="text-sm text-danger">
          Não foi possível carregar esse registro. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate('/registros')}>
          Voltar
        </Button>
      </div>
    )
  }

  if (relevantCategories.length === 0) {
    return (
      <div className="flex flex-col gap-3 px-6 pt-4">
        <p className="text-sm text-light-secondary dark:text-dark-secondary">
          Você ainda não tem categorias de {isExpense ? 'despesa' : 'receita'}. Crie uma antes de
          continuar.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate('/categorias')}>
          Ir para Categorias
        </Button>
      </div>
    )
  }

  const linkedType = expenseForm.watch('linkedType')

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        {isEditMode ? 'Editar' : 'Nova'} {isExpense ? 'despesa' : 'receita'}
      </h1>

      {isExpense ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={expenseForm.handleSubmit(onSubmitExpense)}
          noValidate
        >
          <Input
            label="Descrição"
            placeholder="Ex: Supermercado"
            error={expenseForm.formState.errors.description?.message}
            {...expenseForm.register('description')}
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            error={expenseForm.formState.errors.amount?.message}
            {...expenseForm.register('amount', { valueAsNumber: true })}
          />
          <Input
            label="Data"
            type="date"
            error={expenseForm.formState.errors.date?.message}
            {...expenseForm.register('date')}
          />
          <Select
            label="Categoria"
            error={expenseForm.formState.errors.categoryId?.message}
            {...expenseForm.register('categoryId')}
          >
            <option value="">Selecione</option>
            {relevantCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-light-secondary dark:text-dark-secondary">Pago com</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => expenseForm.setValue('linkedType', 'account', { shouldValidate: true })}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  linkedType === 'account'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                )}
              >
                Conta
              </button>
              <button
                type="button"
                onClick={() => expenseForm.setValue('linkedType', 'card', { shouldValidate: true })}
                className={cn(
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200',
                  linkedType === 'card'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-border-light text-light-secondary dark:border-border-dark dark:text-dark-secondary',
                )}
              >
                Cartão
              </button>
            </div>
            {expenseForm.formState.errors.linkedType ? (
              <span className="text-sm text-danger">
                {expenseForm.formState.errors.linkedType.message}
              </span>
            ) : null}
          </div>

          {linkedType === 'account' ? (
            <Select label="Conta" {...expenseForm.register('accountId')}>
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select label="Cartão" {...expenseForm.register('cardId')}>
              <option value="">Selecione</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </Select>
          )}

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <Button type="submit" disabled={expenseForm.formState.isSubmitting}>
            {expenseForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={incomeForm.handleSubmit(onSubmitIncome)}
          noValidate
        >
          <Input
            label="Descrição"
            placeholder="Ex: Salário"
            error={incomeForm.formState.errors.description?.message}
            {...incomeForm.register('description')}
          />
          <Input
            label="Valor"
            type="number"
            step="0.01"
            error={incomeForm.formState.errors.amount?.message}
            {...incomeForm.register('amount', { valueAsNumber: true })}
          />
          <Input
            label="Data"
            type="date"
            error={incomeForm.formState.errors.date?.message}
            {...incomeForm.register('date')}
          />
          <Select
            label="Categoria"
            error={incomeForm.formState.errors.categoryId?.message}
            {...incomeForm.register('categoryId')}
          >
            <option value="">Selecione</option>
            {relevantCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select
            label="Conta"
            error={incomeForm.formState.errors.accountId?.message}
            {...incomeForm.register('accountId')}
          >
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>

          {formError ? <p className="text-sm text-danger">{formError}</p> : null}

          <Button type="submit" disabled={incomeForm.formState.isSubmitting}>
            {incomeForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </form>
      )}

      {isEditMode ? (
        <div className="border-t border-border-light pt-4 dark:border-border-dark">
          {confirmingDelete ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-light-secondary dark:text-dark-secondary">
                Tem certeza? Essa ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-danger hover:bg-danger hover:shadow-none"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Excluir
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
