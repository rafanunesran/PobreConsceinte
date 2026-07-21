import { FirebaseError } from 'firebase/app'

// NOTE: o SDK do Firebase só retorna códigos de erro em inglês
// (ex: "auth/wrong-password"); mapeamos os mais comuns pra PT-BR.
export function mapAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha incorretos.'
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado.'
      case 'auth/popup-closed-by-user':
        return 'Login com Google cancelado.'
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco antes de tentar de novo.'
      default:
        return 'Não foi possível completar a operação. Tente novamente.'
    }
  }
  return 'Não foi possível completar a operação. Tente novamente.'
}
