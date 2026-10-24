# Library media reader

`src/features/library/libraryMediaReader.ts` convertit un chemin relatif en URL de lecture temporaire pour un fichier situe dans le dossier de bibliotheque.

## API

### `createLibraryMediaUrl(directory, relativePath)`

Parcourt les sous-dossiers du chemin relatif avec l'API File System Access, lit le fichier puis retourne une URL creee par `URL.createObjectURL`.

Les chemins vides, incomplets ou contenant `.` ou `..` sont refuses pour rester dans le dossier de bibliotheque. L'appelant doit liberer l'URL avec `URL.revokeObjectURL` lorsqu'elle n'est plus affichee.

## Tests

`src/features/library/libraryMediaReader.test.ts` couvre la lecture d'un media et le rejet d'un chemin qui sort de la bibliotheque.
