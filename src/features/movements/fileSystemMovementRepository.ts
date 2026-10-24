import {
  IMAGES_DIRECTORY_NAME,
  openLibrary,
  removeLibraryMediaPaths,
  resumePendingMediaCleanups,
  VIDEOS_DIRECTORY_NAME,
  writeLibrary,
  type PendingMediaCleanup,
} from '../library/libraryStorage';
import type {
  CreateMovementInput,
  Level,
  Movement,
  MovementDeletionResult,
  MovementRepository,
  SchemaImageUpdate,
  UpdateMovementInput,
  VideoUpdateSource,
  VideoSource,
} from './model';
import { MovementValidationError, parseMovement, validateCreateMovement } from './validation';

type RepositoryOptions = {
  createId?: () => string;
  createMediaId?: () => string;
  now?: () => string;
};

export class FileSystemMovementRepository implements MovementRepository {
  private readonly createId: () => string;
  private readonly createMediaId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly directory: FileSystemDirectoryHandle,
    options: RepositoryOptions = {},
  ) {
    this.createId = options.createId ?? (() => crypto.randomUUID());
    this.createMediaId = options.createMediaId ?? (() => crypto.randomUUID());
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

  async delete(id: string): Promise<MovementDeletionResult> {
    const library = await openLibrary(this.directory);
    const movements = this.parseMovements(library.movements);
    const movement = movements.find((item) => item.id === id);

    if (!movement) {
      throw new MovementRepositoryError('not-found', 'Le mouvement a supprimer est introuvable.');
    }

    const cleanup = pendingCleanupFor(movement);
    const pendingMediaCleanups = cleanup
      ? [...(library.pendingMediaCleanups ?? []), cleanup]
      : library.pendingMediaCleanups;
    await writeLibrary(this.directory, {
      version: library.version,
      movements: movements.filter((item) => item.id !== id),
      ...(pendingMediaCleanups?.length ? { pendingMediaCleanups } : {}),
    });

    if (!cleanup) {
      return { cleanupPending: false };
    }

    try {
      const updatedLibrary = await resumePendingMediaCleanups(this.directory);
      const cleanupPending = (updatedLibrary.pendingMediaCleanups ?? []).some((pendingCleanup) =>
        pendingCleanup.paths.some((path) => cleanup.paths.includes(path)),
      );

      return { cleanupPending };
    } catch {
      return { cleanupPending: true };
    }
  }

  async update(id: string, input: UpdateMovementInput): Promise<Movement> {
    validateUpdateMovement(input);

    const library = await openLibrary(this.directory);
    const movements = this.parseMovements(library.movements);
    const previousMovement = movements.find((movement) => movement.id === id);

    if (!previousMovement) {
      throw new MovementRepositoryError('not-found', 'Le mouvement a modifier est introuvable.');
    }

    validateExistingMediaReferences(input, previousMovement);

    const copiedPaths: string[] = [];

    try {
      const schemaImagePaths = await copyUpdatedSchemaImages(
        this.directory,
        previousMovement.id,
        input.schemaImages ?? [],
        this.createMediaId(),
        copiedPaths,
      );
      const video = input.video
        ? await createUpdatedVideoSource(
            this.directory,
            previousMovement.id,
            input.video,
            this.createMediaId(),
            copiedPaths,
          )
        : undefined;
      const movement: Movement = {
        id: previousMovement.id,
        name: input.name.trim(),
        level: input.level,
        notes: input.notes.trim(),
        schemaImagePaths,
        ...(video ? { video } : {}),
        createdAt: previousMovement.createdAt,
      };
      const cleanupPaths = unusedLocalMediaPaths(previousMovement, movement);
      const pendingMediaCleanups = cleanupPaths.length
        ? [...(library.pendingMediaCleanups ?? []), { paths: cleanupPaths }]
        : library.pendingMediaCleanups;

      await writeLibrary(this.directory, {
        version: library.version,
        movements: movements.map((item) => (item.id === id ? movement : item)),
        ...(pendingMediaCleanups?.length ? { pendingMediaCleanups } : {}),
      });

      if (cleanupPaths.length) {
        try {
          await resumePendingMediaCleanups(this.directory);
        } catch {
          // The pending cleanup remains in library.json and will be retried on the next connection.
        }
      }

      return movement;
    } catch (error) {
      await removeLibraryMediaPaths(this.directory, copiedPaths).catch(() => undefined);
      throw error;
    }
  }

  private parseMovements(movements: unknown[]): Movement[] {
    return movements.map(parseMovement);
  }
}

export class MovementRepositoryError extends Error {
  constructor(
    public readonly code: 'not-found',
    message: string,
  ) {
    super(message);
    this.name = 'MovementRepositoryError';
  }
}

function pendingCleanupFor(movement: Movement): PendingMediaCleanup | undefined {
  const paths = [
    ...(movement.schemaImagePaths.length ? [`${IMAGES_DIRECTORY_NAME}/${movement.id}`] : []),
    ...(movement.video?.kind === 'local-file' ? [`${VIDEOS_DIRECTORY_NAME}/${movement.id}`] : []),
  ];

  return paths.length ? { paths } : undefined;
}

