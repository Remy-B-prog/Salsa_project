import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type {
  Movement,
  SchemaImageUpdate,
  UpdateMovementInput,
  VideoSource,
  VideoUpdateSource,
} from '../model';

type EditVideoDraft =
  | { kind: 'external-url'; url: string }
  | { kind: 'existing-local'; source: Extract<VideoSource, { kind: 'local-file' }> }
  | { kind: 'new-local'; file?: File }
  | undefined;

type FormErrors = Partial<Record<'name' | 'level' | 'notes' | 'schema' | 'video' | 'form', string>>;

type MovementEditFormProps = {
  getMovement: (id: string) => Promise<Movement | undefined>;
  onSave: (id: string, input: UpdateMovementInput) => Promise<Movement>;
  onUpdated: (movement: Movement) => void;
};

export function MovementEditForm({ getMovement, onSave, onUpdated }: MovementEditFormProps) {
  const { movementId } = useParams();
  const navigate = useNavigate();
  const [movement, setMovement] = useState<Movement>();
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [notes, setNotes] = useState('');
  const [schemaSlots, setSchemaSlots] = useState<(SchemaImageUpdate | undefined)[]>([]);
  const [video, setVideo] = useState<EditVideoDraft>();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    if (!movementId) {
      return;
    }

    let isCurrent = true;

    void getMovement(movementId).then(
      (loadedMovement) => {
        if (!isCurrent) {
          return;
        }

        if (!loadedMovement) {
          setLoadError('Ce mouvement est introuvable.');
          return;
        }

        setMovement(loadedMovement);
        setName(loadedMovement.name);
        setLevel(String(loadedMovement.level));
        setNotes(loadedMovement.notes);
        setSchemaSlots(loadedMovement.schemaImagePaths.map((path) => ({ kind: 'existing', path })));
        setVideo(toEditVideoDraft(loadedMovement.video));
      },
      (error: unknown) => {
        if (isCurrent) {
          setLoadError(error instanceof Error ? error.message : 'Impossible de lire ce mouvement.');
        }
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [getMovement, movementId]);

  async function save(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!movement) {
      return;
    }

    const nextErrors = validateForm(name, level, notes, schemaSlots, video);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const videoSource = toVideoUpdateSource(video);
      const updatedMovement = await onSave(movement.id, {
        name,
        level: Number(level) as Movement['level'],
        notes,
        schemaImages: schemaSlots.filter(isSchemaImageUpdate),
        ...(videoSource ? { video: videoSource } : {}),
      });
      onUpdated(updatedMovement);
      navigate(`/movements/${updatedMovement.id}`);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error ? error.message : 'Impossible d enregistrer les modifications.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) {
    return <EditMessage message={loadError} isError />;
  }

  if (!movement) {
    return <EditMessage message="Chargement du mouvement..." />;
  }

  return (
    <main className="library-shell form-shell">
      <header className="level-list-header">
        <Link to={`/movements/${movement.id}`} className="back-link">
          Fiche mouvement
        </Link>
      </header>

      <p className="eyebrow">Modifier la fiche</p>
      <h1>{movement.name}</h1>

      <form className="movement-form" onSubmit={(event) => void save(event)} noValidate>
        <div className="form-field">
          <label htmlFor="edit-movement-name">Nom</label>
          <input
            id="edit-movement-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="edit-movement-level">Niveau</label>
          <select
            id="edit-movement-level"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
          >
            {[1, 2, 3, 4].map((value) => (
              <option value={value} key={value}>
                Niveau {value}
              </option>
            ))}
          </select>
          {errors.level && <p className="field-error">{errors.level}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="edit-movement-notes">Notes</label>
          <textarea
            id="edit-movement-notes"
            rows={5}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          {errors.notes && <p className="field-error">{errors.notes}</p>}
        </div>

        <EditSchemaEditor slots={schemaSlots} onChange={setSchemaSlots} error={errors.schema} />
        <EditVideoSource value={video} onChange={setVideo} error={errors.video} />

        {errors.form && (
          <p className="connection-error" role="alert">
            {errors.form}
          </p>
        )}

        <button type="submit" className="add-button" disabled={isSaving}>
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </main>
  );
}

function EditSchemaEditor({
  slots,
  onChange,
  error,
}: {
  slots: (SchemaImageUpdate | undefined)[];
  onChange: (slots: (SchemaImageUpdate | undefined)[]) => void;
  error?: string;
}) {
  function setSlot(index: number, image: SchemaImageUpdate | undefined): void {
    const nextSlots = [...slots];
    nextSlots[index] = image;
    onChange(nextSlots);
  }

  if (!slots.length) {
    return (
      <section className="schema-editor">
        <h2>Schema en huit temps</h2>
        <p>Aucun schema n'est associe a cette fiche.</p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onChange(Array.from({ length: 8 }, () => undefined))}
        >
          Ajouter un schema
        </button>
      </section>
    );
  }

  return (
    <fieldset className="schema-editor">
      <legend>Schema en huit temps</legend>
      <div className="schema-grid">
        {slots.map((slot, index) => {
          const time = index + 1;

          return (
            <div className="schema-slot" key={time}>
              <span className="schema-slot-number">Temps {time}</span>
              <span className="schema-slot-empty">
                {slot?.kind === 'existing'
                  ? 'Image existante'
                  : slot?.kind === 'new'
                    ? slot.file.name
                    : 'Image a ajouter'}
              </span>
              <label htmlFor={`edit-schema-image-${time}`} className="secondary-button">
                {slot ? 'Remplacer' : 'Importer'}
              </label>
              <input
                id={`edit-schema-image-${time}`}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setSlot(index, { kind: 'new', file });
                  }
                }}
              />
              <button
                type="button"
                className="schema-remove"
                disabled={!slot}
                onClick={() => setSlot(index, undefined)}
              >
                Retirer
              </button>
            </div>
          );
        })}
      </div>
      <button type="button" className="schema-remove" onClick={() => onChange([])}>
        Retirer le schema
      </button>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function EditVideoSource({
  value,
  onChange,
  error,
}: {
  value: EditVideoDraft;
  onChange: (video: EditVideoDraft) => void;
  error?: string;
}) {
  return (
    <fieldset className="video-source">
      <legend>Video</legend>
      <div className="video-source-options">
        <label>
          <input
            type="radio"
            name="edit-video"
            checked={!value}
            onChange={() => onChange(undefined)}
          />
          Aucune video
        </label>
        <label>
          <input
            type="radio"
            name="edit-video"
            checked={value?.kind === 'external-url'}
            onChange={() => onChange({ kind: 'external-url', url: '' })}
          />
          Lien externe
        </label>
        <label>
          <input
            type="radio"
            name="edit-video"
            checked={value?.kind === 'existing-local' || value?.kind === 'new-local'}
            onChange={() =>
              onChange(value?.kind === 'existing-local' ? value : { kind: 'new-local' })
            }
          />
          Fichier local
        </label>
      </div>

      {value?.kind === 'external-url' && (
        <div className="form-field">
          <label htmlFor="edit-external-video-url">URL de la video</label>
          <input
            id="edit-external-video-url"
            type="url"
            value={value.url}
            onChange={(event) => onChange({ kind: 'external-url', url: event.target.value })}
          />
        </div>
      )}

      {(value?.kind === 'existing-local' || value?.kind === 'new-local') && (
        <div className="form-field">
          {value.kind === 'existing-local' && (
            <span className="video-file-name">Video locale actuelle</span>
          )}
          <label htmlFor="edit-local-video-file">
            {value.kind === 'existing-local' ? 'Remplacer la video' : 'Fichier video'}
          </label>
          <input
            id="edit-local-video-file"
            type="file"
            accept="video/*"
            onChange={(event) => onChange({ kind: 'new-local', file: event.target.files?.[0] })}
          />
          {value.kind === 'new-local' && value.file && (
            <span className="video-file-name">{value.file.name}</span>
          )}
        </div>
      )}
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

function validateForm(
  name: string,
  level: string,
  notes: string,
  schemaSlots: (SchemaImageUpdate | undefined)[],
  video: EditVideoDraft,
): FormErrors {
  const errors: FormErrors = {};

  if (!name.trim()) {
    errors.name = 'Le nom du mouvement est obligatoire.';
  }
  if (![1, 2, 3, 4].includes(Number(level))) {
    errors.level = 'Choisis un niveau entre 1 et 4.';
  }
  if (!notes.trim()) {
    errors.notes = 'Les notes du mouvement sont obligatoires.';
  }
  if (schemaSlots.length && (schemaSlots.length !== 8 || schemaSlots.some((slot) => !slot))) {
    errors.schema = 'Un schema doit contenir exactement huit images.';
  }
  if (video?.kind === 'external-url' && !isHttpUrl(video.url)) {
    errors.video = 'L URL video doit utiliser http ou https.';
  }
  if (video?.kind === 'new-local') {
    if (!video.file) {
      errors.video = 'Choisis un fichier video.';
    } else if (!video.file.type.startsWith('video/')) {
      errors.video = 'Le fichier choisi doit etre une video.';
    }
  }
  return errors;
}

function toEditVideoDraft(video: VideoSource | undefined): EditVideoDraft {
  if (!video) {
    return undefined;
  }

  return video.kind === 'local-file' ? { kind: 'existing-local', source: video } : video;
}

function toVideoUpdateSource(video: EditVideoDraft): VideoUpdateSource | undefined {
  if (!video || video.kind === 'new-local') {
    return video?.file ? { kind: 'local-file', file: video.file } : undefined;
  }

  return video.kind === 'existing-local' ? video.source : video;
}

function isSchemaImageUpdate(value: SchemaImageUpdate | undefined): value is SchemaImageUpdate {
  return value !== undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function EditMessage({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <main className="library-shell future-screen">
      <p className={isError ? 'connection-error' : 'loading-message'}>{message}</p>
      <Link to="/" className="secondary-button">
        Retour a la bibliotheque
      </Link>
    </main>
  );
}
