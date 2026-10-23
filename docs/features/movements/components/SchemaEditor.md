# SchemaEditor

Implementation : `src/features/movements/components/SchemaEditor.tsx`

Test : `src/features/movements/components/SchemaEditor.test.tsx`

## Responsabilite

Edite le schema d'un mouvement sous la forme de huit emplacements, un pour chaque temps de salsa.

## Props

| Prop       | Type                       | Role                                         |
| ---------- | -------------------------- | -------------------------------------------- |
| `onChange` | `(images: File[]) => void` | Retourne les images ordonnees au formulaire. |
| `error`    | `string` optionnel         | Affiche l'erreur de validation du schema.    |

## Comportement

- Chaque emplacement numerote de 1 a 8 accepte une image.
- L'image importe est montree en apercu local, sans ecriture dans le navigateur.
- Une image peut etre remplacee ou retiree avant l'enregistrement.
- Les URLs d'aperçu creees par le navigateur sont liberees lors du remplacement, de la suppression ou du demontage du composant.

Les objets `File` sont transmis au formulaire, puis au depot de mouvements qui les copie dans le dossier de bibliotheque.
