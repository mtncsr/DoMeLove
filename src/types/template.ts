// Template metadata structure
export interface TemplateMeta {
  templateId: string;
  templateName: string;
  shortName?: string;
  overlayType: 'heart' | 'birthday' | 'save_the_date' | 'custom';
  screens: ScreenConfig[];
  globalPlaceholders: string[];
  designConfig?: DesignConfig;
  designVariables?: DesignVariable[];
}

export interface DesignConfig {
  background: string; // CSS background (gradient or color)
  defaultEmojis: string[];
  textPlaceholders: {
    title?: string;
    text?: string;
    mainGreeting?: string;
  };
}

export interface ScreenConfig {
  screenId: string;
  type: 'intro' | 'gallery' | 'text' | 'blessings' | 'single' | 'birth-details' | 'event-details';
  placeholders: string[];
  required: string[];
  order: number;
  supportsMusic?: boolean;
  galleryImageCount?: number; // For gallery screens
  blessingCount?: number; // For blessing screens
}

export interface DesignVariable {
  key: string;
  name: string;
  type: 'color' | 'font';
  defaultValue: string;
}







