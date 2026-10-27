import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LibraryHome } from './LibraryHome';

describe('LibraryHome', () => {
  it('renders the four levels and the movement count', () => {
    render(
      <MemoryRouter>
        <LibraryHome library={{ version: 1, movements: [{ id: 'move-1' }, { id: 'move-2' }] }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('2 mouvements')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Niveau 1/ })).toHaveAttribute('href', '/levels/1');
    expect(screen.getByRole('link', { name: /Niveau 4/ })).toHaveAttribute('href', '/levels/4');
    expect(screen.getByRole('link', { name: 'Ajouter un mouvement' })).toHaveAttribute(
      'href',
      '/movements/new',
    );
  });

  it('refreshes the count from the connected library', async () => {
    render(
      <MemoryRouter>
        <LibraryHome
          library={{ version: 1, movements: [{ id: 'stale-movement' }] }}
          loadLibrary={async () => ({
            version: 1,
            movements: [{ id: 'move-1' }, { id: 'move-2' }, { id: 'move-3' }],
          })}
        />
      </MemoryRouter>,
    );

    expect(await screen.findByText('3 mouvements')).toBeInTheDocument();
  });
});
