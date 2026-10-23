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
import { createMemoryDirectory } from './test/createMemoryDirectory';

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
