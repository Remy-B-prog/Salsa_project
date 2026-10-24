# SchemaViewer

Implementation : `src/features/movements/components/SchemaViewer.tsx`

Test : `src/features/movements/components/MovementDetail.test.tsx`

## Responsabilite

Affiche les huit images du schema dans l'ordre des temps, ou rien lorsqu'un mouvement ne contient pas de schema.

Chaque image est chargee independamment avec `loadMedia`. Une image indisponible est remplacee par une erreur locale qui ne masque ni les autres temps ni la fiche.

Les URLs de lecture obtenues sont liberees lors du demontage du composant.
