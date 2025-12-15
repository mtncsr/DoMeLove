import { useEffect, useState } from 'react';
import { getMediaPreviewUrl } from '../services/mediaService';

export function useMediaPreviewUrl(projectId?: string, mediaId?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!projectId || !mediaId) {
      setUrl(null);
      return;
    }
    setLoading(true);
    getMediaPreviewUrl(projectId, mediaId)
      .then((result) => {
        if (!cancelled) {
          setUrl(result);
        }
      })
      .catch((err) => {
        console.error('Failed to load media preview', err);
        if (!cancelled) {
          setUrl(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, mediaId]);

  return { url, loading };
}
