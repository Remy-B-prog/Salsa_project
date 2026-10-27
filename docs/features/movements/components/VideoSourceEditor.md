# VideoSourceEditor

Implementation : `src/features/movements/components/VideoSourceEditor.tsx`

Test : les interactions sont couvertes par `src/features/movements/components/MovementForm.test.tsx`.

## Responsabilite

Permet de choisir la source video unique d'un mouvement : aucune, lien externe ou fichier local.

## Props

| Prop       | Type               | Role                                       |
| ---------- | ------------------ | ------------------------------------------ |
| `value`    | `DraftVideoSource` | Source actuellement choisie.               |
| `onChange` | `(source) => void` | Retourne la source modifiee au formulaire. |
| `error`    | `string` optionnel | Affiche l'erreur liee a la video.          |

## Comportement

- Les boutons radio ne permettent de choisir qu'une seule source video.
- Une URL externe est saisie comme texte et n'est jamais telechargee.
- Un fichier local est filtre par `accept="video/*"`; son type MIME est valide par le formulaire puis par le depot.
- La video est facultative, quel que soit le contenu du schema.
