import { runTransaction } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { accountDoc } from './api'

// Transferência entre contas do próprio usuário — não é receita nem
// despesa, então nunca cria Transaction, só move saldo atomicamente
// (mesmo raciocínio de depositToCaixinha/withdrawFromCaixinha).
export async function transferBetweenAccounts(
  uid: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const fromSnap = await transaction.get(accountDoc(uid, fromAccountId))
    const toSnap = await transaction.get(accountDoc(uid, toAccountId))
    if (!fromSnap.exists()) throw new Error('Conta de origem não encontrada.')
    if (!toSnap.exists()) throw new Error('Conta de destino não encontrada.')
    if (fromSnap.data().balance < amount) throw new Error('Saldo insuficiente na conta de origem.')
    transaction.update(accountDoc(uid, fromAccountId), { balance: fromSnap.data().balance - amount })
    transaction.update(accountDoc(uid, toAccountId), { balance: toSnap.data().balance + amount })
  })
}
