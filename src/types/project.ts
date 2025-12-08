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
}

export interface ImageData {
  id: string;
  data: string; // Base64
  filename: string;
  size: number; // Size in bytes
  width?: number;
  height?: number;
}

export interface AudioData {
  global?: AudioFile;
  screens: Record<string, AudioFile>; // screenId -> AudioFile
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
}

export interface Blessing {
  sender: string;
  text: string;
}



