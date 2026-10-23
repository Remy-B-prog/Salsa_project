# LibraryConnectionScreen

Implementation : `src/features/library/components/LibraryConnectionScreen.tsx`

Test : `src/features/library/components/LibraryConnectionScreen.test.tsx`

## Responsabilite

Affiche l'ecran de premier lancement lorsqu'aucune bibliotheque locale n'est connectee.

Le composant reste presentiel : il affiche les informations et transmet les clics a son parent. Il ne choisit pas de dossier et n'accede pas au systeme de fichiers.

## Props

| Prop       | Type               | Role                                              |
| ---------- | ------------------ | ------------------------------------------------- |
| `onCreate` | `() => void`       | Lance la creation d'une bibliotheque.             |
| `onOpen`   | `() => void`       | Lance l'ouverture d'une bibliotheque existante.   |
| `error`    | `string` optionnel | Affiche une erreur de connexion ou de permission. |

## Comportement

- Le bouton `Creer une bibliotheque` appelle `onCreate`.
- Le bouton `Ouvrir une bibliotheque` appelle `onOpen`.
- Une erreur recue dans `error` est exposee avec le role accessible `alert`.
- Le composant rappelle la compatibilite Chrome et Edge sur ordinateur.
