import { runTransaction } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { accountDoc } from '../accounts/api'
import { createTransaction } from '../transactions/api'
import { todayDateString } from '../cards/invoiceUtils'
import { caixinhaDoc } from './api'

// Guardar: tira da conta, põe na caixinha. NUNCA cria Transaction — é
// transferência entre "bolsos" do mesmo patrimônio, não receita/despesa.
export async function depositToCaixinha(
  uid: string,
  accountId: string,
  caixinhaId: string,
  amount: number,
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountDoc(uid, accountId))
    const caixinhaSnap = await transaction.get(caixinhaDoc(uid, caixinhaId))
    if (!accountSnap.exists()) throw new Error('Conta não encontrada.')
    if (!caixinhaSnap.exists()) throw new Error('Caixinha não encontrada.')
    transaction.update(accountDoc(uid, accountId), { balance: accountSnap.data().balance - amount })
    transaction.update(caixinhaDoc(uid, caixinhaId), { balance: caixinhaSnap.data().balance + amount })
  })
}

// Resgatar: tira da caixinha, devolve pra conta. Mesma lógica, valida
// saldo suficiente na caixinha antes de escrever.
export async function withdrawFromCaixinha(
  uid: string,
  accountId: string,
  caixinhaId: string,
  amount: number,
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountDoc(uid, accountId))
    const caixinhaSnap = await transaction.get(caixinhaDoc(uid, caixinhaId))
    if (!accountSnap.exists()) throw new Error('Conta não encontrada.')
    if (!caixinhaSnap.exists()) throw new Error('Caixinha não encontrada.')
    if (caixinhaSnap.data().balance < amount) throw new Error('Saldo insuficiente na caixinha.')
    transaction.update(accountDoc(uid, accountId), { balance: accountSnap.data().balance + amount })
    transaction.update(caixinhaDoc(uid, caixinhaId), { balance: caixinhaSnap.data().balance - amount })
  })
}

// Encerrar: devolve o saldo (se houver) pra conta e apaga a caixinha,
// atomicamente — nunca perde dinheiro no fechamento (mesmo comportamento
// de "Encerrar caixinha" do Nubank).
export async function closeCaixinha(uid: string, accountId: string, caixinhaId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const accountSnap = await transaction.get(accountDoc(uid, accountId))
    const caixinhaSnap = await transaction.get(caixinhaDoc(uid, caixinhaId))
    if (!accountSnap.exists()) throw new Error('Conta não encontrada.')
    if (!caixinhaSnap.exists()) throw new Error('Caixinha não encontrada.')
    const remaining = caixinhaSnap.data().balance
    if (remaining > 0) {
      transaction.update(accountDoc(uid, accountId), { balance: accountSnap.data().balance + remaining })
    }
    transaction.delete(caixinhaDoc(uid, caixinhaId))
  })
}

// Rendimento: dinheiro genuinamente novo (diferente de guardar/resgatar,
// que são só transferência). O valor nunca passa pela conta de verdade —
// fica todo dentro da caixinha — mas ainda precisa virar receita real no
// extrato. Registra a receita normalmente (comporta-se como qualquer
// receita comum se o usuário editar/excluir depois) e em seguida
// transfere o mesmo valor da conta pra caixinha: o efeito líquido no
// saldo da conta é zero (+receita, −transferência), a caixinha ganha o
// valor.
export async function registerCaixinhaYield(
  uid: string,
  accountId: string,
  caixinhaId: string,
  caixinhaName: string,
  amount: number,
  categoryId: string,
): Promise<void> {
  await createTransaction(uid, {
    type: 'income',
    amount,
    date: todayDateString(),
    description: `Rendimento — ${caixinhaName}`,
    categoryId,
    paid: true,
    accountId,
  })
  await depositToCaixinha(uid, accountId, caixinhaId, amount)
}
