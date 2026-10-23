import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchemaEditor } from './SchemaEditor';

describe('SchemaEditor', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('imports, replaces, and removes an image from a time slot', () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
      revokeObjectURL: vi.fn(),
    });
    const onChange = vi.fn();
    const firstImage = new File(['first'], 'first.png', { type: 'image/png' });
    const replacementImage = new File(['replacement'], 'replacement.png', { type: 'image/png' });

    render(<SchemaEditor onChange={onChange} />);

    fireEvent.change(screen.getAllByLabelText('Importer')[0], { target: { files: [firstImage] } });
    expect(screen.getByAltText('Apercu du temps 1')).toHaveAttribute('src', 'blob:first.png');
    expect(onChange).toHaveBeenLastCalledWith([firstImage]);

    fireEvent.change(screen.getByLabelText('Remplacer'), { target: { files: [replacementImage] } });
    expect(screen.getByAltText('Apercu du temps 1')).toHaveAttribute('src', 'blob:replacement.png');
    expect(onChange).toHaveBeenLastCalledWith([replacementImage]);

    fireEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[0]);
    expect(screen.getAllByText('Image a ajouter')).toHaveLength(8);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
