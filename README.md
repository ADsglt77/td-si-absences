# Prototype A — API REST des absences (ALMF55)

**Efrei — ING1.** Groupe : Stella VISENTIN, Johan FORESTIER, Adrien SEGALAT, Sacha DOUBLET.

**Technologies :** TypeScript, Bun, Elysia. **Échange illustré :** appel synchrone HTTP/JSON.

## Prérequis

[Bun](https://bun.sh) version 1.3 ou plus récente (testé avec Bun 1.3.14).

```bash
# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# macOS / Linux
curl -fsSL https://bun.sh/install | bash
```

## Installation

Depuis le dossier du projet :

```bash
bun install
```

## Lancer l'API

```bash
bun start
```

L'API écoute sur **http://localhost:5050** (liste des absences : http://localhost:5050/api/v1/absences).
`bun run dev` lance la même API en rechargement automatique.

Les données sont en mémoire : chaque redémarrage repart des 3 absences de départ.

## Lancer la recette automatique (R1 à R11)

```bash
bun test
```

Résultat attendu : `13 pass`, `0 fail` (les 11 cas de recette + 2 vérifications supplémentaires).
Les tests n'ont pas besoin du serveur. Par précaution, arrêter `bun start` avant de les lancer : ils ouvrent eux aussi le port 5050.

Vérification des types TypeScript :

```bash
bun run check
```

## Routes

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/v1/absences` | Liste toutes les absences |
| GET | `/api/v1/absences/:id` | Une absence (404 si inconnue) |
| POST | `/api/v1/absences` | Crée une absence (`apprenti`, `cours`, `date` au format `AAAA-MM-JJ`) |
| PUT | `/api/v1/absences/:id/justificatif` | L'apprenti dépose un justificatif (`type_piece`) → `en_attente` |
| PUT | `/api/v1/absences/:id/decision` | La scolarité tranche (`statut` : `justifiee` ou `refusee`) |
| GET | `/api/v1/relances` | Absences non justifiées depuis au moins 48 h |

Les corps JSON d'exemple sont dans le dossier `exemples/`.

## Rejouer la recette à la main

Avec l'API lancée (`bun start`), dans un second terminal ouvert dans le dossier du projet, exécuter les commandes dans l'ordre.
Elles sont écrites pour bash (Linux, macOS, ou Git Bash sous Windows).

```bash
# R1 — liste : 200, 3 absences
curl -i http://localhost:5050/api/v1/absences

# R2 — absence 1 : 200, Stella VISENTIN
curl -i http://localhost:5050/api/v1/absences/1

# R3 — absence inconnue : 404
curl -i http://localhost:5050/api/v1/absences/99

# R4 — création : 201, id 4, statut non_justifiee
curl -i -X POST http://localhost:5050/api/v1/absences -H "Content-Type: application/json" -d @exemples/absence.json

# R5 — création sans date : 400
curl -i -X POST http://localhost:5050/api/v1/absences -H "Content-Type: application/json" -d '{"apprenti":"Sacha DOUBLET","cours":"Bases de données"}'

# R6 — création avec une date invalide : 400
curl -i -X POST http://localhost:5050/api/v1/absences -H "Content-Type: application/json" -d '{"apprenti":"Sacha DOUBLET","cours":"Bases de données","date":"demain"}'

# R7 — justificatif sur l'absence 4 : 200, statut en_attente
curl -i -X PUT http://localhost:5050/api/v1/absences/4/justificatif -H "Content-Type: application/json" -d @exemples/justificatif.json

# R8 — décision invalide : 400
curl -i -X PUT http://localhost:5050/api/v1/absences/4/decision -H "Content-Type: application/json" -d '{"statut":"peut-etre"}'

# R9 — décision sur une absence inconnue : 404
curl -i -X PUT http://localhost:5050/api/v1/absences/99/decision -H "Content-Type: application/json" -d @exemples/decision.json

# R10 — décision sur l'absence 4 : 200, statut justifiee
curl -i -X PUT http://localhost:5050/api/v1/absences/4/decision -H "Content-Type: application/json" -d @exemples/decision.json

# R11 — relances : 200, uniquement Stella VISENTIN
curl -i http://localhost:5050/api/v1/relances
```
