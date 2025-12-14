import type { Project, ProjectData } from '../types/project';
import type { TemplateMeta } from '../types/template';
import type { ValidationResult, ValidationError } from '../types/validation';
import { MediaConfig } from '../config/mediaConfig';

class ValidationService {
  validateProject(project: Project, templateMeta: TemplateMeta): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Text/title placeholders that should never be required (user can export with just images)
    const textPlaceholders = ['recipientName', 'senderName', 'eventTitle', 'mainGreeting'];
    const textScreenPlaceholders = ['title', 'text'];

    // Check required global placeholders (ERRORS - blocking)
    // Skip text-related placeholders - they are no longer required
    for (const placeholder of templateMeta.globalPlaceholders) {
      // Skip all text/title placeholders - allow export without them
      if (textPlaceholders.includes(placeholder)) {
        continue;
      }
      const isRequired = this.isPlaceholderRequired(placeholder, templateMeta);
      if (isRequired && !this.hasPlaceholderValue(project.data, placeholder)) {
        errors.push({
          field: placeholder,
          message: `Required field "${placeholder}" is missing`,
          section: 'gift-details',
        });
      }
    }

    // Check required screen fields (ERRORS - blocking)
    // Skip text/title fields - they are no longer required
    for (const screen of templateMeta.screens) {
      const screenData = project.data.screens[screen.screenId];

      for (const placeholder of screen.required) {
        // Skip text/title placeholders - allow export without them
        if (textScreenPlaceholders.some(tp => placeholder.startsWith(tp))) {
          continue;
        }
        if (!this.hasScreenPlaceholderValue(project.data, screen.screenId, placeholder)) {
          errors.push({
            field: `${screen.screenId}.${placeholder}`,
            message: `Required field "${placeholder}" is missing for screen "${screen.screenId}"`,
            section: 'screen-texts',
          });
        }
      }

      // Video mode validation
      if (screenData?.mediaMode === 'video') {
        if (!screenData.videoId) {
          errors.push({
            field: `${screen.screenId}.video`,
            message: `Screen "${screen.screenId}" is set to Video mode but no video is selected`,
            section: 'videos',
          });
        } else {
          const video = (project.data.videos || []).find((v) => v.id === screenData.videoId);
          if (!video) {
            errors.push({
              field: `${screen.screenId}.video`,
              message: `Video metadata missing for screen "${screen.screenId}". Re-upload required.`,
              section: 'videos',
            });
          } else {
            const sizeMb = video.size / (1024 * 1024);
            if (sizeMb > MediaConfig.VIDEO_MAX_SIZE_MB) {
              errors.push({
                field: `${screen.screenId}.video`,
                message: `Video "${video.filename}" exceeds max size (${sizeMb.toFixed(1)}MB > ${MediaConfig.VIDEO_MAX_SIZE_MB}MB).`,
                section: 'videos',
              });
            }
            if (video.duration > MediaConfig.VIDEO_MAX_DURATION_SECONDS) {
              errors.push({
                field: `${screen.screenId}.video`,
                message: `Video "${video.filename}" exceeds max duration (${video.duration.toFixed(1)}s > ${MediaConfig.VIDEO_MAX_DURATION_SECONDS}s).`,
                section: 'videos',
              });
            }
          }
        }
      }

      // Check image count for gallery screens (WARNINGS - non-blocking)
      if (screen.galleryImageCount) {
        const imageCount = this.getScreenImageCount(project.data, screen.screenId);
        if (imageCount < screen.galleryImageCount) {
          warnings.push({
            field: `${screen.screenId}.images`,
            message: `Screen "${screen.screenId}" recommends at least ${screen.galleryImageCount} images`,
            section: 'images',
          });
        }
      }

      // Check blessing count (WARNINGS - non-blocking)
      if (screen.blessingCount) {
        const blessingCount = project.data.blessings?.length || 0;
        if (blessingCount < screen.blessingCount) {
          warnings.push({
            field: `${screen.screenId}.blessings`,
            message: `Screen "${screen.screenId}" recommends at least ${screen.blessingCount} blessings`,
            section: 'screen-texts',
          });
        }
      }
    }

    // Check image file sizes (WARNINGS - non-blocking)
    for (const image of project.data.images) {
      const sizeKB = image.size / 1024;
      if (sizeKB > MediaConfig.IMAGE_TARGET_SIZE_KB.max * 2) {
        warnings.push({
          field: `image.${image.id}`,
          message: `Image "${image.filename}" is very large (${sizeKB.toFixed(0)}KB). Consider compressing it.`,
          section: 'images',
        });
      }
    }

    // Video total budget (blocking)
    const totalVideoBytes = (project.data.videos || []).reduce((acc, vid) => acc + (vid.size || 0), 0);
    const totalVideoMb = totalVideoBytes / (1024 * 1024);
    if (totalVideoMb > MediaConfig.VIDEO_MAX_TOTAL_MB) {
      errors.push({
        field: 'videos.total',
        message: `Total video size exceeds budget (${totalVideoMb.toFixed(1)}MB > ${MediaConfig.VIDEO_MAX_TOTAL_MB}MB).`,
        section: 'videos',
      });
    }

    // Check audio file sizes (WARNINGS - non-blocking)
    if (project.data.audio.global) {
      const sizeMB = project.data.audio.global.size / (1024 * 1024);
      if (sizeMB > MediaConfig.AUDIO_WARNING_SIZE_MB) {
        warnings.push({
          field: 'audio.global',
          message: `Global audio file is large (${sizeMB.toFixed(1)}MB). This may affect sharing.`,
          section: 'music',
        });
      }
    }

    // Check screen audio file sizes (WARNINGS - non-blocking)
    for (const [screenId, audio] of Object.entries(project.data.audio.screens)) {
      const sizeMB = audio.size / (1024 * 1024);
      if (sizeMB > MediaConfig.AUDIO_WARNING_SIZE_MB) {
        warnings.push({
          field: `audio.screen.${screenId}`,
          message: `Audio file for screen "${screenId}" is large (${sizeMB.toFixed(1)}MB). This may affect sharing.`,
          section: 'music',
        });
      }
    }

    return {
      isValid: errors.length === 0, // Only errors block export
      errors,
      warnings,
    };
  }

  validateImport(jsonData: unknown): { isValid: boolean; project?: Project; errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];

    try {
      if (!jsonData || typeof jsonData !== 'object') {
        errors.push({
          field: 'root',
          message: 'Invalid JSON structure',
        });
        return { isValid: false, errors, warnings: [] };
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
        return { isValid: false, errors, warnings: [] };
      }

      return { isValid: true, project, errors: [], warnings: [] };
    } catch (error) {
      errors.push({
        field: 'root',
        message: `Error parsing import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return { isValid: false, errors, warnings: [] };
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



