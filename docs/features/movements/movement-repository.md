# Movement repository

`src/features/movements/` contient le modele de mouvement, ses validations et l'adaptateur de persistance dans une bibliotheque locale.

## Modele persiste

Un mouvement enregistre contient son identifiant, son nom, son niveau de 1 a 4, ses notes, la date de creation et ses supports visuels :

- `schemaImagePaths` est vide ou contient huit chemins d'images ordonnees ;
- `video` est soit une URL externe `http` ou `https`, soit le chemin et le type MIME d'un fichier video local.

Le type `CreateMovementInput` accepte des objets `File` pour les medias a importer. Le type `Movement`, ecrit dans `library.json`, ne contient jamais ces fichiers : seulement leurs chemins relatifs.

## Validations

`validateCreateMovement` refuse :

- un nom ou des notes vides ;
- un niveau en dehors de 1 a 4 ;
- un schema qui ne contient pas exactement huit images ;
- une fiche sans schema ni video ;
- une URL video qui n'utilise pas `http` ou `https` ;
- un fichier local dont le type MIME ne commence pas par `video/`.

`parseMovement` applique ces regles aux fiches lues depuis `library.json` avant de les retourner a l'interface.

## Depot local

`FileSystemMovementRepository` implemente :

- `create(input)` : valide, copie les medias et ajoute la fiche a `library.json` ;
- `getById(id)` : lit une fiche valide par identifiant ;
- `listByLevel(level)` : lit les fiches d'un niveau.
- `delete(id)` : retire la fiche, puis nettoie ses medias locaux.
- `update(id, input)` : conserve les medias existants, copie les remplacements et met a jour la fiche.

Les huit images sont copiees vers `images/<movement-id>/1.<extension>` a `8.<extension>`. Une video locale est copiee vers `videos/<movement-id>/video.<extension>`. Les chemins stockes dans `library.json` sont relatifs au dossier de bibliotheque.

Une URL externe est ecrite comme texte et aucun fichier n'est cree ni telecharge pour elle. L'ecriture de la fiche passe par `writeLibrary`, qui maintient `library.backup.json` avant de remplacer le fichier principal.

## Modification

`UpdateMovementInput` represente les images conservees avec `{ kind: 'existing', path }` et les imports par `{ kind: 'new', file }`. Une video locale existante conserve son chemin, tandis qu'un nouveau fichier video est fourni par `file`.

Les nouveaux fichiers utilisent un identifiant unique et sont copies avant l'ecriture de `library.json`. Une fois la fiche ecrite, les anciens chemins locaux devenus inutilises sont ajoutes a `pendingMediaCleanups` puis supprimes. Un echec de nettoyage laisse la fiche mise a jour et est repris lors de la prochaine connexion. Un echec de copie ou d'ecriture nettoie au mieux les nouveaux fichiers sans modifier les anciennes references.

Le depot refuse les chemins de medias conserves qui ne sont pas deja references par la fiche modifiee.

## Suppression

La fiche est d'abord retiree de `library.json`. Ses dossiers locaux sont ensuite ajoutes a un nettoyage en attente puis supprimes. Si ce nettoyage echoue, `delete` retourne `cleanupPending: true` : la fiche reste supprimee et le nettoyage est repris a la prochaine connexion de la bibliotheque.

Une fiche avec seulement une URL externe ne declenche aucune suppression de media local.

## Tests

`src/features/movements/fileSystemMovementRepository.test.ts` couvre la copie des medias, la persistence des chemins relatifs, la video externe, les recherches, la suppression, la reprise de nettoyage, les mises a jour et les rejets de validation.

Le formulaire de creation avec schema est documente dans [components/MovementForm.md](components/MovementForm.md).

Le formulaire de modification est documente dans [components/MovementEditForm.md](components/MovementEditForm.md).

Il peut fournir un schema, une video externe, une video locale ou un schema et une video. La selection de video est documentee dans [components/VideoSourceEditor.md](components/VideoSourceEditor.md).

```bash
npm run test
```
