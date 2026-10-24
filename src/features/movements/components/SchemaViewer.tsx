import { useEffect, useState } from 'react';

type SchemaViewerProps = {
  imagePaths: string[];
  loadMedia: (path: string) => Promise<string>;
};

type ImageState = { status: 'loading' } | { status: 'loaded'; url: string } | { status: 'error' };

export function SchemaViewer({ imagePaths, loadMedia }: SchemaViewerProps) {
  if (!imagePaths.length) {
    return null;
  }

  return (
    <section className="detail-section" aria-labelledby="schema-title">
      <h2 id="schema-title">Schema</h2>
      <ol className="schema-viewer">
        {imagePaths.map((path, index) => (
          <SchemaImage key={path} path={path} time={index + 1} loadMedia={loadMedia} />
        ))}
      </ol>
    </section>
  );
}

function SchemaImage({
  path,
  time,
  loadMedia,
}: {
  path: string;
  time: number;
  loadMedia: (path: string) => Promise<string>;
}) {
  const [state, setState] = useState<ImageState>({ status: 'loading' });

  useEffect(() => {
    let isCurrent = true;
    let url: string | undefined;

    void loadMedia(path).then(
      (loadedUrl) => {
        url = loadedUrl;

        if (isCurrent) {
          setState({ status: 'loaded', url: loadedUrl });
        } else {
          URL.revokeObjectURL(loadedUrl);
        }
      },
      () => {
        if (isCurrent) {
          setState({ status: 'error' });
        }
      },
    );

    return () => {
      isCurrent = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [loadMedia, path]);

  return (
    <li>
      <span>Temps {time}</span>
      {state.status === 'loaded' && <img src={state.url} alt={`Temps ${time}`} />}
      {state.status === 'loading' && <p>Chargement de l image...</p>}
      {state.status === 'error' && <p role="alert">Image du temps {time} indisponible.</p>}
    </li>
  );
}
