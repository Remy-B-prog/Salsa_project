import { useEffect, useRef, useState } from 'react';

type SchemaViewerProps = {
  imagePaths: string[];
  loadMedia: (path: string) => Promise<string>;
};

type ImageState = { status: 'loading' } | { status: 'loaded'; url: string } | { status: 'error' };

export function SchemaViewer({ imagePaths, loadMedia }: SchemaViewerProps) {
  const [selectedImage, setSelectedImage] = useState<SelectedImage>();
  const openerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      openerRef.current?.focus();
    }
  }, [selectedImage]);

  if (!imagePaths.length) {
    return null;
  }

  function openImage(image: OpenedImage, opener: HTMLButtonElement): void {
    openerRef.current = opener;
    setSelectedImage(image);
  }

  return (
    <section className="detail-section" aria-labelledby="schema-title">
      <h2 id="schema-title">Schema</h2>
      <ol className="schema-viewer">
        {imagePaths.map((path, index) => (
          <SchemaImage
            key={path}
            path={path}
            time={index + 1}
            loadMedia={loadMedia}
            onOpen={openImage}
          />
        ))}
      </ol>
      {selectedImage && (
        <SchemaLightbox image={selectedImage} onClose={() => setSelectedImage(undefined)} />
      )}
    </section>
  );
}

type OpenedImage = { url: string; time: number };
type SelectedImage = OpenedImage;

function SchemaImage({
  path,
  time,
  loadMedia,
  onOpen,
}: {
  path: string;
  time: number;
  loadMedia: (path: string) => Promise<string>;
  onOpen: (image: OpenedImage, opener: HTMLButtonElement) => void;
}) {
  const [state, setState] = useState<ImageState>({ status: 'loading' });
  const buttonRef = useRef<HTMLButtonElement>(null);

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
      {state.status === 'loaded' && (
        <button
          ref={buttonRef}
          type="button"
          className="schema-image-button"
          onClick={() => {
            if (buttonRef.current) {
              onOpen({ url: state.url, time }, buttonRef.current);
            }
          }}
          aria-label={`Agrandir l image du temps ${time}`}
        >
          <img src={state.url} alt={`Temps ${time}`} />
        </button>
      )}
      {state.status === 'loading' && <p>Chargement de l image...</p>}
      {state.status === 'error' && <p role="alert">Image du temps {time} indisponible.</p>}
    </li>
  );
}

function SchemaLightbox({ image, onClose }: { image: SelectedImage; onClose: () => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="image-lightbox-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="image-lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-lightbox-title"
        onKeyDown={(event) => {
          if (event.key === 'Tab') {
            event.preventDefault();
            closeButtonRef.current?.focus();
          }
        }}
      >
        <div className="image-lightbox-header">
          <h2 id="image-lightbox-title">Schema - temps {image.time}</h2>
          <button ref={closeButtonRef} type="button" className="secondary-button" onClick={onClose}>
            Fermer l image
          </button>
        </div>
        <img src={image.url} alt={`Temps ${image.time}`} />
      </section>
    </div>
  );
}
