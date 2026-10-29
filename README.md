# Salsa Project

Application web locale pour conserver et consulter une bibliotheque personnelle de mouvements de salsa.

## Prerequis

- Node.js 22 ou une version LTS recente.
- npm.
- Chrome ou Edge sur ordinateur pour les futures fonctions de bibliotheque locale.

Verifier les outils installes :

```bash
node --version
npm --version
```

## Installation

Depuis la racine du projet :

```bash
npm install
```

## Lancer l application

```bash
npm run dev
```

Vite affiche ensuite l'URL locale, generalement `http://localhost:5173/`.

## Verifications

```bash
npm run format
npm run lint
npm run test
npm run build
```

Pour appliquer le formatage automatiquement :

```bash
npm run format:write
```

## Integration continue

GitHub Actions execute `npm ci`, le controle de format, lint, les tests et le build pour chaque push et pull request vers `main`.

## Deploiement

Le workflow GitHub Pages publie l'application apres chaque push vers `main`. Dans GitHub, activer **Settings > Pages > Build and deployment > Source > GitHub Actions** une seule fois. Une fois le premier deploiement reussi, le site est disponible sur `https://remy-b-prog.github.io/Salsa_project/`.

## Version

La version de l'application est `1.0.0` et suit SemVer. La procedure de publication est decrite dans [docs/versioning.md](docs/versioning.md).

## Notes

- L'application utilise React, TypeScript, Vite et React Router avec `HashRouter`.
- Le lien local `obsidian/` est ignore par Git. Il donne seulement acces au vault de specifications depuis WSL.
- Le stockage local est decrit dans [docs/features/library/library-storage.md](docs/features/library/library-storage.md).
- La connexion au dossier de bibliotheque est decrite dans [docs/features/library/library-connection.md](docs/features/library/library-connection.md).
- Les composants de bibliotheque sont decrits dans [docs/features/library/components/](docs/features/library/components/).
- Le modele et le depot de mouvements sont decrits dans [docs/features/movements/movement-repository.md](docs/features/movements/movement-repository.md).
- Les listes de mouvements par niveau sont decrites dans [docs/features/movements/components/](docs/features/movements/components/).
