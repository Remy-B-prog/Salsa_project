import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LibraryConnectionScreen } from './LibraryConnectionScreen';

describe('LibraryConnectionScreen', () => {
  it('calls the creation and opening actions from their buttons', () => {
    const onCreate = vi.fn();
    const onOpen = vi.fn();

    render(<LibraryConnectionScreen onCreate={onCreate} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole('button', { name: 'Creer une bibliotheque' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir une bibliotheque' }));

    expect(onCreate).toHaveBeenCalledOnce();
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