function validateUpdateMovement(input: UpdateMovementInput): void {
  if (!input.name.trim()) {
    throw new MovementValidationError('Le nom du mouvement est obligatoire.');
  }

  if (![1, 2, 3, 4].includes(input.level)) {
    throw new MovementValidationError('Le niveau doit etre compris entre 1 et 4.');
  }

  if (!input.notes.trim()) {
    throw new MovementValidationError('Les notes du mouvement sont obligatoires.');
  }

  const schemaImages = input.schemaImages ?? [];

  if (schemaImages.length !== 0 && schemaImages.length !== 8) {
    throw new MovementValidationError('Un schema doit contenir exactement huit images.');
  }

  if (
    schemaImages.some(
      (image) =>
        (image.kind === 'existing' && !image.path) ||
        (image.kind === 'new' && !image.file.type.startsWith('image/')),
    )
  ) {
    throw new MovementValidationError('Chaque element du schema doit etre une image.');
  }

  if (!schemaImages.length && !input.video) {
    throw new MovementValidationError('Un schema ou une video est obligatoire.');
  }

  if (input.video?.kind === 'external-url') {
    validateExternalUrl(input.video.url);
  }

  if (isNewLocalVideo(input.video) && !input.video.file.type.startsWith('video/')) {
    throw new MovementValidationError('Le fichier choisi doit etre une video.');
  }

  if (
    input.video?.kind === 'local-file' &&
    !isNewLocalVideo(input.video) &&
    (!input.video.path || !input.video.mimeType.startsWith('video/'))
  ) {
    throw new MovementValidationError('La source video est invalide.');
  }
}

function validateExistingMediaReferences(
  input: UpdateMovementInput,
  previousMovement: Movement,
): void {
  const previousSchemaPaths = new Set(previousMovement.schemaImagePaths);

  if (
    (input.schemaImages ?? []).some(
      (image) => image.kind === 'existing' && !previousSchemaPaths.has(image.path),
    )
  ) {
    throw new MovementValidationError('Le schema contient une image inexistante.');
  }

  if (
    input.video?.kind === 'local-file' &&
    !isNewLocalVideo(input.video) &&
    (previousMovement.video?.kind !== 'local-file' ||
      input.video.path !== previousMovement.video.path ||
      input.video.mimeType !== previousMovement.video.mimeType)
  ) {
    throw new MovementValidationError('La video locale existante est invalide.');
  }
}

async function copyUpdatedSchemaImages(
  rootDirectory: FileSystemDirectoryHandle,
  movementId: string,
  images: SchemaImageUpdate[],
  mediaId: string,
  copiedPaths: string[],
): Promise<string[]> {
  const paths: string[] = [];

  for (const [index, image] of images.entries()) {
    if (image.kind === 'existing') {
      paths.push(image.path);
      continue;
    }

    const fileName = `${mediaId}-${index + 1}${fileExtension(image.file.name)}`;
    const directory = await getMovementMediaDirectory(
      rootDirectory,
      IMAGES_DIRECTORY_NAME,
      movementId,
    );
    await copyFile(directory, fileName, image.file);
    const path = `${IMAGES_DIRECTORY_NAME}/${movementId}/${fileName}`;
    copiedPaths.push(path);
    paths.push(path);
  }

  return paths;
}

async function createUpdatedVideoSource(
  rootDirectory: FileSystemDirectoryHandle,
  movementId: string,
  video: VideoUpdateSource,
  mediaId: string,
  copiedPaths: string[],
): Promise<VideoSource> {
  if (video.kind === 'external-url' || !isNewLocalVideo(video)) {
    return video;
  }

  const fileName = `video-${mediaId}${fileExtension(video.file.name)}`;
  const directory = await getMovementMediaDirectory(
    rootDirectory,
    VIDEOS_DIRECTORY_NAME,
    movementId,
  );
  await copyFile(directory, fileName, video.file);
  const path = `${VIDEOS_DIRECTORY_NAME}/${movementId}/${fileName}`;
  copiedPaths.push(path);

  return { kind: 'local-file', path, mimeType: video.file.type };
}

async function getMovementMediaDirectory(
  rootDirectory: FileSystemDirectoryHandle,
  mediaDirectoryName: string,
  movementId: string,
): Promise<FileSystemDirectoryHandle> {
  const mediaDirectory = await rootDirectory.getDirectoryHandle(mediaDirectoryName, {
    create: true,
  });
  return mediaDirectory.getDirectoryHandle(movementId, { create: true });
}

function unusedLocalMediaPaths(previousMovement: Movement, movement: Movement): string[] {
  const activePaths = new Set(localMediaPaths(movement));
  return localMediaPaths(previousMovement).filter((path) => !activePaths.has(path));
}

function localMediaPaths(movement: Movement): string[] {
  return [
    ...movement.schemaImagePaths,
    ...(movement.video?.kind === 'local-file' ? [movement.video.path] : []),
  ];
}

function isNewLocalVideo(
  video: VideoUpdateSource | undefined,
): video is { kind: 'local-file'; file: File } {
  return video?.kind === 'local-file' && 'file' in video;
}

function validateExternalUrl(value: string): void {
  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new MovementValidationError('L URL video doit utiliser http ou https.');
    }
  } catch (error) {
    if (error instanceof MovementValidationError) {
      throw error;
    }

    throw new MovementValidationError('L URL video est invalide.');
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
