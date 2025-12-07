import type { Project, ProjectData } from '../types/project';
import type { TemplateMeta } from '../types/template';
import type { ValidationResult, ValidationError } from '../types/validation';
import { MediaConfig } from '../config/mediaConfig';

class ValidationService {
  validateProject(project: Project, templateMeta: TemplateMeta): ValidationResult {
    const errors: ValidationError[] = [];

    // Check required global placeholders
    for (const placeholder of templateMeta.globalPlaceholders) {
      const isRequired = this.isPlaceholderRequired(placeholder, templateMeta);
      if (isRequired && !this.hasPlaceholderValue(project.data, placeholder)) {
        errors.push({
          field: placeholder,
          message: `Required field "${placeholder}" is missing`,
          section: 'gift-details',
        });
      }
    }

    // Check required screen fields
    for (const screen of templateMeta.screens) {
      for (const placeholder of screen.required) {
        if (!this.hasScreenPlaceholderValue(project.data, screen.screenId, placeholder)) {
          errors.push({
            field: `${screen.screenId}.${placeholder}`,
            message: `Required field "${placeholder}" is missing for screen "${screen.screenId}"`,
            section: 'screen-texts',
          });
        }
      }

      // Check image count for gallery screens
      if (screen.galleryImageCount) {
        const imageCount = this.getScreenImageCount(project.data, screen.screenId);
        if (imageCount < screen.galleryImageCount) {
          errors.push({
            field: `${screen.screenId}.images`,
            message: `Screen "${screen.screenId}" requires at least ${screen.galleryImageCount} images`,
            section: 'images',
          });
        }
      }

      // Check blessing count
      if (screen.blessingCount && project.data.blessings) {
        if (project.data.blessings.length < screen.blessingCount) {
          errors.push({
            field: `${screen.screenId}.blessings`,
            message: `Screen "${screen.screenId}" requires at least ${screen.blessingCount} blessings`,
            section: 'screen-texts',
          });
        }
      }
    }

    // Check image file sizes
    for (const image of project.data.images) {
      const sizeKB = image.size / 1024;
      if (sizeKB > MediaConfig.IMAGE_TARGET_SIZE_KB.max * 2) {
        errors.push({
          field: `image.${image.id}`,
          message: `Image "${image.filename}" is very large (${sizeKB.toFixed(0)}KB). Consider compressing it.`,
          section: 'images',
        });
      }
    }

    // Check audio file sizes
    if (project.data.audio.global) {
      const sizeMB = project.data.audio.global.size / (1024 * 1024);
      if (sizeMB > MediaConfig.AUDIO_WARNING_SIZE_MB) {
        errors.push({
          field: 'audio.global',
          message: `Global audio file is large (${sizeMB.toFixed(1)}MB). This may affect sharing.`,
          section: 'music',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateImport(jsonData: unknown): { isValid: boolean; project?: Project; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    try {
      if (!jsonData || typeof jsonData !== 'object') {
        errors.push({
          field: 'root',
          message: 'Invalid JSON structure',
        });
        return { isValid: false, errors };
      }

      const project = jsonData as Project;

      // Check required fields
      if (!project.id || typeof project.id !== 'string') {
        errors.push({ field: 'id', message: 'Project ID is required and must be a string' });
      }
      if (!project.name || typeof project.name !== 'string') {
        errors.push({ field: 'name', message: 'Project name is required and must be a string' });
      }
      if (!project.templateId || typeof project.templateId !== 'string') {
        errors.push({ field: 'templateId', message: 'Template ID is required and must be a string' });
      }
      if (!project.data || typeof project.data !== 'object') {
        errors.push({ field: 'data', message: 'Project data is required' });
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      return { isValid: true, project, errors: [] };
    } catch (error) {
      errors.push({
        field: 'root',
        message: `Error parsing import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return { isValid: false, errors };
    }
  }

  private isPlaceholderRequired(placeholder: string, templateMeta: TemplateMeta): boolean {
    // Check if placeholder is in any screen's required list
    for (const screen of templateMeta.screens) {
      if (screen.required.includes(placeholder)) {
        return true;
      }
    }
    return false;
  }

  private hasPlaceholderValue(data: ProjectData, placeholder: string): boolean {
    switch (placeholder) {
      case 'recipientName':
        return !!data.recipientName;
      case 'senderName':
        return !!data.senderName;
      case 'eventTitle':
        return !!data.eventTitle;
      case 'mainGreeting':
        return !!data.mainGreeting;
      default:
        return false;
    }
  }

  private hasScreenPlaceholderValue(data: ProjectData, screenId: string, placeholder: string): boolean {
    const screen = data.screens[screenId];
    if (!screen) return false;

    if (placeholder.startsWith('title')) {
      return !!screen.title;
    }
    if (placeholder.startsWith('text')) {
      return !!screen.text;
    }
    return false;
  }

  private getScreenImageCount(data: ProjectData, screenId: string): number {
    const screen = data.screens[screenId];
    if (!screen || !screen.images) return 0;
    return screen.images.length;
  }
}

export const validationService = new ValidationService();



