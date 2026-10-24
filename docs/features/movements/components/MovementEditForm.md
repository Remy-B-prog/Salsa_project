# MovementEditForm

Implementation : `src/features/movements/components/MovementEditForm.tsx`

Test : `src/features/movements/components/MovementEditForm.test.tsx`

## Responsabilite

Charge le mouvement de la route `#/movements/:movementId/edit`, pre-remplit son formulaire et transmet les modifications au depot.

## Comportement

- Conserve les chemins des images et de la video locale non modifies sous forme de sources `existing`.
- Permet de remplacer chaque image, de retirer ou de recreer un schema de huit images.
- Permet de retirer la video, de passer entre URL externe et fichier local, ou de remplacer une video locale.
- Valide les champs avant l'ecriture et conserve les donnees saisies si celle-ci echoue.
- Met a jour l'etat applicatif, puis revient vers la fiche apres une sauvegarde reussie.

Le composant ne lit ni n'ecrit directement les fichiers : `getMovement` et `onSave` sont injectes par `App`.
