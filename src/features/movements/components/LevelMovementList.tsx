import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { FileSystemMovementRepository } from '../fileSystemMovementRepository';
import { LEVELS, type Level, type Movement } from '../model';

type LevelMovementListProps = {
  directory: FileSystemDirectoryHandle;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; movements: Movement[] }
  | { status: 'error'; message: string };

export function LevelMovementList({ directory }: LevelMovementListProps) {
  const { level: levelParameter } = useParams();
  const location = useLocation();
  const level = parseLevel(levelParameter);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!level) {
      return;
    }

    let isCurrent = true;

    void new FileSystemMovementRepository(directory).listByLevel(level).then(
      (movements) => {
        if (isCurrent) {
          setState({ status: 'loaded', movements });
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Impossible de lire les mouvements.',
          });
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [directory, level]);

  if (!level) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="library-shell level-list-shell">
      <header className="level-list-header">
        <Link to="/" className="back-link">
          Bibliotheque
        </Link>
        <Link to="/movements/new" className="add-button">
          Ajouter un mouvement
        </Link>
      </header>

      <p className="eyebrow">Niveau {level}</p>
      <h1>Mouvements du niveau {level}</h1>
      {typeof location.state?.notice === 'string' && (
        <p className="connection-note" role="status">
          {location.state.notice}
        </p>
      )}

      {state.status === 'loading' && (
        <p className="loading-message">Chargement des mouvements...</p>
      )}

      {state.status === 'error' && (
        <p className="connection-error" role="alert">
          {state.message}
        </p>
      )}

      {state.status === 'loaded' && state.movements.length === 0 && (
        <section className="empty-level" aria-labelledby="empty-level-title">
          <h2 id="empty-level-title">Aucun mouvement dans ce niveau</h2>
          <p>Ajoute une fiche pour garder un repere apres le prochain cours.</p>
          <Link to="/movements/new" className="add-button">
            Ajouter un mouvement
          </Link>
        </section>
      )}

      {state.status === 'loaded' && state.movements.length > 0 && (
        <ol className="movement-list">
          {state.movements.map((movement) => (
            <li key={movement.id}>
              <Link to={`/movements/${movement.id}`}>{movement.name}</Link>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

function parseLevel(value: string | undefined): Level | undefined {
  const parsedValue = Number(value);
  return LEVELS.find((level) => level === parsedValue);
}
