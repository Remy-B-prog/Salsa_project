# Library connection

Le module de connexion permet a l'utilisateur de creer ou ouvrir une bibliotheque depuis un dossier de son ordinateur.

Il est disponible dans Chrome et Edge sur ordinateur, via l'API File System Access. L'application doit etre ouverte depuis `https` ou `localhost`.

## Ecran de connexion

Au premier lancement, l'application affiche deux actions :

- `Creer une bibliotheque` : initialise le dossier choisi avec les fichiers necessaires.
- `Ouvrir une bibliotheque` : ouvre un dossier contenant deja `library.json`.

Le selecteur de dossier est toujours appele apres un clic utilisateur, ce qui est impose par le navigateur.

## Permissions

Avant de creer ou ouvrir une bibliotheque, l'application verifie puis demande l'autorisation de lecture et ecriture du dossier.

Si l'autorisation est refusee, la connexion echoue avec le code `permission-denied` et l'interface affiche un message explicite.

## Reconnexion

Le handle du dossier est memorise dans IndexedDB, uniquement pour faciliter l'ouverture suivante :

- Les fiches et medias ne sont jamais stockes dans IndexedDB.
- Le dossier local reste la source de verite.
- Si les donnees du navigateur sont effacees, le handle peut etre oublie mais les fichiers restent dans le dossier.
- L'utilisateur choisit alors `Ouvrir une bibliotheque` pour reconnecter ce dossier.

## Modules

| Fichier                                                       | Responsabilite                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/features/library/libraryConnection.ts`                   | Selection du dossier, permissions, creation, ouverture et gestion des erreurs de connexion. |
| `src/features/library/libraryHandleStore.ts`                  | Sauvegarde et lecture optionnelles du handle dans IndexedDB.                                |
| `src/features/library/libraryStorage.ts`                      | Lecture et ecriture des fichiers de la bibliotheque.                                        |
| `src/features/library/fileSystemAccess.d.ts`                  | Declarations TypeScript des methodes de permission de l'API File System Access.             |
| `src/features/library/components/LibraryConnectionScreen.tsx` | Ecran presentant les actions de creation et ouverture de bibliotheque.                      |
| `src/features/library/components/LibraryHome.tsx`             | Ecran Bibliotheque affiche apres une connexion reussie.                                     |

Les props et les tests de ces composants sont documentes dans [components/](components/).

La lecture des images et videos de fiches est documentee dans [library-media-reader.md](library-media-reader.md).

## Erreurs gerees

| Code                  | Cause                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| `unsupported-browser` | Le navigateur ne fournit pas le selecteur de dossier.                         |
| `cancelled`           | L'utilisateur annule le selecteur de dossier.                                 |
| `permission-denied`   | Le navigateur refuse l'acces lecture-ecriture.                                |
| `already-initialized` | Une creation est demandee dans un dossier qui contient deja une bibliotheque. |
| `invalid-library`     | Le dossier ne contient pas une bibliotheque reconnue.                         |

## Verification manuelle

1. Lancer `npm run dev`.
2. Ouvrir l'URL Vite dans Chrome ou Edge.
3. Creer une bibliotheque dans un dossier vide.
4. Verifier la creation de `library.json`, `library.backup.json`, `images/` et `videos/`.
5. Recharger la page et verifier que la bibliotheque est restauree.
6. Tester l'ouverture du meme dossier avec `Ouvrir une bibliotheque`.

## Limites actuelles

- Il n'est pas encore possible de changer de bibliotheque depuis les parametres.
- Il n'existe pas encore d'import ou export complet de bibliotheque.
- Les mouvements ne sont pas encore affiches ou modifies par cette fonctionnalite.
