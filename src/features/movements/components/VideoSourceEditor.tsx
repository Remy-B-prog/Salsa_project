export type DraftVideoSource =
  { kind: 'external-url'; url: string } | { kind: 'local-file'; file?: File } | undefined;

type VideoSourceEditorProps = {
  error?: string;
  onChange: (source: DraftVideoSource) => void;
  value: DraftVideoSource;
};

export function VideoSourceEditor({ error, onChange, value }: VideoSourceEditorProps) {
  return (
    <fieldset className="video-source" aria-describedby={error ? 'video-error' : undefined}>
      <legend>Video</legend>
      <p>Optionnelle.</p>

      <div className="video-source-options">
        <label>
          <input
            type="radio"
            name="video-source"
            checked={!value}
            onChange={() => onChange(undefined)}
          />
          Aucune video
        </label>
        <label>
          <input
            type="radio"
            name="video-source"
            checked={value?.kind === 'external-url'}
            onChange={() => onChange({ kind: 'external-url', url: '' })}
          />
          Lien externe
        </label>
        <label>
          <input
            type="radio"
            name="video-source"
            checked={value?.kind === 'local-file'}
            onChange={() => onChange({ kind: 'local-file' })}
          />
          Fichier local
        </label>
      </div>

      {value?.kind === 'external-url' && (
        <div className="form-field">
          <label htmlFor="external-video-url">URL de la video</label>
          <input
            id="external-video-url"
            type="url"
            inputMode="url"
            placeholder="https://..."
            value={value.url}
            onChange={(event) => onChange({ kind: 'external-url', url: event.target.value })}
          />
        </div>
      )}

      {value?.kind === 'local-file' && (
        <div className="form-field">
          <label htmlFor="local-video-file">Fichier video</label>
          <input
            id="local-video-file"
            type="file"
            accept="video/*"
            onChange={(event) => onChange({ kind: 'local-file', file: event.target.files?.[0] })}
          />
          {value.file && <span className="video-file-name">{value.file.name}</span>}
        </div>
      )}

      {error && (
        <p id="video-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
