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

## Notes

- L'application utilise React, TypeScript, Vite et React Router avec `HashRouter`.
- Le lien local `obsidian/` est ignore par Git. Il donne seulement acces au vault de specifications depuis WSL.
