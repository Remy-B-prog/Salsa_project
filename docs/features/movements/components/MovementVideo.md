# MovementVideo

Implementation : `src/features/movements/components/MovementVideo.tsx`

Test : `src/features/movements/components/MovementDetail.test.tsx`

## Responsabilite

Affiche le support video d'une fiche.

- Une URL externe est affichee dans un lecteur integre. Les URL YouTube standard, Shorts, Live, Embed et playlists, ainsi que les URL Vimeo usuelles, sont converties vers leur format d'integration.
- Un fichier local est charge avec `loadMedia` et lu avec l'element HTML natif `video`.
- Une erreur de chargement locale est affichee dans la section video, sans masquer la fiche.

L'URL temporaire d'une video locale est liberee lors du demontage du composant.

Un fournisseur qui interdit l'integration dans une iframe ne pourra pas etre lu dans l'application.
