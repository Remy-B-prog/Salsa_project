import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeLibrary } from './libraryStorage';
import { createMemoryDirectory } from './test/createMemoryDirectory';
import { createLibraryMediaUrl } from './libraryMediaReader';

describe('library media reader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a browser URL from a relative file path in the library', async () => {
    class TestUrl extends URL {
      static createObjectURL = vi.fn(() => 'blob:cross-body-lead');
    }

    vi.stubGlobal('URL', TestUrl);
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);
    const imagesDirectory = await directory.handle.getDirectoryHandle('images');
    const movementDirectory = await imagesDirectory.getDirectoryHandle('cross-body-lead', {
      create: true,
    });
    const fileHandle = await movementDirectory.getFileHandle('1.png', { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write('image');
    await writable.close();

    await expect(
      createLibraryMediaUrl(directory.handle, 'images/cross-body-lead/1.png'),
    ).resolves.toBe('blob:cross-body-lead');
    expect(TestUrl.createObjectURL).toHaveBeenCalledOnce();
  });

  it('rejects a path that escapes the library directory', async () => {
    const directory = createMemoryDirectory();

    await expect(createLibraryMediaUrl(directory.handle, '../outside.png')).rejects.toThrow(
      'Le chemin du media est invalide.',
    );
  });
});
