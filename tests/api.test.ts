import { describe, expect, test } from 'bun:test'
import { app } from '../src/index.ts'

function requete(methode: string, chemin: string, corps?: object) {
  return app.handle(new Request(`http://localhost${chemin}`, {
    method: methode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corps)
  }))
}

// Les tests s'exécutent dans l'ordre du sujet et partagent les mêmes données
describe('Recette R1 à R11', () => {
  test('R1 - GET liste : 200 et 3 absences', async () => {
    const reponse = await requete('GET', '/api/v1/absences')
    expect(reponse.status).toBe(200)
    expect(await reponse.json()).toHaveLength(3)
  })

  test('R2 - GET /1 : 200 et Stella', async () => {
    const reponse = await requete('GET', '/api/v1/absences/1')
    expect(reponse.status).toBe(200)
    expect((await reponse.json()).apprenti).toBe('Stella VISENTIN')
  })

  test('R3 - GET /99 : 404', async () => {
    const reponse = await requete('GET', '/api/v1/absences/99')
    expect(reponse.status).toBe(404)
  })

  test('R4 - POST Sacha : 201, id 4, non_justifiee', async () => {
    const aujourdhui = new Date().toISOString().slice(0, 10)
    const reponse = await requete('POST', '/api/v1/absences', { apprenti: 'Sacha DOUBLET', cours: "Introduction aux systèmes d'information", date: aujourdhui })
    expect(reponse.status).toBe(201)
    const absence = await reponse.json()
    expect(absence.id).toBe(4)
    expect(absence.statut).toBe('non_justifiee')
  })

  test('R5 - POST sans date : 400', async () => {
    const reponse = await requete('POST', '/api/v1/absences', { apprenti: 'Sacha DOUBLET', cours: "Introduction aux systèmes d'information" })
    expect(reponse.status).toBe(400)
  })

  test('R6 - POST date « demain » : 400', async () => {
    const reponse = await requete('POST', '/api/v1/absences', { apprenti: 'Sacha DOUBLET', cours: "Introduction aux systèmes d'information", date: 'demain' })
    expect(reponse.status).toBe(400)
  })

  test('R7 - PUT justificatif /4 : 200, en_attente', async () => {
    const reponse = await requete('PUT', '/api/v1/absences/4/justificatif', { type_piece: 'certificat' })
    expect(reponse.status).toBe(200)
    expect((await reponse.json()).statut).toBe('en_attente')
  })

  test('R8 - PUT décision invalide : 400', async () => {
    const reponse = await requete('PUT', '/api/v1/absences/4/decision', { statut: 'peut-etre' })
    expect(reponse.status).toBe(400)
  })

  test('R9 - PUT décision absence /99 : 404', async () => {
    const reponse = await requete('PUT', '/api/v1/absences/99/decision', { statut: 'justifiee' })
    expect(reponse.status).toBe(404)
  })

  test('R10 - PUT décision /4 : 200, justifiee', async () => {
    const reponse = await requete('PUT', '/api/v1/absences/4/decision', { statut: 'justifiee' })
    expect(reponse.status).toBe(200)
    expect((await reponse.json()).statut).toBe('justifiee')
  })

  test('R11 - GET relances : 200, Stella uniquement', async () => {
    const reponse = await requete('GET', '/api/v1/relances')
    expect(reponse.status).toBe(200)
    const absences = await reponse.json()
    expect(absences).toHaveLength(1)
    expect(absences[0].apprenti).toBe('Stella VISENTIN')
  })
})

describe('Vérifications supplémentaires', () => {
  test('Une date sans les zéros (2026-1-5) est refusée', async () => {
    const reponse = await requete('POST', '/api/v1/absences', { apprenti: 'Sacha DOUBLET', cours: 'Structure de données', date: '2026-1-5' })
    expect(reponse.status).toBe(400)
  })

  test('Pas de décision sans justificatif en attente', async () => {
    const reponse = await requete('PUT', '/api/v1/absences/1/decision', { statut: 'justifiee' })
    expect(reponse.status).toBe(400)
  })
})
