import { describe, expect, it } from 'vitest';
import {
  IMAGES_DIRECTORY_NAME,
  LIBRARY_BACKUP_FILE_NAME,
  LIBRARY_FILE_NAME,
  VIDEOS_DIRECTORY_NAME,
  initializeLibrary,
  openLibrary,
  writeLibrary,
} from './libraryStorage';

type MemoryDirectory = {
  handle: FileSystemDirectoryHandle;
  hasDirectory: (name: string) => boolean;
  readFile: (name: string) => string | undefined;
  writeFile: (name: string, contents: string) => void;
};

function createMemoryDirectory(): MemoryDirectory {
  const files = new Map<string, string>();
  const directories = new Set<string>();

  const missingFile = (name: string): Error => {
    const error = new Error(`File not found: ${name}`);
    error.name = 'NotFoundError';
    return error;
  };

  const handle = {
    kind: 'directory',
    name: 'library',
    getDirectoryHandle: async (name: string, options?: { create?: boolean }) => {
      if (!directories.has(name) && options?.create) {
        directories.add(name);
      }

      if (!directories.has(name)) {
        throw missingFile(name);
      }

      return { kind: 'directory', name } as FileSystemDirectoryHandle;
    },
    getFileHandle: async (name: string, options?: { create?: boolean }) => {
      if (!files.has(name) && options?.create) {
        files.set(name, '');
      }

      if (!files.has(name)) {
        throw missingFile(name);
      }

      return {
        kind: 'file',
        name,
        getFile: async () => new File([files.get(name) ?? ''], name),
        createWritable: async () => ({
          write: async (contents: string) => {
            files.set(name, contents);
          },
          close: async () => undefined,
          abort: async () => undefined,
        }),
      } as FileSystemFileHandle;
    },
  } as unknown as FileSystemDirectoryHandle;

  return {
    handle,
    hasDirectory: (name) => directories.has(name),
    readFile: (name) => files.get(name),
    writeFile: (name, contents) => files.set(name, contents),
  };
}

describe('library storage', () => {
  it('initializes the expected library structure', async () => {
    const directory = createMemoryDirectory();

    await initializeLibrary(directory.handle);

    expect(directory.hasDirectory(IMAGES_DIRECTORY_NAME)).toBe(true);
    expect(directory.hasDirectory(VIDEOS_DIRECTORY_NAME)).toBe(true);
    expect(JSON.parse(directory.readFile(LIBRARY_FILE_NAME) ?? '')).toEqual({
      version: 1,
      movements: [],
    });
    expect(JSON.parse(directory.readFile(LIBRARY_BACKUP_FILE_NAME) ?? '')).toEqual({
      version: 1,
      movements: [],
    });
  });

  it('opens an existing valid library', async () => {
    const directory = createMemoryDirectory();
    directory.writeFile(
      LIBRARY_FILE_NAME,
      JSON.stringify({ version: 1, movements: [{ id: 'move-1' }] }),
    );

    await expect(openLibrary(directory.handle)).resolves.toEqual({
      version: 1,
      movements: [{ id: 'move-1' }],
    });
  });

  it('rejects an invalid library file with an actionable error', async () => {
    const directory = createMemoryDirectory();
    directory.writeFile(LIBRARY_FILE_NAME, '{ not json');

    await expect(openLibrary(directory.handle)).rejects.toMatchObject({
      code: 'invalid-library',
    });
  });

  it('writes a backup before replacing the library file', async () => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);

    await writeLibrary(directory.handle, { version: 1, movements: [{ id: 'move-2' }] });

    expect(JSON.parse(directory.readFile(LIBRARY_BACKUP_FILE_NAME) ?? '')).toEqual({
      version: 1,
      movements: [],
    });
    expect(JSON.parse(directory.readFile(LIBRARY_FILE_NAME) ?? '')).toEqual({
      version: 1,
      movements: [{ id: 'move-2' }],
    });
  });
});
