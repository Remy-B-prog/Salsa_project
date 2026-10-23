import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the library and its four levels', () => {
    render(
      <HashRouter>
        <App />
      </HashRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Bibliotheque de mouvements' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Niveau 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Niveau 4/ })).toBeInTheDocument();
  });
});
