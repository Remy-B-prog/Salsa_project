import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeLibrary, writeLibrary } from '../../library/libraryStorage';
import { createMemoryDirectory } from '../../library/test/createMemoryDirectory';
import { LevelMovementList } from './LevelMovementList';

function renderLevelList(directory: FileSystemDirectoryHandle, route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/levels/:level" element={<LevelMovementList directory={directory} />} />
        <Route path="/" element={<p>Library home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LevelMovementList', () => {
  afterEach(cleanup);

  it('shows only the movements stored in the selected level', async () => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);
    await writeLibrary(directory.handle, {
      version: 1,
      movements: [
        {
          id: 'cross-body-lead',
          name: 'Cross body lead',
          level: 2,
          notes: 'Guide the follower across the line.',
          schemaImagePaths: [],
          video: { kind: 'external-url', url: 'https://example.com/cross-body-lead' },
          createdAt: '2026-10-23T12:00:00.000Z',
        },
        {
          id: 'basic-step',
          name: 'Basic step',
          level: 1,
          notes: 'Keep the timing.',
          schemaImagePaths: [],
          video: { kind: 'external-url', url: 'https://example.com/basic-step' },
          createdAt: '2026-10-23T12:00:00.000Z',
        },
      ],
    });

    renderLevelList(directory.handle, '/levels/2');

    expect(await screen.findByRole('link', { name: 'Cross body lead' })).toHaveAttribute(
      'href',
      '/movements/cross-body-lead',
    );
    expect(screen.queryByRole('link', { name: 'Basic step' })).not.toBeInTheDocument();
  });

  it('shows an empty state with an add-movement link', async () => {
    const directory = createMemoryDirectory();
    await initializeLibrary(directory.handle);

    renderLevelList(directory.handle, '/levels/4');

    const emptyStateTitle = await screen.findByRole('heading', {
      name: 'Aucun mouvement dans ce niveau',
    });
    const emptyState = emptyStateTitle.closest('section');

    expect(emptyState).not.toBeNull();
    expect(
      within(emptyState as HTMLElement).getByRole('link', { name: 'Ajouter un mouvement' }),
    ).toHaveAttribute('href', '/movements/new');
  });
});
