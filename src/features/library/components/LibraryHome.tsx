import type { LibraryDocument } from '../libraryStorage';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appVersion } from '../../../appVersion';

const levels = [
  {
    value: 1,
    number: '01',
    label: 'Niveau 1',
    description: 'Les bases pour entrer dans la danse.',
  },
  {
    value: 2,
    number: '02',
    label: 'Niveau 2',
    description: 'Les enchainements qui prennent forme.',
  },
  { value: 3, number: '03', label: 'Niveau 3', description: 'Plus de fluidite et de variations.' },
  { value: 4, number: '04', label: 'Niveau 4', description: 'Les mouvements a garder en memoire.' },
];

type LibraryHomeProps = {
  library: LibraryDocument;
  loadLibrary?: () => Promise<LibraryDocument>;
};

export function LibraryHome({ library, loadLibrary }: LibraryHomeProps) {
  const [loadedLibrary, setLoadedLibrary] = useState<LibraryDocument>();

  useEffect(() => {
    if (!loadLibrary) {
      return;
    }

    let isCurrent = true;

    void loadLibrary().then(
      (loadedLibrary) => {
        if (isCurrent) {
          setLoadedLibrary(loadedLibrary);
        }
      },
      () => undefined,
    );

    return () => {
      isCurrent = false;
    };
  }, [library, loadLibrary]);

  const movementCount = (loadedLibrary ?? library).movements.length;

  return (
    <main className="library-shell">
      <header className="library-header">
        <div>
          <p className="eyebrow">Salsa library</p>
          <h1>Bibliotheque de mouvements</h1>
        </div>
        <Link to="/movements/new" className="add-button">
          Ajouter un mouvement
        </Link>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="intro-kicker">Ton carnet de pratique</p>
        <h2 id="intro-title">Retrouve un mouvement, puis danse-le a nouveau.</h2>
        <p>
          Les fiches seront organisees par niveau et conserveront les reperes utiles entre deux
          cours.
        </p>
      </section>

      <section aria-labelledby="levels-title">
        <div className="section-heading">
          <h2 id="levels-title">Choisir un niveau</h2>
          <span>
            {movementCount} mouvement{movementCount > 1 ? 's' : ''}
          </span>
        </div>
        <div className="level-grid">
          {levels.map((level) => (
            <Link to={`/levels/${level.value}`} className="level-card" key={level.number}>
              <span className="level-number">{level.number}</span>
              <span className="level-label">{level.label}</span>
              <span className="level-description">{level.description}</span>
              <span className="level-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="app-version">Version {appVersion}</footer>
    </main>
  );
}
