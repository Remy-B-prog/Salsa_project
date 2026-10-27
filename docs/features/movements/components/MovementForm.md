# MovementForm

Implementation : `src/features/movements/components/MovementForm.tsx`

Test : `src/features/movements/components/MovementForm.test.tsx`

## Responsabilite

Affiche le formulaire de creation d'un mouvement avec nom, niveau, notes, schema et source video. Il est monte par la route `#/movements/new`.

## Props

| Prop        | Type                                                | Role                                          |
| ----------- | --------------------------------------------------- | --------------------------------------------- |
| `onSave`    | `(input: CreateMovementInput) => Promise<Movement>` | Cree la fiche via le depot de mouvements.     |
| `onCreated` | `(movement: Movement) => void`                      | Informe l'application qu'une fiche est creee. |

## Comportement

- Valide nom, niveau et notes avant d'appeler `onSave`.
- Accepte une fiche sans media, un schema de huit images, une video externe `http` ou `https`, une video locale reconnue, ou un schema et une video.
- Affiche chaque erreur a cote de son champ, avec un message de schema indiquant le nombre d'images ajoutees.
- Conserve toutes les saisies si l'ecriture dans le depot echoue et affiche l'erreur de stockage.
- Apres l'enregistrement, met a jour la bibliotheque en memoire puis redirige vers `#/movements/:id`.

La fiche detaillee sera implementee dans la tache 008.
