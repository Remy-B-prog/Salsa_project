export async function createLibraryMediaUrl(
  directory: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<string> {
  const pathSegments = relativePath.split('/');

  if (
    pathSegments.length < 2 ||
    pathSegments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('Le chemin du media est invalide.');
  }

  const fileName = pathSegments.pop();
  if (!fileName) {
    throw new Error('Le chemin du media est invalide.');
  }

  let currentDirectory = directory;

  for (const directoryName of pathSegments) {
    currentDirectory = await currentDirectory.getDirectoryHandle(directoryName);
  }

  const file = await (await currentDirectory.getFileHandle(fileName)).getFile();
  return URL.createObjectURL(file);
}
