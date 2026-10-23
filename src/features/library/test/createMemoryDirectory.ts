type MemoryDirectory = {
  handle: FileSystemDirectoryHandle;
  hasDirectory: (path: string) => boolean;
  readFile: (path: string) => string | undefined;
  writeFile: (path: string, contents: string) => void;
};

export function createMemoryDirectory(): MemoryDirectory {
  const files = new Map<string, string>();
  const directories = new Set<string>();

  const missingEntry = (path: string): Error => {
    const error = new Error(`Entry not found: ${path}`);
    error.name = 'NotFoundError';
    return error;
  };

  const entryPath = (parentPath: string, name: string): string =>
    parentPath ? `${parentPath}/${name}` : name;

  const createDirectoryHandle = (path: string, name: string): FileSystemDirectoryHandle =>
    ({
      kind: 'directory',
      name,
      getDirectoryHandle: async (childName: string, options?: { create?: boolean }) => {
        const childPath = entryPath(path, childName);

        if (!directories.has(childPath) && options?.create) {
          directories.add(childPath);
        }

        if (!directories.has(childPath)) {
          throw missingEntry(childPath);
        }

        return createDirectoryHandle(childPath, childName);
      },
      getFileHandle: async (fileName: string, options?: { create?: boolean }) => {
        const filePath = entryPath(path, fileName);

        if (!files.has(filePath) && options?.create) {
          files.set(filePath, '');
        }

        if (!files.has(filePath)) {
          throw missingEntry(filePath);
        }

        return {
          kind: 'file',
          name: fileName,
          getFile: async () => new File([files.get(filePath) ?? ''], fileName),
          createWritable: async () => ({
            write: async (contents: FileSystemWriteChunkType) => {
              files.set(filePath, await contentsToText(contents));
            },
            close: async () => undefined,
            abort: async () => undefined,
          }),
        } as FileSystemFileHandle;
      },
    }) as unknown as FileSystemDirectoryHandle;

  return {
    handle: createDirectoryHandle('', 'library'),
    hasDirectory: (path) => directories.has(path),
    readFile: (path) => files.get(path),
    writeFile: (path, contents) => files.set(path, contents),
  };
}

async function contentsToText(contents: FileSystemWriteChunkType): Promise<string> {
  if (typeof contents === 'string') {
    return contents;
  }

  if (contents instanceof Blob) {
    return contents.text();
  }

  throw new Error('Unsupported file write.');
}
