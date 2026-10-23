const DATABASE_NAME = 'salsa-library-settings';
const DATABASE_VERSION = 1;
const STORE_NAME = 'settings';
const DIRECTORY_KEY = 'library-directory';

export async function saveLibraryDirectory(directory: FileSystemDirectoryHandle): Promise<void> {
  const database = await openDatabase();

  if (!database) {
    return;
  }

  try {
    await runRequest(
      database
        .transaction(STORE_NAME, 'readwrite')
        .objectStore(STORE_NAME)
        .put(directory, DIRECTORY_KEY),
    );
  } finally {
    database.close();
  }
}

export async function loadLibraryDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const database = await openDatabase();

  if (!database) {
    return null;
  }

  try {
    const directory = await runRequest<unknown>(
      database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(DIRECTORY_KEY),
    );

    return isDirectoryHandle(directory) ? directory : null;
  } finally {
    database.close();
  }
}

async function openDatabase(): Promise<IDBDatabase | null> {
  if (!('indexedDB' in globalThis)) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isDirectoryHandle(value: unknown): value is FileSystemDirectoryHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'directory' &&
    'queryPermission' in value
  );
}
