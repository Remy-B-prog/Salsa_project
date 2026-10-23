import { useEffect, useRef, useState } from 'react';

const SLOT_COUNT = 8;

type SchemaSlot = {
  file?: File;
  previewUrl?: string;
};

type SchemaEditorProps = {
  error?: string;
  onChange: (images: File[]) => void;
};

export function SchemaEditor({ error, onChange }: SchemaEditorProps) {
  const [slots, setSlots] = useState<SchemaSlot[]>(() =>
    Array.from({ length: SLOT_COUNT }, () => ({})),
  );
  const previewUrls = useRef(new Set<string>());

  useEffect(
    () => () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  function setImage(index: number, file: File | undefined): void {
    const nextSlots = [...slots];
    const previousPreviewUrl = nextSlots[index].previewUrl;

    if (previousPreviewUrl) {
      URL.revokeObjectURL(previousPreviewUrl);
      previewUrls.current.delete(previousPreviewUrl);
    }

    const previewUrl = file ? URL.createObjectURL(file) : undefined;
    if (previewUrl) {
      previewUrls.current.add(previewUrl);
    }

    nextSlots[index] = { file, previewUrl };
    setSlots(nextSlots);
    onChange(nextSlots.flatMap((slot) => (slot.file ? [slot.file] : [])));
  }

  return (
    <fieldset className="schema-editor" aria-describedby={error ? 'schema-error' : undefined}>
      <legend>Schema en huit temps</legend>
      <p>Ajoute une image pour chacun des temps de 1 a 8.</p>
      <div className="schema-grid">
        {slots.map((slot, index) => {
          const time = index + 1;

          return (
            <div className="schema-slot" key={time}>
              <span className="schema-slot-number">Temps {time}</span>
              {slot.previewUrl ? (
                <img src={slot.previewUrl} alt={`Apercu du temps ${time}`} />
              ) : (
                <span className="schema-slot-empty">Image a ajouter</span>
              )}
              <label htmlFor={`schema-image-${time}`} className="secondary-button">
                {slot.file ? 'Remplacer' : 'Importer'}
              </label>
              <input
                id={`schema-image-${time}`}
                type="file"
                accept="image/*"
                onChange={(event) => setImage(index, event.target.files?.[0])}
              />
              {slot.file && <span className="schema-file-name">{slot.file.name}</span>}
              <button
                type="button"
                className="schema-remove"
                onClick={() => setImage(index, undefined)}
                disabled={!slot.file}
              >
                Retirer
              </button>
            </div>
          );
        })}
      </div>
      {error && (
        <p id="schema-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
