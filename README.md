# CampusConnect

CampusConnect est une application web d’entraide étudiante. Elle permet aux
étudiants de publier des demandes, de proposer leur aide, d’organiser des
séances de révision et de laisser un avis après une séance.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation et démarrage local](#installation-et-démarrage-local)
- [Configuration](#configuration)
- [Création d’un compte administrateur](#création-dun-compte-administrateur)
- [Pages de l’application](#pages-de-lapplication)
- [API REST](#api-rest)
- [Sécurité et limites connues](#sécurité-et-limites-connues)
- [Vérifications et compilation](#vérifications-et-compilation)

## Fonctionnalités

### Espace étudiant

- Inscription, connexion et déconnexion.
- Profil étudiant modifiable avec nom, spécialité, niveau d’études,
  compétences et photo de profil.
- Création, modification, suppression, recherche et filtrage des demandes
  d’aide.
- Consultation du détail d’une demande et des propositions qui y sont liées.
- Envoi d’une proposition d’aide; l’auteur de la demande peut l’accepter ou la
  refuser.
- Suivi de la séance et possibilité de la marquer comme terminée.
- Notifications liées aux propositions, aux demandes et aux évaluations reçues.
- Avis entre participants après une séance terminée.
- Tableau de bord personnel et statistiques publiques sur la page d’accueil.

### Administration

- Consultation et traitement des publications signalées.
- Consultation et suppression des demandes.
- Consultation, désactivation/réactivation et suppression des comptes étudiants.
- Consultation des notifications récentes.
- Les évaluations de séance sont notifiées au participant évalué et visibles
  dans les notifications d’administration.
- Les routes API d’administration sont réservées aux comptes ayant le rôle
  `admin`.

### Interface

- Interface disponible en français, anglais et arabe.
- Direction de lecture droite-à-gauche pour l’arabe.
- Thèmes clair et sombre.
- Avatar partagé entre le profil et l’en-tête.
- Animations d’interface et retours visuels sur les formulaires.

## Technologies

| Partie           | Technologies                                                  |
| ---------------- | ------------------------------------------------------------- |
| Frontend         | Next.js App Router, React, TypeScript, CSS                    |
| Formulaires      | React Hook Form et Zod                                        |
| Backend          | Node.js, Express 5 et TypeScript                              |
| Base de données  | MongoDB et Mongoose                                           |
| Authentification | JWT dans un cookie HttpOnly; mots de passe hachés avec bcrypt |

Le frontend et le backend sont deux applications npm indépendantes; leurs
dépendances et commandes doivent être exécutées dans leurs dossiers respectifs.

## Structure du projet

```text
CampusConnect/
├── frontend/
│   ├── app/                 # Pages et routes Next.js
│   ├── components/          # Composants d’interface réutilisables
│   ├── public/              # Ressources statiques
│   ├── services/            # API, langue et services partagés
│   └── types/               # Types et schémas de validation
└── backend/
    ├── scripts/             # Scripts locaux, dont la création d’un admin
    └── src/
        ├── config/          # Connexion à MongoDB
        ├── controllers/     # Logique des endpoints
        ├── middlewares/     # Authentification et autorisations
        ├── models/          # Modèles Mongoose
        ├── routes/          # Définition des routes REST
        ├── utils/           # Utilitaires serveur
        └── validations/     # Validation des entrées API
```

## Prérequis

- Windows avec PowerShell (les commandes ci-dessous sont écrites pour
  PowerShell).
- Node.js compatible avec Next.js 16 (Node.js 20.9 ou une version ultérieure
  est recommandé) et npm.
- MongoDB local ou une instance MongoDB accessible par une URI.
- Deux terminaux PowerShell pour lancer le frontend et le backend en parallèle.

## Installation et démarrage local

Les commandes suivantes supposent que le terminal se trouve à la racine du
projet.

### 1. Configurer et démarrer le backend

```powershell
cd .\backend
Copy-Item .env.example .env
notepad .env
npm install
npm run dev
```

Dans `backend/.env`, renseigne au minimum `MONGODB_URI` et `AUTH_SECRET`.
L’API se connecte à MongoDB avant d’ouvrir le port et s’arrête si la base ou la
configuration d’authentification est indisponible.

### 2. Configurer et démarrer le frontend

Dans un second terminal, depuis la racine du projet :

```powershell
cd .\frontend
Copy-Item .env.example .env.local
notepad .env.local
npm install
npm run dev
```

Pour le démarrage local standard, la valeur de `NEXT_PUBLIC_API_URL` dans
`frontend/.env.local` peut rester `http://localhost:4000`.

### 3. Ouvrir l’application

- Application : <http://localhost:3000>
- API : <http://localhost:4000>
- Vérification de l’API et de MongoDB :
  <http://localhost:4000/api/health>

L’endpoint de santé renvoie `ok: true` lorsque l’API peut joindre MongoDB.

## Configuration

### Backend — `backend/.env`

| Variable         | Obligatoire         | Description                                                                              |
| ---------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| `PORT`           | Non                 | Port HTTP de l’API; `4000` par défaut.                                                   |
| `MONGODB_URI`    | Oui                 | URI de connexion à MongoDB. L’exemple utilise `mongodb://127.0.0.1:27017/campusconnect`. |
| `AUTH_SECRET`    | Oui                 | Secret de signature JWT d’au moins 32 caractères.                                        |
| `FRONTEND_URL`   | Non                 | Origine autorisée par CORS avec cookies; `http://localhost:3000` par défaut.             |
| `NODE_ENV`       | Non                 | Environnement d’exécution, par exemple `development` ou `production`.                    |
| `ADMIN_EMAIL`    | Pour créer un admin | Adresse du compte administrateur créé par le script de seed.                             |
| `ADMIN_PASSWORD` | Pour créer un admin | Mot de passe administrateur d’au moins 12 caractères.                                    |

Pour générer un secret local avec Node.js :

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie le résultat dans `AUTH_SECRET`. Ne partage pas et ne committe jamais les
fichiers `.env` ou `.env.local`.

### Frontend — `frontend/.env.local`

| Variable              | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL de base de l’API, par exemple `http://localhost:4000`. |

Les variables préfixées par `NEXT_PUBLIC_` sont intégrées au code frontend et
ne doivent donc contenir aucun secret.

## Création d’un compte administrateur

1. Renseigne `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `backend/.env`.
2. Depuis le dossier `backend`, lance :

   ```powershell
   npm run seed:admin
   ```

Le script crée ou met à jour le compte correspondant à cette adresse. Il
utilise le rôle `admin` et exige un mot de passe d’au moins 12 caractères.
L’interface d’administration se trouve sous `/admin`.

## Pages de l’application

| URL                    | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `/`                    | Accueil et statistiques publiques              |
| `/register`            | Création d’un compte étudiant                  |
| `/login`               | Connexion                                      |
| `/requests`            | Liste, recherche et filtres des demandes       |
| `/requests/new`        | Publication d’une demande                      |
| `/requests/[id]`       | Détail d’une demande et propositions associées |
| `/dashboard`           | Tableau de bord personnel                      |
| `/my-requests`         | Demandes de l’utilisateur connecté             |
| `/notifications`       | Notifications de l’utilisateur connecté        |
| `/profile`             | Consultation et modification du profil         |
| `/admin`               | Modération des publications signalées          |
| `/admin/requests`      | Gestion des demandes                           |
| `/admin/users`         | Gestion des comptes étudiants                  |
| `/admin/notifications` | Consultation des notifications récentes        |

## API REST

Toutes les routes sont préfixées par `/api`. Sauf indication contraire, les
routes de données nécessitent une session authentifiée. Les routes `/api/admin`
nécessitent en plus le rôle `admin`.

| Préfixe               | Méthodes et usages                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/health`             | `GET` — état de l’API et connexion à MongoDB (public).                                                                                                               |
| `/auth`               | `POST /register`, `POST /login`, `GET /me`, `POST /logout`, `PATCH /profile`.                                                                                        |
| `/requests`           | `GET` et `POST /`; `GET`, `PATCH` et `DELETE /:id`.                                                                                                                  |
| `/proposals`          | `GET` et `POST /request/:id`; `PATCH /:id` pour le statut d’une proposition.                                                                                         |
| `/requests` (séances) | `PATCH /:id/complete` — clôture d’une séance associée à une demande.                                                                                                 |
| `/reviews`            | `POST /` — création d’un avis.                                                                                                                                       |
| `/reports`            | `POST /` — signalement d’une demande.                                                                                                                                |
| `/notifications`      | `GET /`; `PATCH /:id/read`.                                                                                                                                          |
| `/dashboard`          | `GET /` — données du tableau de bord personnel.                                                                                                                      |
| `/stats`              | `GET /` — statistiques publiques.                                                                                                                                    |
| `/admin`              | `GET /dashboard`, `PATCH /reports/:id`, `GET /requests`, `DELETE /requests/:id`, `GET /users`, `PATCH /users/:id/status`, `DELETE /users/:id`, `GET /notifications`. |

Les réponses sont au format JSON. Le frontend envoie les cookies de session
pour les appels API authentifiés.

## Sécurité et limites connues

- Le serveur refuse de démarrer si `AUTH_SECRET` est absent ou fait moins de
  32 caractères.
- Les mots de passe ne sont pas stockés en clair; l’authentification utilise
  un JWT dans un cookie HttpOnly.
- Les routes d’administration vérifient l’authentification et le rôle sur le
  backend. Ne te fie pas uniquement à l’affichage ou au masquage d’un lien dans
  l’interface.
- Les comptes administrateur ne sont pas inclus dans la liste des comptes
  étudiants gérables depuis l’interface admin.
- La suppression d’un compte étudiant supprime ses demandes, propositions et
  avis associés; les demandes acceptées concernées peuvent être rouvertes.
- Les notifications de l’administration sont dérivées des propositions et des
  évaluations; leur écran est en consultation seule.
- Les écrans d’administration affichent un nombre limité d’éléments récents
  (jusqu’à 100 demandes, 200 comptes étudiants et 100 notifications); aucune
  pagination n’est actuellement disponible.
- Le serveur limite la taille JSON d’une requête à 2 Mo. Les images de profil
  sont limitées côté formulaire à 1 Mo.

Pour un déploiement, utilise un `AUTH_SECRET` fort et distinct, configure
`FRONTEND_URL` avec l’origine réelle du frontend, protège les variables
d’environnement et utilise une configuration MongoDB sécurisée.

## Vérifications et compilation

Depuis `frontend/` :

```powershell
npm run lint
npx tsc --noEmit
npm run build
npm start
```

Depuis `backend/` :

```powershell
npm run build
npm start
```

Le projet ne définit actuellement pas de script `npm test`. Le build backend
compile TypeScript dans `backend/dist`; le build frontend prépare l’application
Next.js pour le lancement en production.
