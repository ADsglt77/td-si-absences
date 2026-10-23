import { Elysia, t } from 'elysia'

type Absence = {
  id: number
  apprenti: string
  cours: string
  date: string
  statut: 'non_justifiee' | 'en_attente' | 'justifiee' | 'refusee'
  type_piece?: string
}

const absences: Absence[] = [
  { id: 1, apprenti: 'Stella VISENTIN', cours: 'Algorithmes et théorie des graphes', date: '2026-10-05', statut: 'non_justifiee' },
  { id: 2, apprenti: 'Johan FORESTIER', cours: 'Programmation en C et C++', date: '2026-10-05', statut: 'en_attente' },
  { id: 3, apprenti: 'Adrien SEGALAT', cours: 'Bases de données', date: '2026-10-01', statut: 'justifiee' }
]

function trouverAbsence(id: string) {
  return absences.find(absence => absence.id === Number(id))
}

export const app = new Elysia()
  .onError(({ code, status }) => {
    if (code === 'VALIDATION') return status(400, { erreur: 'Corps de la requête invalide' })
  })

  .get('/', () => 'API des absences - Efrei, ING1 : voir /api/v1/absences')

  // R1 : toutes les absences
  .get('/api/v1/absences', () => absences)

  // R2 / R3 : une absence
  .get('/api/v1/absences/:id', ({ params, status }) => {
    const absence = trouverAbsence(params.id)
    if (!absence) return status(404, { erreur: 'Absence introuvable' })
    return absence
  })

  // R4 / R5 / R6 : créer une absence (le serveur choisit l'id et le statut)
  .post('/api/v1/absences', ({ body, status }) => {
    const absence: Absence = { id: absences.length + 1, ...body, statut: 'non_justifiee' }
    absences.push(absence)
    return status(201, absence)
  }, {
    body: t.Object({
      apprenti: t.String({ minLength: 1 }),
      cours: t.String({ minLength: 1 }),
      date: t.String({ pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' })
    })
  })

  // R7 : l'apprenti dépose un justificatif
  .put('/api/v1/absences/:id/justificatif', ({ params, body, status }) => {
    const absence = trouverAbsence(params.id)
    if (!absence) return status(404, { erreur: 'Absence introuvable' })
    if (absence.statut === 'en_attente' || absence.statut === 'justifiee') {
      return status(400, { erreur: 'Justificatif déjà en attente ou absence déjà justifiée' })
    }

    absence.type_piece = body.type_piece
    absence.statut = 'en_attente'
    return absence
  }, {
    body: t.Object({
      type_piece: t.String({ minLength: 1 })
    })
  })

  // R8 / R9 / R10 : la scolarité accepte ou refuse le justificatif
  .put('/api/v1/absences/:id/decision', ({ params, body, status }) => {
    const absence = trouverAbsence(params.id)
    if (!absence) return status(404, { erreur: 'Absence introuvable' })
    if (absence.statut !== 'en_attente') return status(400, { erreur: 'Aucun justificatif en attente' })

    absence.statut = body.statut
    return absence
  }, {
    body: t.Object({
      statut: t.UnionEnum(['justifiee', 'refusee'])
    })
  })

  // R11 : absences non justifiées depuis au moins 48 heures
  .get('/api/v1/relances', () => {
    const limite = Date.now() - 48 * 60 * 60 * 1000
    return absences.filter(absence =>
      absence.statut === 'non_justifiee' && new Date(absence.date).getTime() <= limite
    )
  })

app.listen(5050)
console.log('API disponible sur http://localhost:5050/api/v1/absences')
