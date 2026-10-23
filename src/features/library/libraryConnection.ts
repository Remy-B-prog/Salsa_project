import { loadLibraryDirectory, saveLibraryDirectory } from './libraryHandleStore';
import {
  initializeLibrary,
  LibraryStorageError,
  openLibrary,
  type LibraryDocument,
} from './libraryStorage';

type DirectoryPickerWindow = Window & {
  showDirectoryPicker?: (options?: {
    mode?: 'read' | 'readwrite';
  }) => Promise<FileSystemDirectoryHandle>;
};

export type LibraryConnection = {
  directory: FileSystemDirectoryHandle;
  library: LibraryDocument;
};

export type LibraryConnectionErrorCode =
  | 'unsupported-browser'
  | 'cancelled'
  | 'permission-denied'
  | 'already-initialized'
  | 'invalid-library';

export class LibraryConnectionError extends Error {
  constructor(
    public readonly code: LibraryConnectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LibraryConnectionError';
  }
}

export async function createLibraryFromPicker(): Promise<LibraryConnection> {
  const directory = await pickDirectory();
  await requestReadWritePermission(directory);

  try {
    const library = await initializeLibrary(directory);
    await rememberDirectory(directory);

    return { directory, library };
  } catch (error) {
    throw mapStorageError(error);
  }
}

export async function openLibraryFromPicker(): Promise<LibraryConnection> {
  const directory = await pickDirectory();
  return openConnectedLibrary(directory, true);
}

export async function restoreSavedLibrary(): Promise<LibraryConnection | null> {
  try {
    const directory = await loadLibraryDirectory();

    if (!directory || (await directory.queryPermission({ mode: 'readwrite' })) !== 'granted') {
      return null;
    }

    return openConnectedLibrary(directory, false);
  } catch {
    return null;
  }
}

export async function requestReadWritePermission(
  directory: FileSystemDirectoryHandle,
): Promise<void> {
  const currentPermission = await directory.queryPermission({ mode: 'readwrite' });
  const permission =
    currentPermission === 'granted'
      ? currentPermission
      : await directory.requestPermission({ mode: 'readwrite' });

  if (permission !== 'granted') {
    throw new LibraryConnectionError(
      'permission-denied',
      'L autorisation de lecture et ecriture est necessaire pour utiliser ce dossier.',
    );
  }
}

async function openConnectedLibrary(
  directory: FileSystemDirectoryHandle,
  requestPermission: boolean,
): Promise<LibraryConnection> {
  try {
    if (requestPermission) {
      await requestReadWritePermission(directory);
    }

    const library = await openLibrary(directory);
    await rememberDirectory(directory);

    return { directory, library };
  } catch (error) {
    throw mapStorageError(error);
  }
}

async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  const picker = (window as DirectoryPickerWindow).showDirectoryPicker;

  if (!picker) {
    throw new LibraryConnectionError(
      'unsupported-browser',
      'Cette fonctionnalite est disponible dans Chrome et Edge sur ordinateur.',
    );
  }

  try {
    return await picker({ mode: 'readwrite' });
  } catch (error) {
    if (isAbortError(error)) {
      throw new LibraryConnectionError('cancelled', 'La selection du dossier a ete annulee.');
    }

    throw error;
  }
}

async function rememberDirectory(directory: FileSystemDirectoryHandle): Promise<void> {
  try {
    await saveLibraryDirectory(directory);
  } catch {
    // The folder remains connected for this session even if the optional cache fails.
  }
}

function mapStorageError(error: unknown): Error {
  if (error instanceof LibraryConnectionError) {
    return error;
  }

  if (error instanceof LibraryStorageError) {
    return new LibraryConnectionError(error.code, error.message);
  }

  return error instanceof Error ? error : new Error('Une erreur inconnue est survenue.');
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
