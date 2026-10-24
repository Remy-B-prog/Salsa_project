import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Movement, MovementDeletionResult } from '../model';
import { MovementVideo } from './MovementVideo';
import { SchemaViewer } from './SchemaViewer';

type MovementDetailProps = {
  getMovement: (id: string) => Promise<Movement | undefined>;
  loadMedia: (path: string) => Promise<string>;
  deleteMovement: (id: string) => Promise<MovementDeletionResult>;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; movement: Movement }
  | { status: 'missing' }
  | { status: 'error'; message: string };

export function MovementDetail({ getMovement, loadMedia, deleteMovement }: MovementDetailProps) {
  const { movementId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionError, setDeletionError] = useState<string>();

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

  async function deleteCurrentMovement(): Promise<void> {
    setIsDeleting(true);
    setDeletionError(undefined);

    try {
      const result = await deleteMovement(movement.id);
      navigate(`/levels/${movement.level}`, {
        replace: true,
        state: {
          notice: result.cleanupPending
            ? 'Fiche supprimee. Le nettoyage des medias locaux sera repris a la prochaine ouverture.'
            : 'Fiche supprimee.',
        },
      });
    } catch (error) {
      setDeletionError(
        error instanceof Error ? error.message : 'Impossible de supprimer ce mouvement.',
      );
      setIsDeleting(false);
    }
  }

  return (
    <main className="library-shell movement-detail">
      <header className="level-list-header">
        <Link to={`/levels/${movement.level}`} className="back-link">
          Niveau {movement.level}
        </Link>
        <Link to={`/movements/${movement.id}/edit`} className="secondary-button">
          Modifier le mouvement
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

      <section className="detail-section detail-danger-zone" aria-labelledby="deletion-title">
        <h2 id="deletion-title">Supprimer cette fiche</h2>
        <p>La fiche et ses medias locaux seront supprimes definitivement.</p>
        <button
          type="button"
          className="danger-button"
          onClick={() => setIsConfirmingDeletion(true)}
        >
          Supprimer le mouvement
        </button>
      </section>

      {isConfirmingDeletion && (
        <div className="confirmation-backdrop">
          <section
            className="confirmation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <h2 id="delete-dialog-title">Supprimer « {movement.name} » ?</h2>
            <p id="delete-dialog-description">
              Cette action supprime definitivement la fiche et ses medias locaux. Elle ne peut pas
              etre annulee.
            </p>
            {deletionError && (
              <p className="connection-error" role="alert">
                {deletionError}
              </p>
            )}
            <div className="confirmation-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsConfirmingDeletion(false)}
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => void deleteCurrentMovement()}
                disabled={isDeleting}
              >
                {isDeleting ? 'Suppression...' : 'Supprimer definitivement'}
              </button>
            </div>
          </section>
        </div>
      )}
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
