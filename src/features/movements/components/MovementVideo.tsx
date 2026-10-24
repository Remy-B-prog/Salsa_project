import { useEffect, useState } from 'react';
import type { VideoSource } from '../model';

type MovementVideoProps = {
  source: VideoSource;
  loadMedia: (path: string) => Promise<string>;
};

type VideoState = { status: 'loading' } | { status: 'loaded'; url: string } | { status: 'error' };

export function MovementVideo({ source, loadMedia }: MovementVideoProps) {
  if (source.kind === 'external-url') {
    return (
      <section className="detail-section" aria-labelledby="video-title">
        <h2 id="video-title">Video</h2>
        <iframe
          className="external-video-frame"
          title="Video du mouvement"
          src={toEmbeddedVideoUrl(source.url)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </section>
    );
  }

  return <LocalVideo path={source.path} loadMedia={loadMedia} />;
}

function toEmbeddedVideoUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const videoId = url.searchParams.get('v') ?? youtubeVideoIdFromPath(url.pathname);

    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }

    const playlistId = url.searchParams.get('list');
    return playlistId
      ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`
      : sourceUrl;
  }

  if (host === 'youtu.be') {
    const videoId = url.pathname.slice(1);
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : sourceUrl;
  }

  if (host === 'vimeo.com') {
    const videoId = url.pathname.split('/').filter(Boolean).at(-1);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : sourceUrl;
  }

  return sourceUrl;
}

function youtubeVideoIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/(?:embed|live|shorts)\/([^/]+)/);
  return match?.[1];
}

function LocalVideo({
  path,
  loadMedia,
}: {
  path: string;
  loadMedia: (path: string) => Promise<string>;
}) {
  const [state, setState] = useState<VideoState>({ status: 'loading' });

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
    <section className="detail-section" aria-labelledby="video-title">
      <h2 id="video-title">Video</h2>
      {state.status === 'loading' && <p className="loading-message">Chargement de la video...</p>}
      {state.status === 'loaded' && (
        <video controls src={state.url}>
          Votre navigateur ne peut pas lire cette video.
        </video>
      )}
      {state.status === 'error' && <p role="alert">Video indisponible.</p>}
    </section>
  );
}
