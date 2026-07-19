import { z } from 'zod'
import { CARD_BRANDS } from './types'

export const cardSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(40, 'Máximo de 40 caracteres'),
  brand: z.enum(CARD_BRANDS, 'Selecione uma bandeira'),
  limit: z.number('Informe um valor válido').nonnegative('Informe um valor válido'),
  closingDay: z
    .number('Informe um dia válido')
    .int('Informe um dia válido')
    .min(1, 'Entre 1 e 31')
    .max(31, 'Entre 1 e 31'),
  dueDay: z
    .number('Informe um dia válido')
    .int('Informe um dia válido')
    .min(1, 'Entre 1 e 31')
    .max(31, 'Entre 1 e 31'),
})

export type CardFormData = z.infer<typeof cardSchema>
