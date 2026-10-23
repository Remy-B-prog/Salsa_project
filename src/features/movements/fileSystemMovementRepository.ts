import {
  IMAGES_DIRECTORY_NAME,
  openLibrary,
  VIDEOS_DIRECTORY_NAME,
  writeLibrary,
} from '../library/libraryStorage';
import type {
  CreateMovementInput,
  Level,
  Movement,
  MovementRepository,
  VideoSource,
} from './model';
import { parseMovement, validateCreateMovement } from './validation';

type RepositoryOptions = {
  createId?: () => string;
  now?: () => string;
};

export class FileSystemMovementRepository implements MovementRepository {
  private readonly createId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly directory: FileSystemDirectoryHandle,
    options: RepositoryOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID());
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async create(input: CreateMovementInput): Promise<Movement> {
    validateCreateMovement(input);

    const id = this.createId();
    const schemaImagePaths = await copySchemaImages(this.directory, id, input.schemaImages ?? []);
    const video = input.video
      ? await createVideoSource(this.directory, id, input.video)
      : undefined;
    const movement: Movement = {
      id,
      name: input.name.trim(),
      level: input.level,
      notes: input.notes.trim(),
      schemaImagePaths,
      ...(video ? { video } : {}),
      createdAt: this.now(),
    };

    const library = await openLibrary(this.directory);
    const movements = this.parseMovements(library.movements);
    await writeLibrary(this.directory, { ...library, movements: [...movements, movement] });

    return movement;
  }

  async getById(id: string): Promise<Movement | undefined> {
    const library = await openLibrary(this.directory);
    return this.parseMovements(library.movements).find((movement) => movement.id === id);
  }

  async listByLevel(level: Level): Promise<Movement[]> {
    const library = await openLibrary(this.directory);
    return this.parseMovements(library.movements).filter((movement) => movement.level === level);
  }

  private parseMovements(movements: unknown[]): Movement[] {
    return movements.map(parseMovement);
  }
}

async function copySchemaImages(
  rootDirectory: FileSystemDirectoryHandle,
  movementId: string,
  images: File[],
): Promise<string[]> {
  if (!images.length) {
    return [];
  }

  const imagesDirectory = await rootDirectory.getDirectoryHandle(IMAGES_DIRECTORY_NAME, {
    create: true,
  });
  const movementDirectory = await imagesDirectory.getDirectoryHandle(movementId, { create: true });
  const paths: string[] = [];

  for (const [index, image] of images.entries()) {
    const fileName = `${index + 1}${fileExtension(image.name)}`;
    await copyFile(movementDirectory, fileName, image);
    paths.push(`${IMAGES_DIRECTORY_NAME}/${movementId}/${fileName}`);
  }

  return paths;
}

async function createVideoSource(
  rootDirectory: FileSystemDirectoryHandle,
  movementId: string,
  video: NonNullable<CreateMovementInput['video']>,
): Promise<VideoSource> {
  if (video.kind === 'external-url') {
    return { kind: 'external-url', url: video.url };
  }

  const videosDirectory = await rootDirectory.getDirectoryHandle(VIDEOS_DIRECTORY_NAME, {
    create: true,
  });
  const movementDirectory = await videosDirectory.getDirectoryHandle(movementId, { create: true });
  const fileName = `video${fileExtension(video.file.name)}`;
  await copyFile(movementDirectory, fileName, video.file);

  return {
    kind: 'local-file',
    path: `${VIDEOS_DIRECTORY_NAME}/${movementId}/${fileName}`,
    mimeType: video.file.type,
  };
}

async function copyFile(
  directory: FileSystemDirectoryHandle,
  fileName: string,
  file: File,
): Promise<void> {
  const fileHandle = await directory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();

  try {
    await writable.write(file);
    await writable.close();
  } catch (error) {
    await writable.abort();
    throw error;
  }
}

function fileExtension(fileName: string): string {
  const extensionStart = fileName.lastIndexOf('.');
  return extensionStart > 0 ? fileName.slice(extensionStart) : '';
}
