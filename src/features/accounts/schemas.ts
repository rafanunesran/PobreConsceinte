import { z } from 'zod'
import { ACCOUNT_TYPES } from './types'

// NOTE: balance é editado manualmente pelo usuário nesta fase — ainda não
// existe ledger de transações que recalcule o saldo automaticamente (fica
// pra uma fase futura).
export const accountSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(40, 'Máximo de 40 caracteres'),
  type: z.enum(ACCOUNT_TYPES, 'Selecione um tipo'),
  balance: z.number('Informe um valor válido'),
})

export type AccountFormData = z.infer<typeof accountSchema>
