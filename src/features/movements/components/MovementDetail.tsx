import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Movement } from '../model';
import { MovementVideo } from './MovementVideo';
import { SchemaViewer } from './SchemaViewer';

type MovementDetailProps = {
  getMovement: (id: string) => Promise<Movement | undefined>;
  loadMedia: (path: string) => Promise<string>;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; movement: Movement }
  | { status: 'missing' }
  | { status: 'error'; message: string };

export function MovementDetail({ getMovement, loadMedia }: MovementDetailProps) {
  const { movementId } = useParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!movementId) {
      return;
    }

    let isCurrent = true;

    void getMovement(movementId).then(
      (movement) => {
        if (isCurrent) {
          setState(movement ? { status: 'loaded', movement } : { status: 'missing' });
        }
      },
      (error: unknown) => {
        if (isCurrent) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Impossible de lire ce mouvement.',
          });
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [getMovement, movementId]);

  if (state.status === 'loading') {
    return <DetailMessage message="Chargement du mouvement..." />;
  }

  if (state.status === 'missing') {
    return <DetailMessage message="Ce mouvement est introuvable." />;
  }

  if (state.status === 'error') {
    return <DetailMessage message={state.message} isError />;
  }

  const { movement } = state;

  return (
    <main className="library-shell movement-detail">
      <header className="level-list-header">
        <Link to={`/levels/${movement.level}`} className="back-link">
          Niveau {movement.level}
        </Link>
      </header>

      <p className="eyebrow">Niveau {movement.level}</p>
      <h1>{movement.name}</h1>

      <section className="detail-section" aria-labelledby="notes-title">
        <h2 id="notes-title">Notes</h2>
        <p className="movement-notes">{movement.notes}</p>
      </section>

      <SchemaViewer imagePaths={movement.schemaImagePaths} loadMedia={loadMedia} />
      {movement.video && <MovementVideo source={movement.video} loadMedia={loadMedia} />}
    </main>
  );
}

function DetailMessage({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <main className="library-shell future-screen">
      <p
        className={isError ? 'connection-error' : 'loading-message'}
        role={isError ? 'alert' : undefined}
      >
        {message}
      </p>
      <Link to="/" className="secondary-button">
        Retour a la bibliotheque
      </Link>
    </main>
  );
}
