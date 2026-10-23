import {
  LEVELS,
  type CreateMovementInput,
  type Level,
  type Movement,
  type VideoSource,
} from './model';

export class MovementValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MovementValidationError';
  }
}

export function validateCreateMovement(input: CreateMovementInput): void {
  if (!input.name.trim()) {
    throw new MovementValidationError('Le nom du mouvement est obligatoire.');
  }

  if (!isLevel(input.level)) {
    throw new MovementValidationError('Le niveau doit etre compris entre 1 et 4.');
  }

  if (!input.notes.trim()) {
    throw new MovementValidationError('Les notes du mouvement sont obligatoires.');
  }

  const schemaImages = input.schemaImages ?? [];

  if (schemaImages.length !== 0 && schemaImages.length !== 8) {
    throw new MovementValidationError('Un schema doit contenir exactement huit images.');
  }

  if (schemaImages.some((image) => !image.type.startsWith('image/'))) {
    throw new MovementValidationError('Chaque element du schema doit etre une image.');
  }

  if (!schemaImages.length && !input.video) {
    throw new MovementValidationError('Un schema ou une video est obligatoire.');
  }

  if (!input.video) {
    return;
  }

  if (input.video.kind === 'external-url') {
    validateExternalVideoUrl(input.video.url);
    return;
  }

  if (!input.video.file.type.startsWith('video/')) {
    throw new MovementValidationError('Le fichier choisi doit etre une video.');
  }
}

export function parseMovement(value: unknown): Movement {
  if (!isRecord(value)) {
    throw new MovementValidationError('Un mouvement enregistre est invalide.');
  }

  const { id, name, level, notes, schemaImagePaths, video, createdAt } = value;

  if (
    typeof id !== 'string' ||
    !id ||
    typeof name !== 'string' ||
    !name.trim() ||
    !isLevel(level) ||
    typeof notes !== 'string' ||
    !notes.trim() ||
    typeof createdAt !== 'string' ||
    !createdAt ||
    !isSchemaPaths(schemaImagePaths) ||
    (schemaImagePaths.length === 0 && !video)
  ) {
    throw new MovementValidationError('Un mouvement enregistre est invalide.');
  }

  const parsedVideo = video === undefined ? undefined : parseVideoSource(video);

  return {
    id,
    name,
    level,
    notes,
    schemaImagePaths,
    ...(parsedVideo ? { video: parsedVideo } : {}),
    createdAt,
  };
}

function parseVideoSource(value: unknown): VideoSource {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new MovementValidationError('La source video est invalide.');
  }

  if (value.kind === 'external-url' && typeof value.url === 'string') {
    validateExternalVideoUrl(value.url);
    return { kind: 'external-url', url: value.url };
  }

  if (
    value.kind === 'local-file' &&
    typeof value.path === 'string' &&
    value.path &&
    typeof value.mimeType === 'string' &&
    value.mimeType.startsWith('video/')
  ) {
    return { kind: 'local-file', path: value.path, mimeType: value.mimeType };
  }

  throw new MovementValidationError('La source video est invalide.');
}

function validateExternalVideoUrl(value: string): void {
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

function isLevel(value: unknown): value is Level {
  return typeof value === 'number' && LEVELS.includes(value as Level);
}

function isSchemaPaths(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    (value.length === 0 || value.length === 8) &&
    value.every((path) => typeof path === 'string' && path)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
