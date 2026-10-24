import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Movement } from '../model';
import { MovementForm } from './MovementForm';

const createdMovement: Movement = {
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
  createdAt: '2026-10-23T12:00:00.000Z',
};

const schemaImages = Array.from(
  { length: 8 },
  (_, index) => new File([`image-${index + 1}`], `${index + 1}.png`, { type: 'image/png' }),
);

function renderForm(onSave = vi.fn().mockResolvedValue(createdMovement), onCreated = vi.fn()) {
  return {
    onSave,
    onCreated,
    ...render(
      <MemoryRouter>
        <MovementForm onSave={onSave} onCreated={onCreated} />
      </MemoryRouter>,
    ),
  };
}

function fillMovementDetails(): void {
  fireEvent.change(screen.getByLabelText('Nom'), { target: { value: 'Cross body lead' } });
  fireEvent.change(screen.getByLabelText('Niveau'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Notes'), {
    target: { value: 'Guide the follower across the line.' },
  });
}

function fillSchema(): void {
  screen.getAllByLabelText(/^Importer$/).forEach((input, index) => {
    fireEvent.change(input, { target: { files: [schemaImages[index]] } });
  });
}

function stubObjectUrls(): void {
  class TestUrl extends URL {
    static createObjectURL = vi.fn((file: File) => `blob:${file.name}`);
    static revokeObjectURL = vi.fn();
  }

  vi.stubGlobal('URL', TestUrl);
}

describe('MovementForm', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows field errors without saving an incomplete movement', async () => {
    stubObjectUrls();
    const { onSave } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    expect(await screen.findByText('Le nom du mouvement est obligatoire.')).toBeInTheDocument();
    expect(screen.getByText('Choisis un niveau entre 1 et 4.')).toBeInTheDocument();
    expect(screen.getByText('Les notes du mouvement sont obligatoires.')).toBeInTheDocument();
    expect(screen.getByText('Ajoute un schema ou une video.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a movement with eight images and navigates to its future detail route', async () => {
    stubObjectUrls();
    const { onSave, onCreated } = renderForm();
    fillMovementDetails();
    fillSchema();

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Cross body lead',
        level: 2,
        notes: 'Guide the follower across the line.',
        schemaImages,
      });
    });
    expect(onCreated).toHaveBeenCalledWith(createdMovement);
  });

  it('keeps entered data when storage fails', async () => {
    stubObjectUrls();
    const { onCreated } = renderForm(vi.fn().mockRejectedValue(new Error('Ecriture impossible.')));
    fillMovementDetails();
    fillSchema();

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ecriture impossible.');
    expect(screen.getByLabelText('Nom')).toHaveValue('Cross body lead');
    expect(screen.getByLabelText('Notes')).toHaveValue('Guide the follower across the line.');
    expect(screen.getByAltText('Apercu du temps 1')).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('saves a movement with an external video without a schema', async () => {
    const { onSave } = renderForm();
    fillMovementDetails();
    fireEvent.click(screen.getByLabelText('Lien externe'));
    fireEvent.change(screen.getByLabelText('URL de la video'), {
      target: { value: 'https://example.com/cross-body-lead' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Cross body lead',
        level: 2,
        notes: 'Guide the follower across the line.',
        schemaImages: [],
        video: { kind: 'external-url', url: 'https://example.com/cross-body-lead' },
      });
    });
  });

  it('saves a movement with a local video without a schema', async () => {
    const { onSave } = renderForm();
    const video = new File(['video'], 'cross-body-lead.webm', { type: 'video/webm' });
    fillMovementDetails();
    fireEvent.click(screen.getByLabelText('Fichier local'));
    fireEvent.change(screen.getByLabelText('Fichier video'), { target: { files: [video] } });

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        name: 'Cross body lead',
        level: 2,
        notes: 'Guide the follower across the line.',
        schemaImages: [],
        video: { kind: 'local-file', file: video },
      });
    });
  });

  it('allows a schema and an external video together', async () => {
    stubObjectUrls();
    const { onSave } = renderForm();
    fillMovementDetails();
    fillSchema();
    fireEvent.click(screen.getByLabelText('Lien externe'));
    fireEvent.change(screen.getByLabelText('URL de la video'), {
      target: { value: 'https://example.com/cross-body-lead' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          schemaImages,
          video: { kind: 'external-url', url: 'https://example.com/cross-body-lead' },
        }),
      );
    });
  });

  it.each([
    {
      name: 'rejects an invalid external URL',
      prepare: () => {
        fireEvent.click(screen.getByLabelText('Lien externe'));
        fireEvent.change(screen.getByLabelText('URL de la video'), {
          target: { value: 'ftp://example.com/video' },
        });
      },
      error: 'L URL video doit utiliser http ou https.',
    },
    {
      name: 'rejects a non-video local file',
      prepare: () => {
        fireEvent.click(screen.getByLabelText('Fichier local'));
        fireEvent.change(screen.getByLabelText('Fichier video'), {
          target: { files: [new File(['text'], 'notes.txt', { type: 'text/plain' })] },
        });
      },
      error: 'Le fichier choisi doit etre une video.',
    },
  ])('$name', async ({ prepare, error }) => {
    const { onSave } = renderForm();
    fillMovementDetails();
    prepare();

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le mouvement' }));

    expect(await screen.findByText(error)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
