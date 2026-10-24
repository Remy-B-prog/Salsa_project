# SchemaViewer

Implementation : `src/features/movements/components/SchemaViewer.tsx`

Test : `src/features/movements/components/MovementDetail.test.tsx`

## Responsabilite

Affiche les huit images du schema dans l'ordre des temps, ou rien lorsqu'un mouvement ne contient pas de schema.

Chaque image est chargee independamment avec `loadMedia`. Une image indisponible est remplacee par une erreur locale qui ne masque ni les autres temps ni la fiche.

Les URLs de lecture obtenues sont liberees lors du demontage du composant.

Les vignettes utilisent un ratio portrait `2 / 3`. Elles conservent une taille uniforme dans la grille; `object-fit: cover` recadre seulement leur affichage pour eviter toute deformation. Ce recadrage ne modifie jamais le fichier local ni l'image affichee par la lightbox.

## Affichage agrandi

Une image chargee est un bouton qui ouvre une lightbox, sans nouvelle lecture ni ecriture du media local. La modale affiche la meme URL, limite l'image a la fenetre et indique le temps selectionne.

Le bouton de fermeture recoit le focus a l'ouverture. La lightbox se ferme avec ce bouton, la touche Echap ou un clic sur son fond; le focus revient alors au bouton qui l'a ouverte. La touche Tab reste sur le bouton de fermeture pour ne pas atteindre le contenu de la fiche en arriere-plan.

Les interactions sont testees dans `MovementDetail.test.tsx` : ouverture, attributs de la modale, fermeture par Echap, bouton et fond, ainsi que restauration du focus.
