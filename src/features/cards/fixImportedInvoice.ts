import { writeBatch } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { transactionDoc } from '../transactions/api'

// Mesmo limite de operações por writeBatch já respeitado em resetUserData.ts
// e imports/api.ts.
const BATCH_LIMIT = 500

// Corrige lançamentos de cartão que a importação de fatura criou com
// `paid: true` por engano (ver bug do import: fatura importada precisa
// nascer em aberto, não paga — só vira `true` quando a fatura é
// efetivamente paga via payCardInvoice). Só mexe no campo `paid`, nada
// mais — cartão não tem saldo, então não há nenhum outro efeito a
// reverter, diferente de uma transação vinculada a conta.
export async function markCardTransactionsUnpaid(uid: string, transactionIds: string[]): Promise<void> {
  for (let start = 0; start < transactionIds.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db)
    for (const id of transactionIds.slice(start, start + BATCH_LIMIT)) {
      batch.update(transactionDoc(uid, id), { paid: false })
    }
    await batch.commit()
  }
}
