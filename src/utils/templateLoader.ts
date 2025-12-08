import type { TemplateMeta } from '../types/template';

const TEMPLATES_BASE_PATH = '/templates';

export async function loadTemplateMeta(templateId: string): Promise<TemplateMeta> {
  try {
    const response = await fetch(`${TEMPLATES_BASE_PATH}/${templateId}/template-meta.json`);
    if (!response.ok) {
      throw new Error(`Failed to load template meta for ${templateId}: ${response.statusText}`);
    }
    const meta = await response.json() as TemplateMeta;
    
    // Validate structure
    if (!meta.templateId || !meta.templateName || !meta.screens) {
      throw new Error(`Invalid template meta structure for ${templateId}`);
    }
    
    return meta;
  } catch (error) {
    console.error(`Error loading template meta for ${templateId}:`, error);
    throw error;
  }
}

export async function loadTemplateHTML(templateId: string): Promise<string> {
  try {
    const response = await fetch(`${TEMPLATES_BASE_PATH}/${templateId}/template.html`);
    if (!response.ok) {
      throw new Error(`Failed to load template HTML for ${templateId}: ${response.statusText}`);
    }
    const html = await response.text();
    return html;
  } catch (error) {
    console.error(`Error loading template HTML for ${templateId}:`, error);
    throw error;
  }
}

export async function loadTemplate(templateId: string): Promise<{ meta: TemplateMeta; html: string }> {
  const [meta, html] = await Promise.all([
    loadTemplateMeta(templateId),
    loadTemplateHTML(templateId),
  ]);
  
  return { meta, html };
}






