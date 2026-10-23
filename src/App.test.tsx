import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the local library connection screen when no directory is remembered', async () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: 'Connecter votre bibliotheque' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Creer une bibliotheque' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ouvrir une bibliotheque' })).toBeInTheDocument();
  });
});
