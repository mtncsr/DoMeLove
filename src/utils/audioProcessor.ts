import { MediaConfig } from '../config/mediaConfig';
import type { AudioFile } from '../types/project';

export async function processAudio(file: File): Promise<AudioFile> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('audio/') && !file.name.toLowerCase().endsWith('.mp3')) {
      reject(new Error(`Invalid file type: ${file.type}. Please select an MP3 audio file.`));
      return;
    }

    // Check for extremely large files (browser limits)
    const maxFileSize = 100 * 1024 * 1024; // 100MB - browser FileReader limit
    if (file.size > maxFileSize) {
      reject(new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 100MB due to browser limitations.`));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) {
          reject(new Error('Failed to read audio file - no data returned'));
          return;
        }
        
        // Validate data URL format
        if (!dataUrl.startsWith('data:')) {
          reject(new Error('Invalid audio data format'));
          return;
        }
        
        // Extract Base64 data
        const base64Data = dataUrl.split(',')[1];
        if (!base64Data || base64Data.length === 0) {
          reject(new Error('Failed to extract audio data'));
          return;
        }
        
        const size = file.size;
        
        const audioFile: AudioFile = {
          id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          data: dataUrl, // Full data URL for easy use
          filename: file.name,
          size,
        };
        
        resolve(audioFile);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`Failed to process audio file: ${errorMessage}`));
      }
    };
    
    reader.onerror = (event) => {
      const error = event.target?.error;
      if (error) {
        if (error.name === 'NotReadableError') {
          reject(new Error('File is not readable. It may be corrupted or in an unsupported format.'));
        } else if (error.name === 'SecurityError') {
          reject(new Error('Security error reading file. Please try a different file.'));
        } else {
          reject(new Error(`Failed to read audio file: ${error.message || 'Unknown error'}`));
        }
      } else {
        reject(new Error('Failed to read audio file'));
      }
    };
    
    reader.onabort = () => {
      reject(new Error('Audio file reading was aborted'));
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Failed to start reading file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
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


