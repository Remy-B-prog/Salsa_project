import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Movement } from '../model';
import { MovementDetail } from './MovementDetail';

const schemaPaths = Array.from(
  { length: 8 },
  (_, index) => `images/cross-body-lead/${index + 1}.png`,
);

const movement: Movement = {
  id: 'cross-body-lead',
  name: 'Cross body lead',
  level: 2,
  notes: 'Guide the follower across the line.',
  schemaImagePaths: schemaPaths,
  createdAt: '2026-10-23T12:00:00.000Z',
};

function renderDetail(
  loadedMovement: Movement,
  loadMedia = vi.fn(async (path: string) => `blob:${path}`),
) {
  const getMovement = vi.fn().mockResolvedValue(loadedMovement);

  render(
    <MemoryRouter initialEntries={['/movements/cross-body-lead']}>
      <Routes>
        <Route
          path="/movements/:movementId"
          element={<MovementDetail getMovement={getMovement} loadMedia={loadMedia} />}
        />
      </Routes>
    </MemoryRouter>,
  );

  return { getMovement, loadMedia };
}

function stubObjectUrlApi(): void {
  class TestUrl extends URL {
    static revokeObjectURL = vi.fn();
  }

  vi.stubGlobal('URL', TestUrl);
}

describe('MovementDetail', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows the movement information and its schema in time order', async () => {
    stubObjectUrlApi();
    const { loadMedia } = renderDetail(movement);

    expect(await screen.findByRole('heading', { name: 'Cross body lead' })).toBeInTheDocument();
    expect(screen.getByText('Guide the follower across the line.')).toBeInTheDocument();
    const images = await screen.findAllByRole('img');

    expect(images.map((image) => image.getAttribute('alt'))).toEqual([
      'Temps 1',
      'Temps 2',
      'Temps 3',
      'Temps 4',
      'Temps 5',
      'Temps 6',
      'Temps 7',
      'Temps 8',
    ]);
    expect(loadMedia).toHaveBeenNthCalledWith(1, schemaPaths[0]);
    expect(loadMedia).toHaveBeenNthCalledWith(8, schemaPaths[7]);
  });

  it('uses the native video player for a local video', async () => {
    stubObjectUrlApi();
    const loadMedia = vi.fn(async (path: string) => `blob:${path}`);
    renderDetail(
      {
        ...movement,
        schemaImagePaths: [],
        video: {
          kind: 'local-file',
          path: 'videos/cross-body-lead/video.webm',
          mimeType: 'video/webm',
        },
      },
      loadMedia,
    );

    expect(await screen.findByText('Video')).toBeInTheDocument();
    expect(
      await screen.findByText('Votre navigateur ne peut pas lire cette video.'),
    ).toBeInTheDocument();
    expect(document.querySelector('video')).toHaveAttribute(
      'src',
      'blob:videos/cross-body-lead/video.webm',
    );
  });

  it('embeds an external video without loading a local file', async () => {
    const loadMedia = vi.fn();
    renderDetail(
      {
        ...movement,
        schemaImagePaths: [],
        video: { kind: 'external-url', url: 'https://example.com/cross-body-lead' },
      },
      loadMedia,
    );

    expect(await screen.findByTitle('Video du mouvement')).toHaveAttribute(
      'src',
      'https://example.com/cross-body-lead',
    );
    expect(loadMedia).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'a standard video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embeddedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    },
    {
      name: 'a Short',
      url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      embeddedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    },
  ])('converts $name to its embedded player URL', async ({ url, embeddedUrl }) => {
    renderDetail({
      ...movement,
      schemaImagePaths: [],
      video: { kind: 'external-url', url },
    });

    expect(await screen.findByTitle('Video du mouvement')).toHaveAttribute('src', embeddedUrl);
  });

  it('keeps the movement visible when an image or local video is unavailable', async () => {
    stubObjectUrlApi();
    const loadMedia = vi.fn(async (path: string) => {
      if (path.endsWith('2.png') || path.endsWith('video.webm')) {
        throw new Error('Media missing');
      }

      return `blob:${path}`;
    });
    renderDetail(
      {
        ...movement,
        video: {
          kind: 'local-file',
          path: 'videos/cross-body-lead/video.webm',
          mimeType: 'video/webm',
        },
      },
      loadMedia,
    );

    expect(await screen.findByText('Image du temps 2 indisponible.')).toBeInTheDocument();
    expect(await screen.findByText('Video indisponible.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cross body lead' })).toBeInTheDocument();
    expect(screen.getByText('Guide the follower across the line.')).toBeInTheDocument();
  });
});
