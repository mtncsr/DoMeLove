import type { ScreenConfig } from './template';
import type { CanvasElement } from './canvas';

// Project data structure
export interface Project {
  id: string;
  name: string;
  templateId: string;
  schemaVersion: number;
  language: string; // en, he, es, zh, ar, ru, pt, fr
  data: ProjectData;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  // Global fields
  recipientName?: string;
  senderName?: string;
  eventTitle?: string;
  mainGreeting?: string;
  
  // Screen-specific data
  screens: Record<string, ScreenData>;
  
  // Images (metadata refs; blobs stored in IndexedDB)
  images: ImageData[];

  // Videos (metadata only; blobs stored in IndexedDB)
  videos: VideoData[];
  
  // Audio (metadata refs; blobs stored in IndexedDB)
  audio: AudioData;
  
  // Overlay configuration
  overlay: OverlayConfig;
  
  // Blessings (for blessing screens)
  blessings?: Blessing[];
  
  // Custom template settings
  customTemplate?: {
    isCustom: boolean;
    theme?: ThemeConfig;
    customScreens?: CustomScreenConfig[];
  };
  
  // Screen display names (for UI tabs - preserves original screen IDs)
  screenDisplayNames?: Record<string, string>; // screenId -> displayName

  // User-customized screen structure (order, placeholders, types) derived from template meta
  dynamicScreens?: ScreenConfig[];
  dynamicScreensTemplateId?: string;

  // UI context for main screen details (helps reflect marketing positioning)
  mainDetailsContext?: {
    heading?: string;
    subtitle?: string;
    titlePlaceholder?: string;
    textPlaceholder?: string;
  };

  // UI selection state
  selectedTemplateCardId?: string;

  // Global style configuration
  globalStyle?: GlobalStyleConfig;
}

export interface ThemeConfig {
  name: string;
  type: 'predefined' | 'custom';
  colors: {
    text?: string;
    textSecondary?: string;
    background?: string;
    backgroundSecondary?: string;
    accent?: string;
    border?: string;
    button?: string;
    buttonText?: string;
    overlay?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}

export interface CustomScreenConfig {
  id: string;
  type: 'intro' | 'gallery' | 'text' | 'blessings' | 'single';
  title?: string;
  text?: string;
  galleryLayout?: 'carousel' | 'gridWithZoom' | 'fullscreenSlideshow' | 'heroWithThumbnails' | 'timeline';
  order: number;
  supportsMusic?: boolean;
}

export interface ScreenData {
  title?: string;
  text?: string;
  images?: string[]; // Array of image IDs
  audioId?: string;
  extendMusicToNext?: boolean; // If true, this screen's music continues to next screen
  galleryLayout?: 'carousel' | 'gridWithZoom' | 'fullscreenSlideshow' | 'heroWithThumbnails' | 'timeline'; // Gallery layout type for screens with images
  mediaMode?: 'classic' | 'video'; // classic allows images/audio; video allows a single video only
  videoId?: string; // Only valid when mediaMode === 'video'

  // Custom styling properties
  customBackground?: 'template' | 'custom';
  backgroundColor?: string;
  backgroundGradient?: string;
  titleColor?: string;
  textColor?: string;
  titleSize?: string;

  // Screen-specific style overrides
  style?: ScreenStyleConfig;

  // Canvas elements (optional - new editing model)
  elements?: CanvasElement[];
}

export interface ImageData {
  id: string;
  filename: string;
  mime: string;
  size: number; // Size in bytes
  width?: number;
  height?: number;
  createdAt?: string;
  legacyDataUrl?: string; // legacy base64 (pre-migration)
  previewDataUrl?: string; // optional cached data URL for quicker preview
}

export interface VideoData {
  id: string;
  filename: string;
  mime: string;
  size: number; // bytes
  duration: number; // seconds
  width: number;
  height: number;
  posterDataUrl?: string;
  createdAt: string;
}

export interface AudioData {
  global?: AudioFile;
  screens: Record<string, AudioFile>; // screenId -> AudioFile
  library?: AudioFile[]; // Unassigned music files that can be assigned to screens
}

export interface AudioFile {
  id: string;
  filename: string;
  mime: string;
  size: number; // Size in bytes
  duration?: number; // seconds
  createdAt?: string;
  legacyDataUrl?: string; // legacy base64 (pre-migration)
  previewDataUrl?: string; // optional inline preview
}

export interface OverlayConfig {
  type: 'heart' | 'birthday' | 'save_the_date' | 'custom';
  mainText?: string;
  subText?: string;
  buttonText?: string;
  buttonStyle?: 'emoji-animated' | 'text-framed';
  emojiButton?: {
    emoji: string;
    size: number;
    animation: 'pulse' | 'bounce' | 'rotate' | 'scale';
  };
  textButton?: {
    text: string;
    frameStyle: 'solid' | 'dashed' | 'double' | 'shadow' | 'gradient' | 'heart' | 'star' | 'circle' | 'oval' | 'rectangle' | 'square';
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
  };
}

export interface Blessing {
  sender: string;
  text: string;
}

// Background animation configuration
export interface BackgroundAnimationConfig {
  type?: 'none' | 'hearts' | 'sparkles' | 'bubbles' | 'confetti' | 'fireworks' | 'stars';
  intensity?: 'low' | 'medium' | 'high';
  speed?: 'slow' | 'normal' | 'fast';
  color?: string; // Primary color for animation particles
}

// Button style configuration
export interface ButtonStyleConfig {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | number;
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  shape?: 'rectangle' | 'rounded' | 'pill' | 'circle';
  effects?: {
    shadow?: boolean;
    hover?: {
      backgroundColor?: string;
      textColor?: string;
    };
  };
}

// Global color and animation settings
export interface GlobalStyleConfig {
  colors?: {
    background?: string;
    text?: string;
    title?: string;
    button?: {
      background?: string;
      text?: string;
      border?: string;
    };
    navigation?: {
      next?: ButtonStyleConfig;
      prev?: ButtonStyleConfig;
      menu?: ButtonStyleConfig;
    };
  };
  backgroundAnimation?: BackgroundAnimationConfig;
}

// Per-screen style overrides
export interface ScreenStyleConfig {
  colors?: {
    background?: string;
    text?: string;
    title?: string;
  };
  backgroundAnimation?: BackgroundAnimationConfig;
}



