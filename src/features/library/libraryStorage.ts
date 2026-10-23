export const LIBRARY_VERSION = 1;
export const LIBRARY_FILE_NAME = 'library.json';
export const LIBRARY_BACKUP_FILE_NAME = 'library.backup.json';
export const IMAGES_DIRECTORY_NAME = 'images';
export const VIDEOS_DIRECTORY_NAME = 'videos';

export type LibraryDocument = {
  version: typeof LIBRARY_VERSION;
  movements: unknown[];
};

export type LibraryStorageErrorCode = 'already-initialized' | 'invalid-library';

export class LibraryStorageError extends Error {
  constructor(
    public readonly code: LibraryStorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LibraryStorageError';
  }
}

export function createEmptyLibrary(): LibraryDocument {
  return {
    version: LIBRARY_VERSION,
    movements: [],
  };
}

export async function initializeLibrary(
  directory: FileSystemDirectoryHandle,
): Promise<LibraryDocument> {
  await ensureLibraryDoesNotExist(directory);

  const library = createEmptyLibrary();
  await directory.getDirectoryHandle(IMAGES_DIRECTORY_NAME, { create: true });
  await directory.getDirectoryHandle(VIDEOS_DIRECTORY_NAME, { create: true });
  await writeJsonFile(directory, LIBRARY_FILE_NAME, library);
  await writeJsonFile(directory, LIBRARY_BACKUP_FILE_NAME, library);

  return library;
}

export async function openLibrary(directory: FileSystemDirectoryHandle): Promise<LibraryDocument> {
  const file = await getRequiredFile(directory, LIBRARY_FILE_NAME);
  const contents = await file.text();

  try {
    return parseLibrary(contents);
  } catch (error) {
    if (error instanceof LibraryStorageError) {
      throw error;
    }

    throw new LibraryStorageError('invalid-library', 'Le fichier library.json est illisible.');
  }
}

export async function writeLibrary(
  directory: FileSystemDirectoryHandle,
  library: LibraryDocument,
): Promise<void> {
  validateLibrary(library);

  const previousLibrary = await openLibrary(directory);
  await writeJsonFile(directory, LIBRARY_BACKUP_FILE_NAME, previousLibrary);
  await writeJsonFile(directory, LIBRARY_FILE_NAME, library);
}

function parseLibrary(contents: string): LibraryDocument {
  try {
    return validateLibrary(JSON.parse(contents));
  } catch (error) {
    if (error instanceof LibraryStorageError) {
      throw error;
    }

    throw new LibraryStorageError(
      'invalid-library',
      'Le fichier library.json ne contient pas du JSON valide.',
    );
  }
}

function validateLibrary(value: unknown): LibraryDocument {
  if (!isRecord(value) || value.version !== LIBRARY_VERSION || !Array.isArray(value.movements)) {
    throw new LibraryStorageError(
      'invalid-library',
      'Le fichier library.json ne respecte pas le format attendu.',
    );
  }

  return {
    version: LIBRARY_VERSION,
    movements: value.movements,
  };
}

async function ensureLibraryDoesNotExist(directory: FileSystemDirectoryHandle): Promise<void> {
  try {
    await directory.getFileHandle(LIBRARY_FILE_NAME);
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }

    throw error;
  }

  throw new LibraryStorageError(
    'already-initialized',
    'Ce dossier contient deja une bibliotheque.',
  );
}

async function getRequiredFile(
  directory: FileSystemDirectoryHandle,
  fileName: string,
): Promise<File> {
  try {
    const fileHandle = await directory.getFileHandle(fileName);
    return fileHandle.getFile();
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new LibraryStorageError(
        'invalid-library',
        'Le fichier library.json est introuvable dans ce dossier.',
      );
    }

    throw error;
  }
}

async function writeJsonFile(
  directory: FileSystemDirectoryHandle,
  fileName: string,
  contents: LibraryDocument,
): Promise<void> {
  const fileHandle = await directory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  try {
    await writable.write(`${JSON.stringify(contents, null, 2)}\n`);
    await writable.close();
  } catch (error) {
    await writable.abort();
    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.name === 'NotFoundError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
