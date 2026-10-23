import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LEVELS, type CreateMovementInput, type Level, type Movement } from '../model';
import { SchemaEditor } from './SchemaEditor';

type FormErrors = Partial<Record<'name' | 'level' | 'notes' | 'schema' | 'form', string>>;

type MovementFormProps = {
  onSave: (input: CreateMovementInput) => Promise<Movement>;
  onCreated: (movement: Movement) => void;
};

export function MovementForm({ onSave, onCreated }: MovementFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [schemaImages, setSchemaImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const nextErrors = validateForm(name, level, notes, schemaImages);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const movement = await onSave({
        name,
        level: Number(level) as Level,
        notes,
        schemaImages,
      });
      onCreated(movement);
      navigate(`/movements/${movement.id}`);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Impossible d enregistrer ce mouvement.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="library-shell form-shell">
      <header className="level-list-header">
        <Link to="/" className="back-link">
          Bibliotheque
        </Link>
      </header>

      <p className="eyebrow">Nouvelle fiche</p>
      <h1>Ajouter un mouvement</h1>
      <p className="form-introduction">
        Garde les reperes utiles, puis associe une image a chaque temps.
      </p>

      <form className="movement-form" onSubmit={(event) => void save(event)} noValidate>
        <div className="form-field">
          <label htmlFor="movement-name">Nom</label>
          <input
            id="movement-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="movement-level">Niveau</label>
          <select
            id="movement-level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            aria-describedby={errors.level ? 'level-error' : undefined}
          >
            <option value="">Choisir un niveau</option>
            {LEVELS.map((value) => (
              <option value={value} key={value}>
                Niveau {value}
              </option>
            ))}
          </select>
          {errors.level && (
            <p id="level-error" className="field-error">
              {errors.level}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="movement-notes">Notes</label>
          <textarea
            id="movement-notes"
            rows={5}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            aria-describedby={errors.notes ? 'notes-error' : undefined}
          />
          {errors.notes && (
            <p id="notes-error" className="field-error">
              {errors.notes}
            </p>
          )}
        </div>

        <SchemaEditor error={errors.schema} onChange={setSchemaImages} />

        {errors.form && (
          <p className="connection-error" role="alert">
            {errors.form}
          </p>
        )}

        <button type="submit" className="add-button" disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer le mouvement'}
        </button>
      </form>
    </main>
  );
}

function validateForm(
  name: string,
  level: string,
  notes: string,
  schemaImages: File[],
): FormErrors {
  const errors: FormErrors = {};

  if (!name.trim()) {
    errors.name = 'Le nom du mouvement est obligatoire.';
  }

  if (!LEVELS.includes(Number(level) as Level)) {
    errors.level = 'Choisis un niveau entre 1 et 4.';
  }

  if (!notes.trim()) {
    errors.notes = 'Les notes du mouvement sont obligatoires.';
  }

  if (schemaImages.length !== 8) {
    errors.schema = `Le schema doit contenir exactement huit images. ${schemaImages.length}/8 ajoutee${schemaImages.length > 1 ? 's' : ''}.`;
  } else if (schemaImages.some((image) => !image.type.startsWith('image/'))) {
    errors.schema = 'Chaque element du schema doit etre une image.';
  }

  return errors;
}
