import { describe, expect, it, vi } from 'vitest';
import { requestReadWritePermission } from './libraryConnection';

function createDirectoryWithPermission(
  currentPermission: PermissionState,
  requestedPermission: PermissionState = currentPermission,
): {
  directory: FileSystemDirectoryHandle;
  queryPermission: ReturnType<typeof vi.fn>;
  requestPermission: ReturnType<typeof vi.fn>;
} {
  const queryPermission = vi.fn().mockResolvedValue(currentPermission);
  const requestPermission = vi.fn().mockResolvedValue(requestedPermission);

  return {
    directory: {
      kind: 'directory',
      name: 'library',
      queryPermission,
      requestPermission,
    } as unknown as FileSystemDirectoryHandle,
    queryPermission,
    requestPermission,
  };
}

describe('library connection', () => {
  it('uses an existing read-write permission without prompting again', async () => {
    const connection = createDirectoryWithPermission('granted');

    await requestReadWritePermission(connection.directory);

    expect(connection.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(connection.requestPermission).not.toHaveBeenCalled();
  });

  it('requests permission when access has not been granted yet', async () => {
    const connection = createDirectoryWithPermission('prompt', 'granted');

    await requestReadWritePermission(connection.directory);

    expect(connection.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
  });

  it('returns an actionable error when permission is refused', async () => {
    const connection = createDirectoryWithPermission('denied');

    await expect(requestReadWritePermission(connection.directory)).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
});
