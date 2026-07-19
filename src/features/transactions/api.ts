import {
  collection,
  doc,
  getDoc,
  runTransaction,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { accountDoc } from '../accounts/api'
import { TRANSACTION_TYPES, type Transaction, type TransactionFormData, type TransactionType } from './types'

// NOTE: mesmo padrão de narrowing campo a campo de accounts/api.ts e
// cards/api.ts (sem `as unknown as X`).
const transactionConverter: FirestoreDataConverter<Transaction> = {
  toFirestore: (t) => {
    const base = {
      type: t.type,
      amount: t.amount,
      date: t.date,
      description: t.description,
      categoryId: t.categoryId,
    }
    return t.accountId !== undefined ? { ...base, accountId: t.accountId } : { ...base, cardId: t.cardId }
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const type: TransactionType = TRANSACTION_TYPES.includes(data.type) ? data.type : 'expense'
    const accountId = typeof data.accountId === 'string' ? data.accountId : undefined
    const cardId = typeof data.cardId === 'string' ? data.cardId : undefined
    return {
      id: snapshot.id,
      type,
      amount: typeof data.amount === 'number' ? data.amount : 0,
      date: typeof data.date === 'string' ? data.date : '',
      description: typeof data.description === 'string' ? data.description : '',
      categoryId: typeof data.categoryId === 'string' ? data.categoryId : '',
      ...(accountId !== undefined ? { accountId } : {}),
      ...(cardId !== undefined ? { cardId } : {}),
    }
  },
}

export function transactionsCollection(uid: string) {
  return collection(db, 'users', uid, 'transactions').withConverter(transactionConverter)
}

function transactionDoc(uid: string, transactionId: string) {
  return doc(db, 'users', uid, 'transactions', transactionId).withConverter(transactionConverter)
}

// Efeito assinado no saldo: income soma, expense subtrai. Só se aplica a
// transações vinculadas a conta — card-linked nunca passa por aqui (cartão
// não tem campo de saldo, só `limit`; "fatura" fica pra outra fase).
function signedEffect(type: TransactionType, amount: number): number {
  return type === 'income' ? amount : -amount
}

// Defesa em profundidade — o zod do form já deveria garantir isso, mas a
// api.ts não confia cegamente no caller.
function assertValidLinkage(data: TransactionFormData): void {
  const hasAccount = data.accountId !== undefined
  const hasCard = data.cardId !== undefined
  if (data.type === 'income' && hasCard) {
    throw new Error('Receita não pode estar vinculada a um cartão.')
  }
  if (hasAccount === hasCard) {
    throw new Error('A transação deve estar vinculada a exatamente uma conta ou um cartão.')
  }
}

export async function createTransaction(uid: string, data: TransactionFormData): Promise<string> {
  assertValidLinkage(data)
  // addDoc não existe dentro de runTransaction; gera o id do lado do
  // cliente com doc(collectionRef) (sem round-trip) e usa transaction.set().
  const newTxRef = doc(transactionsCollection(uid))

  await runTransaction(db, async (transaction) => {
    const accountSnap =
      data.accountId !== undefined ? await transaction.get(accountDoc(uid, data.accountId)) : undefined
    if (accountSnap !== undefined && !accountSnap.exists()) {
      throw new Error('Conta vinculada não encontrada.')
    }

    if (data.accountId !== undefined && accountSnap?.exists()) {
      transaction.update(accountDoc(uid, data.accountId), {
        balance: accountSnap.data().balance + signedEffect(data.type, data.amount),
      })
    }
    transaction.set(newTxRef, { id: newTxRef.id, ...data })
  })

  return newTxRef.id
}

export async function updateTransaction(
  uid: string,
  transactionId: string,
  data: TransactionFormData,
): Promise<void> {
  assertValidLinkage(data)
  const txRef = transactionDoc(uid, transactionId)

  await runTransaction(db, async (transaction) => {
    // READ 1: transação existente, pra saber accountId/cardId/type/amount
    // ANTIGOS — o caller só nos dá os dados NOVOS do form. Ler aqui dentro
    // (em vez de confiar num valor já buscado antes) também protege contra
    // stale data, já que o formulário pode ter ficado aberto um tempo.
    const oldSnap = await transaction.get(txRef)
    if (!oldSnap.exists()) throw new Error('Transação não encontrada.')
    const oldData = oldSnap.data()

    const oldAccountId = oldData.accountId
    const newAccountId = data.accountId
    const oldEffect = oldAccountId !== undefined ? signedEffect(oldData.type, oldData.amount) : 0
    const newEffect = newAccountId !== undefined ? signedEffect(data.type, data.amount) : 0
    const sameAccount = oldAccountId !== undefined && oldAccountId === newAccountId

    // READ 2: conta antiga (se houver). A ref só existe depois da READ 1,
    // mas isso é permitido — a regra do Firestore é "todos os reads antes de
    // qualquer write", não "refs precisam ser conhecidas de antemão".
    const oldAccountSnap =
      oldAccountId !== undefined ? await transaction.get(accountDoc(uid, oldAccountId)) : undefined
    if (oldAccountSnap !== undefined && !oldAccountSnap.exists()) {
      throw new Error('Conta antiga vinculada não encontrada.')
    }
    const oldAccountBalance = oldAccountSnap?.exists() ? oldAccountSnap.data().balance : undefined

    // READ 3: conta nova, só se for DIFERENTE da antiga (evita ler o mesmo
    // doc duas vezes).
    const newAccountSnap =
      newAccountId !== undefined && !sameAccount
        ? await transaction.get(accountDoc(uid, newAccountId))
        : undefined
    if (newAccountSnap !== undefined && !newAccountSnap.exists()) {
      throw new Error('Conta vinculada não encontrada.')
    }
    const newAccountBalance = newAccountSnap?.exists() ? newAccountSnap.data().balance : undefined

    // --- só writes daqui pra baixo ---
    if (sameAccount && oldAccountId !== undefined && oldAccountBalance !== undefined) {
      // mesma conta absorve reversão + aplicação num único write (cobre
      // mudança de valor, de tipo, ou ambos, mantendo a mesma conta)
      transaction.update(accountDoc(uid, oldAccountId), {
        balance: oldAccountBalance - oldEffect + newEffect,
      })
    } else {
      if (oldAccountId !== undefined && oldAccountBalance !== undefined) {
        transaction.update(accountDoc(uid, oldAccountId), { balance: oldAccountBalance - oldEffect })
      }
      if (newAccountId !== undefined && newAccountBalance !== undefined) {
        transaction.update(accountDoc(uid, newAccountId), { balance: newAccountBalance + newEffect })
      }
    }

    transaction.set(txRef, { id: transactionId, ...data })
  })
}

export async function deleteTransaction(uid: string, transactionId: string): Promise<void> {
  const txRef = transactionDoc(uid, transactionId)

  await runTransaction(db, async (transaction) => {
    const txSnap = await transaction.get(txRef)
    if (!txSnap.exists()) throw new Error('Transação não encontrada.')
    const txData = txSnap.data()

    const accountSnap =
      txData.accountId !== undefined ? await transaction.get(accountDoc(uid, txData.accountId)) : undefined
    if (accountSnap !== undefined && !accountSnap.exists()) {
      throw new Error('Conta vinculada não encontrada.')
    }

    if (txData.accountId !== undefined && accountSnap?.exists()) {
      transaction.update(accountDoc(uid, txData.accountId), {
        balance: accountSnap.data().balance - signedEffect(txData.type, txData.amount),
      })
    }
    transaction.delete(txRef)
  })
}

export async function getTransaction(uid: string, transactionId: string): Promise<Transaction | null> {
  const snapshot = await getDoc(transactionDoc(uid, transactionId))
  return snapshot.exists() ? snapshot.data() : null
}
