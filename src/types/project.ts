import type { ScreenConfig } from './template';

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
  
  // Images (Base64)
  images: ImageData[];

  // Videos (metadata only; blobs stored in IndexedDB)
  videos: VideoData[];
  
  // Audio (Base64)
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
}

export interface ImageData {
  id: string;
  data: string; // Base64
  filename: string;
  size: number; // Size in bytes
  width?: number;
  height?: number;
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
  data: string; // Base64
  filename: string;
  size: number; // Size in bytes
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
  };
}

export interface Blessing {
  sender: string;
  text: string;
}



