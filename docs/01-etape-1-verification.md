# Étape 1 · Vérifier le socle (base, couple, saisie manuelle, budget, temps réel)

Prérequis : `docs/00-installation.md` terminé, les deux comptes reliés.

Cochez chaque point. Si l'un échoue, notez le message affiché et envoyez-le-moi.

## A. Budget du mois

1. Téléphone 1 → **Budget**. Saisissez un budget global (par exemple `1500`) et quelques enveloppes (Courses `400`, Restaurants `150`, Transport `100`). Laissez coché **Utiliser ces montants pour les prochains mois**. **Enregistrer**.
2. Téléphone 2 → **Accueil** (ou tirez pour rafraîchir en changeant d'onglet). Attendu : *Reste à dépenser* = `1 500 €`, *reste par jour* = 1500 divisé par le nombre de jours restants dans le mois (aujourd'hui compris), barres Courses, Restaurants, Transport à 0 %.

## B. Saisie en trois taps

1. Téléphone 1 → touchez le **+** en bas à droite.
2. Tapez `12,50` sur le pavé, touchez **Courses**, touchez **Valider 12,50 €**.
3. Attendu sur le téléphone 1 : retour à l'accueil, *Reste à dépenser* = `1 487,50 €`, barre Courses à 3 %, la dépense apparaît dans *Dernières dépenses* avec vos initiales.
4. Attendu sur le téléphone 2, **sans rien toucher** : le même solde apparaît en moins de deux secondes. Si l'application était en arrière-plan, elle se met à jour dès qu'on la rouvre.

## C. Options avancées

1. Téléphone 2 → **+**, montant `45`, catégorie **Restaurants**, puis **Plus d'options** : *Qui a payé* = téléphone 2, *Marchand* = `Pizzeria`. **Valider**.
2. Attendu : la ligne « Pizzeria » apparaît sur les deux téléphones avec les initiales du téléphone 2.
3. Téléphone 1 → **+**, montant `99`, catégorie **Shopping**, **Plus d'options** → **Personnelle**. **Valider**.
4. Attendu : le *Reste à dépenser* **ne bouge pas** (dépense personnelle), la ligne apparaît dans **Dépenses** avec la mention *Perso* et est absente de la liste de l'accueil.
5. Téléphone 1 → **+**, montant `2,50`, catégorie **Courses**, **Plus d'options** → *Type* = **Rembours.**, marchand `Retour article`. **Valider**.
6. Attendu : *Reste à dépenser* remonte de 2,50 €, la ligne s'affiche en vert avec un `+`.

## D. Modifier et supprimer

1. **Dépenses** → touchez la ligne « Pizzeria ». Changez le montant en `40`, **Enregistrer**.
2. Attendu : les deux téléphones affichent `40,00 €` et le solde recalculé.
3. Rouvrez la ligne → **Supprimer cette dépense** → **Supprimer définitivement**.
4. Attendu : la ligne disparaît des deux téléphones et le solde remonte.

## E. Alertes visuelles d'enveloppe (aperçu de l'étape 5)

1. Ajoutez une dépense **Transport** de `85` (enveloppe 100).
2. Attendu : la barre Transport passe en orange avec la mention *80 % atteint*.
3. Ajoutez `20` de plus en Transport.
4. Attendu : barre rouge, mention *Dépassé*, montant en rouge.

## F. Catégories

1. **Réglages** → **Catégories et enveloppes par défaut** → **+ Ajouter une catégorie** : emoji `🐱`, nom `Chat`, enveloppe par défaut `30`. **Enregistrer**.
2. Attendu : la catégorie apparaît dans le pavé de saisie des deux téléphones. Elle recevra une enveloppe de 30 € à partir du mois prochain (pour ce mois-ci, réglez-la dans **Budget**).
3. Touchez une catégorie inutile → **Archiver**. Attendu : elle disparaît de la saisie, les dépenses déjà saisies dessus restent visibles.

## G. Sécurité (isolation entre couples)

Ce test demande un troisième e-mail (une adresse jetable suffit).

1. Dans Safari (pas dans l'application installée), ouvrez l'adresse Vercel, créez un compte avec ce troisième e-mail et un nouvel espace couple.
2. Attendu : accueil vide, aucune catégorie personnalisée, aucune dépense, aucun budget. Impossible de voir quoi que ce soit du vrai couple.
3. Essayez de rejoindre votre vrai couple avec votre code : attendu *Cet espace couple est déjà complet*.
4. Supprimez ce compte test : Supabase → **Authentication** → **Users** → menu de la ligne → **Delete user**.

## H. Hors ligne (ce qui marche déjà, ce qui viendra)

- Dès maintenant : si le réseau coupe, la saisie affiche *Pas de connexion réseau* et rien n'est perdu à l'écran, mais il faut revalider une fois le réseau revenu.
- Étape 6 : la saisie sera mise en file d'attente et envoyée automatiquement au retour du réseau.

## Ce que fait le fichier SQL (pour information)

| Table | Rôle |
|---|---|
| `couples` | l'espace commun : nom, code d'invitation, mode de répartition, budget global par défaut |
| `profiles` | un par compte : prénom, revenu mensuel, couple d'appartenance |
| `categories` | catégories avec emoji, couleur, enveloppe par défaut, option de report |
| `monthly_budgets` | le budget global d'un mois donné |
| `envelopes` | l'enveloppe de chaque catégorie pour un mois donné |
| `expenses` | dépenses, remboursements et rentrées, communes ou personnelles |

Les règles RLS vérifient chaque lecture et chaque écriture : une ligne n'est accessible que si son `couple_id` est celui du couple de l'utilisateur connecté. Le même mécanisme filtre le temps réel.
