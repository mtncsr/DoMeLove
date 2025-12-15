import { MediaConfig } from '../config/mediaConfig';
import type { AudioFile } from '../types/project';

export interface ProcessedAudio {
  blob: Blob;
  metadata: AudioFile;
}

export async function processAudio(file: File): Promise<ProcessedAudio> {
  // Validate file type
  if (!file.type.startsWith('audio/') && !file.name.toLowerCase().endsWith('.mp3')) {
    throw new Error(`Invalid file type: ${file.type}. Please select an MP3 audio file.`);
  }

  // Check for extremely large files (browser limits)
  const maxFileSize = 100 * 1024 * 1024; // 100MB - browser FileReader limit
  if (file.size > maxFileSize) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 100MB due to browser limitations.`);
  }

  const audioFile: AudioFile = {
    id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    filename: file.name,
    mime: file.type || 'audio/mpeg',
    size: file.size,
    createdAt: new Date().toISOString(),
  };

  return { blob: file, metadata: audioFile };
}

export function getAudioSizeMB(audio: AudioFile): number {
  return audio.size / (1024 * 1024);
}

export function shouldWarnAboutAudioSize(audio: AudioFile): boolean {
  return getAudioSizeMB(audio) > MediaConfig.AUDIO_WARNING_SIZE_MB;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


