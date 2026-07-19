import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

// NOTE: só Auth é inicializado nesta fase (Fase 1 é só fundação/login).
// Firestore (getFirestore) entra na Fase 2, junto com o CRUD de contas.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// NOTE: sem isso, uma env var ausente vira um erro críptico do SDK do
// Firebase lá na frente (ex: "auth/invalid-api-key"), sem dizer qual
// variável está faltando. Falhar aqui, cedo e explicitamente, é o que
// permite ao <StartupError> (main.tsx) mostrar uma mensagem acionável.
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    throw new Error(
      `Firebase: variável de ambiente "VITE_FIREBASE_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}" não definida. Configure o .env local (veja .env.example) ou os GitHub Secrets do repositório.`,
    )
  }
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
