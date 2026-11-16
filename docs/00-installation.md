# Étape 0 · Créer les comptes et déployer

Durée : 20 à 30 minutes. Tout est gratuit. Faites ces étapes depuis un ordinateur, c'est plus confortable.

Vous allez créer :

1. un projet **Supabase** (base de données, comptes utilisateurs, temps réel) ;
2. un projet **Vercel** (hébergement du site, relié à votre dépôt GitHub) ;
3. l'application sur l'écran d'accueil de vos deux iPhone.

---

## 1. Supabase

### 1.1 Créer le compte et le projet

1. Ouvrez <https://supabase.com> et cliquez sur **Start your project**.
2. Choisissez **Continue with GitHub** (même compte que le dépôt) et autorisez l'accès.
3. Supabase crée une organisation à votre nom. Cliquez sur **New project**.
4. Remplissez :
   - **Name** : `notre-budget`
   - **Database Password** : cliquez sur **Generate a password**, puis **copiez-le dans un gestionnaire de mots de passe**. Vous n'en aurez pas besoin au quotidien, mais il est impossible de le retrouver ensuite.
   - **Region** : `West EU (Paris)` ou, à défaut, `Central EU (Frankfurt)`.
   - **Pricing plan** : `Free`.
5. Cliquez sur **Create new project** et attendez une à deux minutes que le statut passe au vert.

### 1.2 Installer la base de données

1. Dans le menu de gauche, cliquez sur **SQL Editor** (icône de terminal).
2. Cliquez sur **New query** (ou le **+**).
3. Ouvrez le fichier `supabase/migrations/001_socle.sql` du dépôt sur GitHub, cliquez sur l'icône **Copy raw file**, puis collez tout le contenu dans l'éditeur.
4. Cliquez sur **Run** (ou Ctrl/Cmd + Entrée).
5. Le message attendu en bas est **Success. No rows returned**. Des lignes `NOTICE ... does not exist, skipping` sont normales.

Vérification : menu **Table Editor** → vous voyez les tables `couples`, `profiles`, `categories`, `monthly_budgets`, `envelopes`, `expenses`.

### 1.3 Régler la connexion par e-mail

Pour une application privée à deux, la confirmation d'adresse e-mail n'apporte rien et complique l'installation sur iPhone. On la désactive.

1. Menu **Authentication** → **Sign In / Providers** (selon la version : **Providers**).
2. Cliquez sur **Email**.
3. Désactivez **Confirm email**. Laissez **Enable Email provider** activé.
4. **Save**.

### 1.4 Récupérer l'adresse et la clé du projet

1. Menu **Project Settings** (roue crantée en bas à gauche) → **API Keys**.
2. Notez la clé **Publishable key** (elle commence par `sb_publishable_`). Si votre projet affiche l'ancien système, prenez la clé **anon public** (elle commence par `eyJ`). Les deux fonctionnent.
3. Toujours dans **Project Settings** → **Data API** (ou **General**), notez **Project URL**, de la forme `https://xxxxxxxx.supabase.co`.

Gardez ces deux valeurs sous la main pour Vercel. La clé publishable/anon est faite pour être visible dans le navigateur : la sécurité repose sur les règles RLS installées par le fichier SQL, pas sur le secret de cette clé.

---

## 2. Vercel

### 2.1 Créer le compte

1. Ouvrez <https://vercel.com/signup>.
2. Choisissez **Hobby** (gratuit), puis **Continue with GitHub**.
3. Autorisez Vercel à accéder à GitHub. Quand il demande quels dépôts, choisissez **Only select repositories** → `Application-de-budget`.

### 2.2 Importer le projet

