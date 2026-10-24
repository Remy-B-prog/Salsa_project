import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import {
  createLibraryFromPicker,
  LibraryConnectionError,
  openLibraryFromPicker,
  restoreSavedLibrary,
  type LibraryConnection,
} from './features/library/libraryConnection';
import { LibraryConnectionScreen } from './features/library/components/LibraryConnectionScreen';
import { LibraryHome } from './features/library/components/LibraryHome';
import { createLibraryMediaUrl } from './features/library/libraryMediaReader';
import { FileSystemMovementRepository } from './features/movements/fileSystemMovementRepository';
import { MovementDetail } from './features/movements/components/MovementDetail';
import { MovementEditForm } from './features/movements/components/MovementEditForm';
import { LevelMovementList } from './features/movements/components/LevelMovementList';
import { MovementForm } from './features/movements/components/MovementForm';
import type { Movement } from './features/movements/model';

type AppState =
  | { status: 'loading' }
  | { status: 'disconnected'; error?: string }
  | { status: 'connected'; connection: LibraryConnection };

function App() {
  const [state, setState] = useState<AppState>({ status: 'loading' });

  useEffect(() => {
    let isMounted = true;

    void restoreSavedLibrary().then((connection) => {
      if (!isMounted) {
        return;
      }

      setState(connection ? { status: 'connected', connection } : { status: 'disconnected' });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  async function connect(action: () => Promise<LibraryConnection>): Promise<void> {
    setState({ status: 'loading' });

    try {
      setState({ status: 'connected', connection: await action() });
    } catch (error) {
      if (error instanceof LibraryConnectionError && error.code === 'cancelled') {
        setState({ status: 'disconnected' });
        return;
      }

      setState({
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.',
      });
    }
  }

  if (state.status === 'loading') {
    return (
      <main className="connection-shell">
        <p className="loading-message">Chargement de la bibliotheque...</p>
      </main>
    );
  }

  if (state.status === 'disconnected') {
    return (
      <LibraryConnectionScreen
        error={state.error}
        onCreate={() => void connect(createLibraryFromPicker)}
        onOpen={() => void connect(openLibraryFromPicker)}
      />
    );
  }

  return (
    <ConnectedLibrary
      connection={state.connection}
      onMovementCreated={(movement) => {
        setState((currentState) => {
          if (currentState.status !== 'connected') {
            return currentState;
          }

          return {
            status: 'connected',
            connection: {
              ...currentState.connection,
              library: {
                ...currentState.connection.library,
                movements: [...currentState.connection.library.movements, movement],
              },
            },
          };
        });
      }}
      onMovementUpdated={(movement) => {
        setState((currentState) => {
          if (currentState.status !== 'connected') {
            return currentState;
          }

          return {
            status: 'connected',
            connection: {
              ...currentState.connection,
              library: {
                ...currentState.connection.library,
                movements: currentState.connection.library.movements.map((item) =>
                  typeof item === 'object' &&
                  item !== null &&
                  'id' in item &&
                  item.id === movement.id
                    ? movement
                    : item,
                ),
              },
            },
          };
        });
      }}
    />
  );
}

type ConnectedLibraryProps = {
  connection: LibraryConnection;
  onMovementCreated: (movement: Movement) => void;
  onMovementUpdated: (movement: Movement) => void;
};

function ConnectedLibrary({
  connection,
  onMovementCreated,
  onMovementUpdated,
}: ConnectedLibraryProps) {
  return (
    <Routes>
      <Route path="/" element={<LibraryHome library={connection.library} />} />
      <Route
        path="/levels/:level"
        element={<LevelMovementList directory={connection.directory} />}
      />
      <Route
        path="/movements/new"
        element={
          <MovementForm
            onSave={(input) => new FileSystemMovementRepository(connection.directory).create(input)}
            onCreated={onMovementCreated}
          />
        }
      />
      <Route
        path="/movements/:movementId/edit"
        element={
          <MovementEditForm
            getMovement={(id) => new FileSystemMovementRepository(connection.directory).getById(id)}
            onSave={(id, input) =>
              new FileSystemMovementRepository(connection.directory).update(id, input)
            }
            onUpdated={onMovementUpdated}
          />
        }
      />
      <Route
        path="/movements/:movementId"
        element={
          <MovementDetail
            getMovement={(id) => new FileSystemMovementRepository(connection.directory).getById(id)}
            loadMedia={(path) => createLibraryMediaUrl(connection.directory, path)}
            deleteMovement={(id) =>
              new FileSystemMovementRepository(connection.directory).delete(id)
            }
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
