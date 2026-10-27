import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Movement } from '../model';
import { MovementEditForm } from './MovementEditForm';

const movement: Movement = {
  id: 'cross-body-lead',
  name: 'Cross body lead',
  level: 2,
  notes: 'Guide the follower across the line.',
  schemaImagePaths: Array.from(
    { length: 8 },
    (_, index) => `images/cross-body-lead/${index + 1}.png`,
  ),
  video: { kind: 'external-url', url: 'https://example.com/cross-body-lead' },
  createdAt: '2026-10-23T12:00:00.000Z',
};

function renderForm(initialMovement = movement) {
  const onSave = vi.fn().mockResolvedValue(initialMovement);
  const onUpdated = vi.fn();

  render(
    <MemoryRouter initialEntries={[`/movements/${initialMovement.id}/edit`]}>
      <Routes>
        <Route
          path="/movements/:movementId/edit"
          element={
            <MovementEditForm
              getMovement={vi.fn().mockResolvedValue(initialMovement)}
              onSave={onSave}
              onUpdated={onUpdated}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );

  return { onSave, onUpdated };
}

describe('MovementEditForm', () => {
  afterEach(cleanup);

  it('pre-fills the movement and retains its existing media on save', async () => {
    const { onSave, onUpdated } = renderForm();

    expect(await screen.findByDisplayValue('Cross body lead')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Guide the follower across the line.')).toBeInTheDocument();
    expect(screen.getByLabelText('Lien externe')).toBeChecked();
    expect(screen.getByDisplayValue('https://example.com/cross-body-lead')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nom'), {
      target: { value: 'Cross body lead with turn' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(movement.id, {
        name: 'Cross body lead with turn',
        level: 2,
        notes: movement.notes,
        schemaImages: movement.schemaImagePaths.map((path) => ({ kind: 'existing', path })),
        video: movement.video,
      });
    });
    expect(onUpdated).toHaveBeenCalledWith(movement);
  });

  it('replaces selected schema images and a local video', async () => {
    const localMovement: Movement = {
      ...movement,
      video: {
        kind: 'local-file',
        path: 'videos/cross-body-lead/video.webm',
        mimeType: 'video/webm',
      },
    };
    const { onSave } = renderForm(localMovement);
    const replacementImage = new File(['image'], 'replacement.jpg', { type: 'image/jpeg' });
    const replacementVideo = new File(['video'], 'replacement.mp4', { type: 'video/mp4' });

    expect(await screen.findByText('Video locale actuelle')).toBeInTheDocument();
    fireEvent.change(screen.getAllByLabelText('Remplacer')[0], {
      target: { files: [replacementImage] },
    });
    fireEvent.change(screen.getByLabelText('Remplacer la video'), {
      target: { files: [replacementVideo] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(localMovement.id, {
        name: localMovement.name,
        level: localMovement.level,
        notes: localMovement.notes,
        schemaImages: [
          { kind: 'new', file: replacementImage },
          ...localMovement.schemaImagePaths.slice(1).map((path) => ({ kind: 'existing', path })),
        ],
        video: { kind: 'local-file', file: replacementVideo },
      });
    });
  });

  it('requires all eight images when adding a schema', async () => {
    const { onSave } = renderForm({ ...movement, schemaImagePaths: [], video: undefined });

    expect(await screen.findByRole('button', { name: 'Ajouter un schema' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un schema' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(
      await screen.findByText('Un schema doit contenir exactement huit images.'),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves after removing the last visual medium', async () => {
    const mediaOnlyMovement: Movement = { ...movement, schemaImagePaths: [] };
    const { onSave } = renderForm(mediaOnlyMovement);

    expect(await screen.findByLabelText('Lien externe')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Aucune video'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(mediaOnlyMovement.id, {
        name: mediaOnlyMovement.name,
        level: mediaOnlyMovement.level,
        notes: mediaOnlyMovement.notes,
        schemaImages: [],
      });
    });
  });

  it('keeps entered values when saving fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Ecriture impossible.'));

    render(
      <MemoryRouter initialEntries={[`/movements/${movement.id}/edit`]}>
        <Routes>
          <Route
            path="/movements/:movementId/edit"
            element={
              <MovementEditForm
                getMovement={vi.fn().mockResolvedValue(movement)}
                onSave={onSave}
                onUpdated={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByDisplayValue('Cross body lead')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Changed name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ecriture impossible.');
    expect(screen.getByDisplayValue('Changed name')).toBeInTheDocument();
  });
});
