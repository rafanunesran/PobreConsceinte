import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../../stores/authStore'
import { useWorkspaceStore } from '../../stores/workspaceStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { cardSchema, type CardFormData } from './schemas'
import { CARD_BRANDS, CARD_BRAND_LABELS } from './types'
import { createCard, deleteCard, getCard, updateCard } from './api'

export function CardFormPage() {
  const navigate = useNavigate()
  const { cardId } = useParams<{ cardId?: string }>()
  const isEditMode = Boolean(cardId)
  const user = useAuthStore((state) => state.user)
  const workspaceId = useWorkspaceStore((state) => state.workspaceId)

  const [formError, setFormError] = useState<string | null>(null)
  const [isLoadingCard, setIsLoadingCard] = useState(isEditMode)
  const [loadError, setLoadError] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: { name: '', brand: 'visa', limit: 0, closingDay: 1, dueDay: 10 },
  })

  useEffect(() => {
    if (!workspaceId || !cardId) return
    let cancelled = false
    getCard(workspaceId, cardId)
      .then((card) => {
        if (cancelled) return
        if (!card) {
          navigate('/cartoes', { replace: true })
          return
        }
        form.reset({
          name: card.name,
          brand: card.brand,
          limit: card.limit,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
        })
        setIsLoadingCard(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoadError(true)
        setIsLoadingCard(false)
      })
    return () => {
      cancelled = true
    }
  }, [workspaceId, cardId, form, navigate])

  if (!user || !workspaceId) return null

  async function onSubmit(data: CardFormData) {
    if (!user || !workspaceId) return
    setFormError(null)
    try {
      if (cardId) {
        await updateCard(workspaceId, cardId, data)
      } else {
        await createCard(workspaceId, data, user.uid)
      }
      navigate('/cartoes')
    } catch {
      setFormError('Não foi possível salvar o cartão. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!workspaceId || !cardId) return
    setIsDeleting(true)
    try {
      await deleteCard(workspaceId, cardId)
      navigate('/cartoes')
    } catch {
      setFormError('Não foi possível excluir o cartão. Tente novamente.')
      setIsDeleting(false)
    }
  }

  if (isEditMode && isLoadingCard) {
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
          Não foi possível carregar esse cartão. Verifique sua conexão ou tente novamente mais
          tarde.
        </p>
        <Button type="button" variant="secondary" onClick={() => navigate('/cartoes')}>
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-6 pt-4">
      <h1 className="text-xl font-semibold text-light-primary dark:text-dark-primary">
        {isEditMode ? 'Editar cartão' : 'Novo cartão'}
      </h1>

      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nome"
          placeholder="Ex: Nubank Ultravioleta"
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Select
          label="Bandeira"
          error={form.formState.errors.brand?.message}
          {...form.register('brand')}
        >
          {CARD_BRANDS.map((brand) => (
            <option key={brand} value={brand}>
              {CARD_BRAND_LABELS[brand]}
            </option>
          ))}
        </Select>
        <Input
          label="Limite"
          type="number"
          step="0.01"
          error={form.formState.errors.limit?.message}
          {...form.register('limit', { valueAsNumber: true })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Dia de fechamento"
            type="number"
            min={1}
            max={31}
            error={form.formState.errors.closingDay?.message}
            {...form.register('closingDay', { valueAsNumber: true })}
          />
          <Input
            label="Dia de vencimento"
            type="number"
            min={1}
            max={31}
            error={form.formState.errors.dueDay?.message}
            {...form.register('dueDay', { valueAsNumber: true })}
          />
        </div>

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
              Excluir cartão
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
