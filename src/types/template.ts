// Template metadata structure
export interface TemplateMeta {
  templateId: string;
  templateName: string;
  overlayType: 'heart' | 'birthday' | 'save_the_date' | 'custom';
  screens: ScreenConfig[];
  globalPlaceholders: string[];
  designVariables?: DesignVariable[];
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







