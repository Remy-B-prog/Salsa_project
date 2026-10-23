# LibraryHome

Implementation : `src/features/library/components/LibraryHome.tsx`

Test : `src/features/library/components/LibraryHome.test.tsx`

## Responsabilite

Affiche l'ecran Bibliotheque une fois qu'un dossier local valide est connecte.

Le composant presente les quatre niveaux de salsa et le nombre total de mouvements disponibles dans la bibliotheque ouverte.

## Props

| Prop      | Type              | Role                                          |
| --------- | ----------------- | --------------------------------------------- |
| `library` | `LibraryDocument` | Fournit la bibliotheque actuellement ouverte. |

## Comportement

- Affiche les niveaux 1 a 4.
- Affiche le nombre de mouvements avec le pluriel adapte.
- Les cartes de niveau lient vers `#/levels/1` a `#/levels/4`.
- Le bouton `Ajouter un mouvement` lie vers `#/movements/new`, dont le formulaire sera implemente dans la tache 006.
- Ne lit pas directement les fichiers : les donnees sont fournies en prop par `App.tsx`.
