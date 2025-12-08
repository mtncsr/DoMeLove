// Media configuration - centralized limits and thresholds
export const MediaConfig = {
  // Image settings
  IMAGE_MAX_DIMENSION: 1600,
  IMAGE_COMPRESSION_QUALITY: 0.75, // WebP quality (0.0-1.0), 0.75 balances size and quality
  IMAGE_TARGET_SIZE_KB: {
    min: 100,
    max: 200,
  },
  
  // Audio settings
  AUDIO_WARNING_SIZE_MB: 4,
} as const;


