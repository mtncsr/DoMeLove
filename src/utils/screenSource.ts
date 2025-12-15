import type { Project } from '../types/project';
import type { TemplateMeta, ScreenConfig } from '../types/template';

/**
 * Single source of truth for screens used in export, preview, media resolution, and validation.
 * Ensures preview and export are always consistent.
 *
 * Logic:
 * - If project.data.dynamicScreens exists AND project.data.dynamicScreensTemplateId === project.templateId,
 *   use dynamicScreens ordered by order field
 * - Otherwise, fall back to templateMeta.screens ordered by order field
 */
export function getExportScreens(project: Project, templateMeta: TemplateMeta): ScreenConfig[] {
  if (
    project.data.dynamicScreens?.length &&
    project.data.dynamicScreensTemplateId === project.templateId
  ) {
    // User has customized screens - use their order and structure
    return project.data.dynamicScreens.slice().sort((a, b) => a.order - b.order);
  }
  // Fall back to template default screens
  return templateMeta.screens.slice().sort((a, b) => a.order - b.order);
}