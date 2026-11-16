# Notre Budget

Application web installable (PWA) de budget de couple en temps réel : chaque dépense se déduit immédiatement du budget restant, visible à jour sur les deux téléphones.

Stack : Next.js 16 (App Router), Supabase (authentification, Postgres avec Row Level Security, temps réel), Tailwind CSS 4, déploiement Vercel. Interface en français, montants en euros, pensée pour l'iPhone.

## Démarrer

1. `docs/00-installation.md` : créer les comptes Supabase et Vercel, déployer, installer sur les iPhone.
2. `docs/01-etape-1-verification.md` : vérifier le socle (base, couple, saisie, budget, temps réel).

## Avancement

| Étape | Contenu | État |
|---|---|---|
| 0 | Comptes, déploiement, installation sur iPhone | ✅ guide livré |
| 1 | Base de données, espace couple, saisie manuelle, budget et enveloppes, écran d'accueil, temps réel | ✅ à vérifier |
| 2 | Webhook Apple Pay (Raccourcis iOS), catégorisation automatique par marchand | à venir |
| 3 | Charges fixes récurrentes, cycle mensuel | à venir |
| 4 | Commun / personnel par carte, rentrées d'argent, équilibre entre partenaires | à venir |
| 5 | Alertes 80 % et 100 %, historique, graphiques, export CSV | à venir |
| 6 | Hors ligne avec synchronisation, notifications push | à venir |

## Développement local

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Le schéma de base de données est dans `supabase/migrations/` ; chaque fichier se colle dans l'éditeur SQL de Supabase et peut être rejoué sans risque.
