import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { accountSchema, type AccountFormData } from './schemas'
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS } from './types'
import { createAccount, deleteAccount, getAccount, updateAccount } from './api'

export function AccountFormPage() {
  const navigate = useNavigate()
  const { accountId } = useParams<{ accountId?: string }>()
  const isEditMode = Boolean(accountId)
  const user = useAuthStore((state) => state.user)

  const [formError, setFormError] = useState<string | null>(null)
  const [isLoadingAccount, setIsLoadingAccount] = useState(isEditMode)
  const [loadError, setLoadError] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', type: 'corrente', balance: 0 },
  })

  useEffect(() => {
    if (!user || !accountId) return
    let cancelled = false
    getAccount(user.uid, accountId)
      .then((account) => {
        if (cancelled) return
        if (!account) {
          navigate('/contas', { replace: true })
          return
        }
        form.reset({ name: account.name, type: account.type, balance: account.balance })
        setIsLoadingAccount(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError(true)
        setIsLoadingAccount(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, accountId, form, navigate])

  if (!user) return null

  async function onSubmit(data: AccountFormData) {
    if (!user) return
    setFormError(null)
    try {
      if (accountId) {
        await updateAccount(user.uid, accountId, data)
      } else {
        await createAccount(user.uid, data)
      }
      navigate('/contas')
    } catch {
      setFormError('Não foi possível salvar a conta. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!user || !accountId) return
    setIsDeleting(true)
    try {
      await deleteAccount(user.uid, accountId)
      navigate('/contas')
    } catch {
      setFormError('Não foi possível excluir a conta. Tente novamente.')
      setIsDeleting(false)
    }
  }

  if (isEditMode && isLoadingAccount) {
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
          Não foi possível carregar essa conta. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate('/contas')}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        {isEditMode ? 'Editar conta' : 'Nova conta'}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nome"
          placeholder="Ex: Nubank, Carteira..."
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Select label="Tipo" error={form.formState.errors.type?.message} {...form.register('type')}>
          {ACCOUNT_TYPES.map((type) => (
            <option key={type} value={type}>
              {ACCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <Input
          label="Saldo"
          type="number"
          step="0.01"
          error={form.formState.errors.balance?.message}
          {...form.register('balance', { valueAsNumber: true })}
        />

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>

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
              Excluir conta
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
