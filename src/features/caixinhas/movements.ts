import { collection, doc, type FirestoreDataConverter, type QueryDocumentSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { CAIXINHA_MOVEMENT_TYPES, type CaixinhaMovement, type CaixinhaMovementType } from './types'

// Log de auditoria imutável — nunca editado depois de criado, por isso
// não tem toFirestore genérico de update, só o suficiente pra escrever
// uma vez (dentro das transações atômicas de caixinhaTransfers.ts/api.ts).
const caixinhaMovementConverter: FirestoreDataConverter<CaixinhaMovement> = {
  toFirestore: (movement) => ({
    caixinhaId: movement.caixinhaId,
    type: movement.type,
    amount: movement.amount,
    date: movement.date,
    createdBy: movement.createdBy,
  }),
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    const type: CaixinhaMovementType = CAIXINHA_MOVEMENT_TYPES.includes(data.type) ? data.type : 'ajuste'
    return {
      id: snapshot.id,
      caixinhaId: typeof data.caixinhaId === 'string' ? data.caixinhaId : '',
      type,
      amount: typeof data.amount === 'number' ? data.amount : 0,
      date: typeof data.date === 'string' ? data.date : '',
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    }
  },
}

export function caixinhaMovementsCollection(uid: string) {
  return collection(db, 'users', uid, 'caixinhaMovements').withConverter(caixinhaMovementConverter)
}

export function caixinhaMovementDoc(uid: string, movementId: string) {
  return doc(db, 'users', uid, 'caixinhaMovements', movementId).withConverter(caixinhaMovementConverter)
}
