# MovementDetail

Implementation : `src/features/movements/components/MovementDetail.tsx`

Test : `src/features/movements/components/MovementDetail.test.tsx`

## Responsabilite

Charge et affiche la fiche associee a la route `#/movements/:movementId`.

## Props

| Prop             | Type                                              | Role                                            |
| ---------------- | ------------------------------------------------- | ----------------------------------------------- |
| `getMovement`    | `(id: string) => Promise<Movement \| undefined>`  | Charge la fiche depuis le depot de mouvements.  |
| `loadMedia`      | `(path: string) => Promise<string>`               | Fournit une URL de lecture pour un media local. |
| `deleteMovement` | `(id: string) => Promise<MovementDeletionResult>` | Supprime la fiche et ses medias locaux.         |

## Comportement

- Affiche le nom, le niveau et les notes de la fiche chargee.
- Delegue le schema a `SchemaViewer` et la video a `MovementVideo`.
- Distingue une fiche introuvable d'une erreur de lecture, avec un retour vers la bibliotheque.
- Ne manipule pas directement le systeme de fichiers : les acces sont injectes par la route applicative.
- Propose un lien vers `#/movements/:movementId/edit` pour modifier la fiche.
- Propose une modale de confirmation avant une suppression definitive.
- Revient vers le niveau du mouvement apres suppression et indique lorsqu'un nettoyage de medias reste a reprendre.
