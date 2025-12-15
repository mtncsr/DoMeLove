import type { ProcessedImage } from '../utils/imageProcessor';
import { processImage } from '../utils/imageProcessor';
import type { ProcessedAudio } from '../utils/audioProcessor';
import { processAudio } from '../utils/audioProcessor';
import { processVideo } from '../utils/videoProcessor';
import type { MediaMetadata } from './mediaStore';
import {
  deleteAllProjectMedia,
  deleteMedia,
  getMediaBlob,
  getMediaMetadata,
  hasMedia,
  putMedia,
} from './mediaStore';
import {
  getCachedPreviewUrl,
  getOrCreatePreviewUrl,
  revokePreviewUrl,
  revokeProjectPreviewUrls,
  setPreviewUrl,
} from '../utils/mediaPreviewCache';

export interface SavedMediaResult {
  metadata: MediaMetadata;
  previewUrl?: string;
}

export async function saveProcessedImage(projectId: string, processed: ProcessedImage): Promise<SavedMediaResult> {
  const metadata = await putMedia({
    projectId,
    mediaId: processed.metadata.id,
    type: 'image',
    blob: processed.blob,
    metadata: processed.metadata,
  });
  const previewUrl = setPreviewUrl(projectId, metadata.id, processed.blob);
  return { metadata, previewUrl };
}

export async function saveImageFile(projectId: string, file: File): Promise<SavedMediaResult> {
  const processed = await processImage(file);
  return saveProcessedImage(projectId, processed);
}

export async function saveProcessedAudio(projectId: string, processed: ProcessedAudio): Promise<SavedMediaResult> {
  const metadata = await putMedia({
    projectId,
    mediaId: processed.metadata.id,
    type: 'audio',
    blob: processed.blob,
    metadata: processed.metadata,
  });
  const previewUrl = setPreviewUrl(projectId, metadata.id, processed.blob);
  return { metadata, previewUrl };
}

export async function saveAudioFile(projectId: string, file: File): Promise<SavedMediaResult> {
  const processed = await processAudio(file);
  return saveProcessedAudio(projectId, processed);
}

export async function saveVideoFile(projectId: string, file: File): Promise<SavedMediaResult> {
  const processed = await processVideo(file);
  const metadata = await putMedia({
    projectId,
    mediaId: processed.videoData.id,
    type: 'video',
    blob: processed.blob,
    metadata: processed.videoData,
  });
  const previewUrl = processed.videoData.posterDataUrl
    ? processed.videoData.posterDataUrl
    : undefined;
  return { metadata, previewUrl };
}

export async function getMediaPreviewUrl(projectId: string, mediaId: string): Promise<string | null> {
  const cached = getCachedPreviewUrl(projectId, mediaId);
  if (cached) return cached;

  return getOrCreatePreviewUrl(projectId, mediaId, async () => {
    const blob = await getMediaBlob(projectId, mediaId);
    return blob;
  });
}

export async function ensureMediaBlob(projectId: string, mediaId: string): Promise<boolean> {
  return hasMedia(projectId, mediaId);
}

export async function deleteMediaWithPreview(projectId: string, mediaId: string) {
  revokePreviewUrl(projectId, mediaId);
  await deleteMedia(projectId, mediaId);
}

export async function deleteAllMediaForProject(projectId: string) {
  revokeProjectPreviewUrls(projectId);
  await deleteAllProjectMedia(projectId);
}

export async function getMediaDataUrl(projectId: string, mediaId: string): Promise<string | null> {
  const blob = await getMediaBlob(projectId, mediaId);
  if (!blob) return null;
  return await blobToDataUrl(blob);
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

export async function getMediaMetadataSafe(projectId: string, mediaId: string): Promise<MediaMetadata | null> {
  return await getMediaMetadata(projectId, mediaId);
}

// Re-export from mediaStore for convenience
export { hasMedia } from './mediaStore';

// Re-export from mediaPreviewCache for convenience
export { revokeProjectPreviewUrls } from '../utils/mediaPreviewCache';