1. Sur le tableau de bord Vercel, **Add New…** → **Project**.
2. Dans la liste, cliquez sur **Import** à côté de `Application-de-budget`.
3. **Framework Preset** : Vercel détecte `Next.js` tout seul. Ne touchez pas aux commandes de build.
4. Dépliez **Environment Variables** et ajoutez deux lignes :

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | votre Project URL (`https://xxxxxxxx.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | votre clé publishable ou anon |

5. Cliquez sur **Deploy**. Le premier déploiement prend une à deux minutes.
6. Vercel affiche des confettis et une adresse du type `https://application-de-budget-xxxx.vercel.app`. **Notez cette adresse** : c'est celle de votre application.

### 2.3 Déployer la bonne branche

Le code est pour l'instant sur la branche `claude/couple-budget-realtime-app-xkw4mg`, pas sur `main`. Deux options :

- **Option simple pendant les tests** : dans Vercel, **Settings** → **Git** → **Production Branch**, saisissez `claude/couple-budget-realtime-app-xkw4mg`, **Save**, puis **Deployments** → menu **⋯** du dernier déploiement → **Redeploy**.
- **Option propre quand vous validez une étape** : sur GitHub, ouvrez une pull request de cette branche vers `main` et fusionnez-la. Vercel redéploie `main` automatiquement.

### 2.4 Dire à Supabase où est l'application

1. Retour dans Supabase : **Authentication** → **URL Configuration**.
2. **Site URL** : collez l'adresse Vercel (`https://application-de-budget-xxxx.vercel.app`).
3. **Save**.

---

## 3. Installer l'application sur les deux iPhone

À faire sur chaque téléphone, obligatoirement avec **Safari** (Chrome ne permet pas l'installation).

1. Ouvrez l'adresse Vercel dans Safari.
2. Touchez le bouton **Partager** (carré avec une flèche vers le haut, en bas de l'écran).
3. Faites défiler et touchez **Sur l'écran d'accueil**.
4. Le nom proposé est **Notre Budget**. Touchez **Ajouter**.
5. Fermez Safari et ouvrez l'application depuis l'icône `€` violette sur l'écran d'accueil. Elle s'ouvre en plein écran, sans barre d'adresse.

Important : connectez-vous toujours **depuis l'icône de l'écran d'accueil**, pas depuis Safari. Les deux ne partagent pas la session.

---

## 4. Créer vos deux comptes et vous relier

Sur le premier iPhone :

1. Touchez **Créer un compte**, saisissez prénom, e-mail et mot de passe (6 caractères minimum), **Créer mon compte**.
2. Sur l'écran *Bienvenue*, laissez « Notre budget » ou choisissez un nom, puis **Créer et inviter mon/ma partenaire ensuite**.
3. Allez dans **Réglages**. Un **code à 8 caractères** s'affiche dans la section *Partenaire*. Touchez **Partager l'invitation** pour l'envoyer par iMessage.

Sur le second iPhone :

1. **Créer un compte** avec son propre e-mail.
2. Sur l'écran *Bienvenue*, saisissez le code dans **Rejoindre avec un code** → **Rejoindre**.

Les deux téléphones affichent maintenant le même espace. Passez au fichier `docs/01-etape-1-verification.md` pour vérifier que tout fonctionne.

---

## 5. Optionnel : empêcher la mise en pause du projet Supabase

L'offre gratuite met un projet en pause après **7 jours sans aucune requête**. Avec un usage quotidien ce n'est jamais le cas. Si vous partez en vacances sans utiliser l'application, le projet se met en pause et il suffit de cliquer sur **Restore project** dans Supabase (une minute, aucune donnée perdue).

Pour ne plus y penser, le dépôt contient une tâche GitHub qui envoie un ping tous les trois jours :

1. Sur GitHub, dépôt → **Settings** → **Secrets and variables** → **Actions**.
2. Onglet **Secrets** → **New repository secret** : `SUPABASE_URL` (Project URL) puis `SUPABASE_ANON_KEY` (clé publishable/anon).
3. Onglet **Variables** → **New repository variable** : `KEEPALIVE_ENABLED` avec la valeur `true`.

---

## 6. Pour développer sur votre ordinateur (facultatif)

```bash
npm install
```

```bash
cp .env.example .env.local
```

Remplissez `.env.local` avec les mêmes deux valeurs que sur Vercel, puis :

```bash
npm run dev
```

L'application est sur <http://localhost:3000>.

## En cas de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| Page blanche ou erreur 500 sur Vercel | Variables d'environnement manquantes | Vercel → Settings → Environment Variables, puis Redeploy |
| « E-mail ou mot de passe incorrect » à l'inscription | Confirmation d'e-mail encore activée | Étape 1.3, puis réessayez (ou cliquez sur le lien reçu par e-mail) |
| L'écran *Bienvenue* affiche une erreur SQL | Le fichier SQL n'a pas été exécuté entièrement | Relancez l'étape 1.2 (le fichier peut être rejoué sans risque) |
| « Code d'invitation inconnu » | Faute de frappe (le code ignore les minuscules et les espaces) | Réglages du premier téléphone → **Nouveau code** |
