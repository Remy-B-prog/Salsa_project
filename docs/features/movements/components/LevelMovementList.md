# LevelMovementList

Implementation : `src/features/movements/components/LevelMovementList.tsx`

Test : `src/features/movements/components/LevelMovementList.test.tsx`

## Responsabilite

Affiche les mouvements d'un niveau dans la bibliotheque connectee. Le niveau est lu depuis la route `#/levels/:level`.

## Props

| Prop        | Type                        | Role                                         |
| ----------- | --------------------------- | -------------------------------------------- |
| `directory` | `FileSystemDirectoryHandle` | Dossier de bibliotheque actuellement ouvert. |

## Comportement

- Valide que le parametre de route est un niveau de 1 a 4, sinon retourne a la bibliotheque.
- Lit les fiches avec `FileSystemMovementRepository.listByLevel`.
- Affiche uniquement les noms des mouvements du niveau selectionne.
- Chaque nom lie vers `#/movements/:id`, qui sera la fiche de mouvement de la tache 008.
- Affiche un etat vide et un lien `Ajouter un mouvement` vers `#/movements/new` lorsqu'aucune fiche n'est trouvee.
- Affiche une erreur de lecture sans masquer la navigation.
