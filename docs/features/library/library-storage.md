# Library storage

Le module `src/features/library/libraryStorage.ts` gere le stockage persistant d'une bibliotheque dans un dossier choisi par l'utilisateur avec l'API File System Access.

Il ne gere ni l'interface de selection de dossier, ni les fiches mouvement elles-memes. Ces sujets sont couverts par les taches suivantes du backlog.

## Structure du dossier

Lorsqu'une bibliotheque est initialisee, le module cree :

```text
library.json
library.backup.json
images/
videos/
```

- `library.json` est la source de verite de la bibliotheque.
- `library.backup.json` contient la version precedente avant chaque ecriture de `library.json`.
- `images/` et `videos/` accueilleront les medias des mouvements.

## Format de library.json

```json
{
  "version": 1,
  "movements": []
}
```

Le module valide que le fichier contient la version attendue et un tableau `movements`. Le depot de mouvements valide ensuite chaque fiche avant de la lire ou de l'ecrire.

Un fichier peut aussi contenir `pendingMediaCleanups`, une liste interne de chemins locaux a supprimer. Cette liste est absente tant qu'aucun nettoyage n'est en attente.

## API

### `initializeLibrary(directory)`

Initialise un dossier vide comme bibliotheque. La fonction cree les fichiers et dossiers necessaires, puis retourne une bibliotheque vide.

Elle echoue avec le code `already-initialized` si `library.json` existe deja dans le dossier.

### `openLibrary(directory)`

Lit et valide `library.json`, puis retourne son contenu.

Elle echoue avec le code `invalid-library` si le fichier est absent, contient du JSON invalide ou ne respecte pas le format attendu.

### `writeLibrary(directory, library)`

Valide la bibliotheque a ecrire, sauvegarde la version actuelle dans `library.backup.json`, puis ecrit la nouvelle version dans `library.json`.

### `resumePendingMediaCleanups(directory)`

Reprend les suppressions de medias locaux en attente. Les chemins deja absents sont consideres comme nettoyes. Les echecs restent dans `library.json` et seront reessayes a la prochaine ouverture.

## Erreurs

Le module expose `LibraryStorageError` avec les codes suivants :

| Code                  | Signification                                                   |
| --------------------- | --------------------------------------------------------------- |
| `already-initialized` | Le dossier contient deja une bibliotheque.                      |
| `invalid-library`     | Le fichier `library.json` est absent, invalide ou incompatible. |

Les erreurs de permission et les erreurs du systeme de fichiers sont remontees telles quelles afin que l'interface puisse les presenter a l'utilisateur.

## Tests

Les tests sont dans `src/features/library/libraryStorage.test.ts`. Ils couvrent :

- l'initialisation du dossier ;
- la lecture d'une bibliotheque valide ;
- le rejet d'un fichier invalide ;
- l'ecriture de la sauvegarde avant le fichier principal.
- la reprise d'un nettoyage de medias en attente.

Executer les tests avec :

```bash
npm run test
```

## Limites actuelles

- La sauvegarde est un fichier unique, sans restauration automatique dans cette version.
