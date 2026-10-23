import { describe, expect, it } from 'vitest';
import { initializeLibrary, openLibrary } from '../library/libraryStorage';
import { createMemoryDirectory } from '../library/test/createMemoryDirectory';
import { FileSystemMovementRepository } from './fileSystemMovementRepository';
import type { CreateMovementInput, Level } from './model';

const schemaImages = Array.from(
  { length: 8 },
  (_, index) => new File([`image-${index + 1}`], `source-${index + 1}.png`, { type: 'image/png' }),
);

const invalidInputs: { name: string; input: CreateMovementInput; message: string }[] = [
  {
    name: 'does not accept an empty name',
    input: {
      name: ' ',
      level: 1,
      notes: 'Keep the timing.',
      video: { kind: 'external-url', url: 'https://example.com/video' },
    },
    message: 'Le nom du mouvement est obligatoire.',
  },
  {
    name: 'does not accept a level outside the allowed range',
    input: {
      name: 'Basic step',
      level: 5 as Level,
      notes: 'Keep the timing.',
      video: { kind: 'external-url', url: 'https://example.com/video' },
    },
    message: 'Le niveau doit etre compris entre 1 et 4.',
  },
  {
    name: 'does not accept empty notes',
    input: {
      name: 'Basic step',
      level: 1,
      notes: ' ',
      video: { kind: 'external-url', url: 'https://example.com/video' },
    },
    message: 'Les notes du mouvement sont obligatoires.',
  },
  {
    name: 'does not accept a movement without visual media',
    input: { name: 'Basic step', level: 1, notes: 'Keep the timing.' },
    message: 'Un schema ou une video est obligatoire.',
  },
  {
    name: 'does not accept an incomplete schema',
    input: {
      name: 'Basic step',
      level: 1,
      notes: 'Keep the timing.',
      schemaImages: schemaImages.slice(0, 7),
    },
    message: 'Un schema doit contenir exactement huit images.',
  },
  {
    name: 'does not accept a schema containing a non-image file',
    input: {
      name: 'Basic step',
      level: 1,
      notes: 'Keep the timing.',
      schemaImages: [
        ...schemaImages.slice(0, 7),
        new File(['text'], 'notes.txt', { type: 'text/plain' }),
      ],
    },
    message: 'Chaque element du schema doit etre une image.',
  },
  {
    name: 'does not accept an invalid external video URL',
    input: {
      name: 'Basic step',
      level: 1,
      notes: 'Keep the timing.',
      video: { kind: 'external-url', url: 'ftp://example.com/video' },
    },
    message: 'L URL video doit utiliser http ou https.',
  },
  {
    name: 'does not accept a non-video local file',
    input: {
      name: 'Basic step',
      level: 1,
      notes: 'Keep the timing.',
      video: {
        kind: 'local-file',
        file: new File(['text'], 'notes.txt', { type: 'text/plain' }),
      },
    },
    message: 'Le fichier choisi doit etre une video.',
  },
];

function createRepository(directory: FileSystemDirectoryHandle) {
  return new FileSystemMovementRepository(directory, {
    createId: () => 'cross-body-lead',
    now: () => '2026-10-23T12:00:00.000Z',
  });
}

describe('file system movement repository', () => {
  it('creates a movement, copies its media, and persists relative paths', async () => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);
    const repository = createRepository(directory.handle);

    const movement = await repository.create({
      name: ' Cross body lead ',
      level: 2,
      notes: ' Guide the follower across the line. ',
      schemaImages,
      video: {
        kind: 'local-file',
        file: new File(['video'], 'demo.webm', { type: 'video/webm' }),
      },
    });

    expect(movement).toEqual({
      id: 'cross-body-lead',
      name: 'Cross body lead',
      level: 2,
      notes: 'Guide the follower across the line.',
      schemaImagePaths: [
        'images/cross-body-lead/1.png',
        'images/cross-body-lead/2.png',
        'images/cross-body-lead/3.png',
        'images/cross-body-lead/4.png',
        'images/cross-body-lead/5.png',
        'images/cross-body-lead/6.png',
        'images/cross-body-lead/7.png',
        'images/cross-body-lead/8.png',
      ],
      video: {
        kind: 'local-file',
        path: 'videos/cross-body-lead/video.webm',
        mimeType: 'video/webm',
      },
      createdAt: '2026-10-23T12:00:00.000Z',
    });
    expect(directory.readFile('images/cross-body-lead/1.png')).toBe('image-1');
    expect(directory.readFile('videos/cross-body-lead/video.webm')).toBe('video');
    await expect(openLibrary(directory.handle)).resolves.toEqual({
      version: 1,
      movements: [movement],
    });
  });

  it('keeps an external URL without writing a video file', async () => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);
    const repository = createRepository(directory.handle);

    const movement = await repository.create({
      name: 'Dile que no',
      level: 3,
      notes: 'Return to the open position.',
      video: { kind: 'external-url', url: 'https://example.com/dile-que-no' },
    });

    expect(movement.video).toEqual({
      kind: 'external-url',
      url: 'https://example.com/dile-que-no',
    });
    expect(directory.hasDirectory('videos/cross-body-lead')).toBe(false);
  });

  it('retrieves a movement by id and lists movements by level', async () => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);
    const repository = createRepository(directory.handle);
    const movement = await repository.create({
      name: 'Inside turn',
      level: 2,
      notes: 'Prepare on counts one and two.',
      schemaImages,
    });

    await expect(repository.getById(movement.id)).resolves.toEqual(movement);
    await expect(repository.getById('missing')).resolves.toBeUndefined();
    await expect(repository.listByLevel(2)).resolves.toEqual([movement]);
    await expect(repository.listByLevel(1)).resolves.toEqual([]);
  });

  it.each(invalidInputs)('$name', async ({ input, message }) => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);
    const repository = createRepository(directory.handle);

    await expect(repository.create(input)).rejects.toThrow(message);
  });
});
