import { MediaConfig } from '../config/mediaConfig';
import type { VideoData } from '../types/project';

interface ProcessedVideo {
  videoData: VideoData;
  blob: Blob;
}

export async function processVideo(file: File): Promise<ProcessedVideo> {
  // Basic type/size checks before reading
  if (!isMimeAllowed(file)) {
    throw new Error(`Unsupported video type: ${file.type || file.name}`);
  }

  const maxBytes = MediaConfig.VIDEO_MAX_SIZE_MB * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      `Video is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed is ${MediaConfig.VIDEO_MAX_SIZE_MB}MB.`
    );
  }

  const { duration, width, height } = await readVideoMetadata(file);

  if (duration > MediaConfig.VIDEO_MAX_DURATION_SECONDS) {
    throw new Error(
      `Video is too long (${duration.toFixed(1)}s). Max allowed is ${MediaConfig.VIDEO_MAX_DURATION_SECONDS}s.`
    );
  }

  const posterDataUrl = await capturePoster(file, Math.min(0.5, duration / 2));

  const videoData: VideoData = {
    id: `video_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    filename: file.name,
    mime: file.type || 'video/mp4',
    size: file.size,
    duration,
    width,
    height,
    posterDataUrl,
    createdAt: new Date().toISOString(),
  };

  return { videoData, blob: file };
}

function isMimeAllowed(file: File): boolean {
  if (!file.type) return false;
  return MediaConfig.VIDEO_ALLOWED_MIME.some((mime) => mime === file.type);
}

function readVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.src = '';
    };

    video.onloadedmetadata = () => {
      if (!video.duration || Number.isNaN(video.duration) || video.duration <= 0) {
        cleanup();
        reject(new Error('Could not read video duration.'));
        return;
      }
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) {
        cleanup();
        reject(new Error('Could not read video dimensions.'));
        return;
      }
      const duration = video.duration;
      cleanup();
      resolve({ duration, width, height });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Unsupported video format or failed to read metadata.'));
    };
  });
}

function capturePoster(file: File, targetTime: number): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.src = '';
    };

    const handleError = () => {
      cleanup();
      resolve(undefined);
    };

    video.onloadedmetadata = () => {
      if (Number.isNaN(targetTime) || targetTime < 0 || targetTime > video.duration) {
        targetTime = Math.min(0.5, video.duration / 2);
      }
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          handleError();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/webp', 0.75);
        cleanup();
        resolve(dataUrl);
      } catch (error) {
        console.error('Failed to capture video poster:', error);
        handleError();
      }
    };

    video.onerror = handleError;
  });
}


