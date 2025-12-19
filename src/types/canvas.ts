// Canvas element types for the new editor

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'music' | 'button' | 'emoji' | 'frame' | 'background';
  position: { x: number; y: number }; // Percentages 0-100, top-left anchor
  size: { width: number; height: number }; // Percentages 0-100
  rotation?: number; // degrees
  zIndex: number;
  style: ElementStyle; // type-specific
  animation?: AnimationConfig;
  // Type-specific data
  content?: string; // for text
  mediaId?: string; // for image/video/music
  buttonType?: 'next' | 'prev' | 'back' | 'menu' | 'start';
  emoji?: string; // for emoji stickers
  layout?: 'single' | 'carousel' | 'grid' | 'hero' | 'timeline'; // for images
}

export interface ElementStyle {
  // Text styles
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
  
  // Image/Media styles
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: boolean;
  opacity?: number;
  
  // Background styles
  backgroundColor?: string;
  backgroundGradient?: string;
  
  // Button styles
  buttonStyle?: 'emoji-animated' | 'text-framed';
  frameStyle?: 'solid' | 'dashed' | 'double' | 'shadow' | 'gradient' | 'heart' | 'star' | 'circle' | 'oval' | 'rectangle' | 'square';
}

export interface AnimationConfig {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'bounce' | 'pulse' | 'rotate' | 'scale';
  duration?: number; // milliseconds
  delay?: number; // milliseconds
  easing?: string; // CSS easing function
  loop?: boolean;
}
