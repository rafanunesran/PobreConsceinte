import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const signUpSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type SignUpFormData = z.infer<typeof signUpSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
