/**
 * Unified rendering pipeline for preview and export
 * 
 * This module provides a single source of truth for HTML generation used by:
 * - Screens panel preview (single screen)
 * - Preview & Export panel (full flow)
 * - Final exported HTML file
 * 
 * The only difference between preview and export is media URL strategy:
 * - Preview: blob/object URLs (for performance)
 * - Export: base64 data URLs (for standalone HTML)
 */

import type { Project } from '../types/project';
import type { TemplateMeta, ScreenConfig } from '../types/template';
import { getExportScreens } from './screenSource';
import { getMediaDataUrl, getMediaPreviewUrl, blobToDataUrl } from '../services/mediaService';
import { getVideoBlob } from '../services/videoBlobStore';
import { buildGiftHtmlFromTemplate, type MediaUrls, type BuildHtmlOptions } from './exportBuilder';

export type RenderMode = 'preview' | 'export';

// Simple in-memory cache for preview HTML (keyed by cache key)
const previewHtmlCache = new Map<string, { html: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateCacheKey(
  project: Project,
  templateMeta: TemplateMeta,
  options: BuildGiftHtmlOptions
): string {
  const { mode, startScreenId, singleScreenOnly, hideEmptyScreens } = options;
  return `${project.id}_${project.templateId}_${project.updatedAt}_${mode}_${startScreenId || 'all'}_${singleScreenOnly || false}_${hideEmptyScreens || false}`;
}

function getCachedPreviewHtml(cacheKey: string): string | null {
  const cached = previewHtmlCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.html;
  }
  if (cached) {
    previewHtmlCache.delete(cacheKey);
  }
  return null;
}

function setCachedPreviewHtml(cacheKey: string, html: string): void {
  previewHtmlCache.set(cacheKey, { html, timestamp: Date.now() });
  
  // Cleanup old entries (keep cache size reasonable)
  if (previewHtmlCache.size > 50) {
    const entries = Array.from(previewHtmlCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest 10 entries
    for (let i = 0; i < 10 && i < entries.length; i++) {
      previewHtmlCache.delete(entries[i][0]);
    }
  }
}

export interface BuildGiftHtmlOptions {
  /** Render mode: 'preview' uses blob URLs, 'export' uses base64 data URLs */
  mode: RenderMode;
  /** Optional: start at specific screen ID (for single screen preview) */
  startScreenId?: string;
  /** If true, only render the startScreenId screen */
  singleScreenOnly?: boolean;
  /** If true, filter out screens with no content */
  hideEmptyScreens?: boolean;
}

// MediaUrls and BuildHtmlOptions are re-exported from exportBuilder
export type { MediaUrls, BuildHtmlOptions } from './exportBuilder';

/**
 * Check if a screen has content (images, video, text, or title)
 */
function screenHasContent(screen: ScreenConfig, project: Project): boolean {
  const screenData = project.data.screens[screen.screenId] || {};
  const mediaMode = screenData.mediaMode || 'classic';
  const hasImages = mediaMode === 'classic' && Array.isArray(screenData.images) && screenData.images.length > 0;
  const hasVideo = mediaMode === 'video' && !!screenData.videoId;
  const hasText = !!screenData.text?.trim();
  const hasTitle = !!screenData.title?.trim();
  return hasImages || hasVideo || hasText || hasTitle;
}

/**
 * Resolve media URLs based on mode
 * Preview: blob URLs (fast, memory-efficient)
 * Export: base64 data URLs (standalone HTML)
 */
async function resolveMediaUrls(
  project: Project,
  templateMeta: TemplateMeta,
  screens: ScreenConfig[],
  mode: RenderMode
): Promise<MediaUrls> {
  const images = new Map<string, string>();
  const audio = new Map<string, string>();
  const videos = new Map<string, string>();

  // Collect image IDs from screen assignments
  const imageIds = new Set<string>();
  for (const screen of screens) {
    const screenData = project.data.screens[screen.screenId];
    if (screenData?.images) {
      screenData.images.forEach(id => imageIds.add(id));
    }
  }

  // Collect audio IDs (global + per-screen)
  const audioIds = new Set<string>();
  if (project.data.audio.global) {
    audioIds.add(project.data.audio.global.id);
  }
  for (const screen of screens) {
    const audio = project.data.audio.screens[screen.screenId];
    if (audio?.id) {
      audioIds.add(audio.id);
    }
  }

  // Collect video IDs
  const videoIds = new Set<string>();
  for (const screen of screens) {
    const screenData = project.data.screens[screen.screenId];
    if (screenData?.mediaMode === 'video' && screenData.videoId) {
      videoIds.add(screenData.videoId);
    }
  }

  // Concurrency-limited resolver helper
  async function resolveWithLimit<T>(
    items: T[],
    resolver: (item: T) => Promise<[string, string] | null>,
    limit: number = 6
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const queue = [...items];

    async function worker() {
      while (queue.length > 0) {
        const item = queue.shift()!;
        const resolved = await resolver(item);
        if (resolved) {
          result.set(resolved[0], resolved[1]);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
    return result;
  }

  // Resolve images
  if (mode === 'export') {
    // Export: base64 data URLs
    const imageMap = await resolveWithLimit(
      Array.from(imageIds),
      async (id) => {
        const dataUrl = await getMediaDataUrl(project.id, id);
        if (!dataUrl) {
          const image = project.data.images.find(img => img.id === id);
          throw new Error(`Image blob missing: ${image?.filename || id} (ID: ${id}). Please re-upload.`);
        }
        return [id, dataUrl];
      },
      6
    );
    imageMap.forEach((url, id) => images.set(id, url));
  } else {
    // Preview: blob URLs
    const imageMap = await resolveWithLimit(
      Array.from(imageIds),
      async (id) => {
        const blobUrl = await getMediaPreviewUrl(project.id, id);
        if (!blobUrl) {
          // In preview mode, return empty string instead of throwing (show placeholder)
          return [id, ''];
        }
        return [id, blobUrl];
      },
      6
    );
    imageMap.forEach((url, id) => images.set(id, url));
  }

  // Resolve audio
  if (mode === 'export') {
    // Export: base64 data URLs
    const audioMap = await resolveWithLimit(
      Array.from(audioIds),
      async (id) => {
        const dataUrl = await getMediaDataUrl(project.id, id);
        if (!dataUrl) {
          const audio = project.data.audio.global?.id === id
            ? project.data.audio.global
            : Object.values(project.data.audio.screens).find(a => a?.id === id);
          throw new Error(`Audio blob missing: ${audio?.filename || id} (ID: ${id}). Please re-upload.`);
        }
        return [id, dataUrl];
      },
      6
    );
    audioMap.forEach((url, id) => audio.set(id, url));
  } else {
    // Preview: blob URLs
    const audioMap = await resolveWithLimit(
      Array.from(audioIds),
      async (id) => {
        const blobUrl = await getMediaPreviewUrl(project.id, id);
        if (!blobUrl) {
          // In preview mode, return empty string instead of throwing
          return [id, ''];
        }
        return [id, blobUrl];
      },
      6
    );
    audioMap.forEach((url, id) => audio.set(id, url));
  }

  // Resolve videos
  if (mode === 'export') {
    // Export: base64 data URLs
    for (const videoId of videoIds) {
      const blob = await getVideoBlob(project.id, videoId);
      if (!blob) {
        const videoMeta = project.data.videos.find(v => v.id === videoId);
        throw new Error(`Video blob missing: ${videoMeta?.filename || videoId}. Please re-upload.`);
      }
      const dataUrl = await blobToDataUrl(blob);
      videos.set(videoId, dataUrl);
    }
  } else {
    // Preview: blob URLs
    for (const videoId of videoIds) {
      const blob = await getVideoBlob(project.id, videoId);
      if (!blob) {
        // In preview mode, return empty string instead of throwing
        videos.set(videoId, '');
      } else {
        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(blob);
        videos.set(videoId, blobUrl);
      }
    }
  }

  return { images, audio, videos };
}

/**
 * Build unified HTML for preview or export
 * 
 * This is the single source of truth for HTML generation.
 * All previews and exports use this function.
 */
export async function buildGiftHtml(
  project: Project,
  templateMeta: TemplateMeta,
  options: BuildGiftHtmlOptions
): Promise<string> {
  const { mode, startScreenId, singleScreenOnly, hideEmptyScreens } = options;

  // Check cache for preview mode
  if (mode === 'preview') {
    const cacheKey = generateCacheKey(project, templateMeta, options);
    const cached = getCachedPreviewHtml(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Step 1: Resolve screens using getExportScreens() (single source of truth)
  let screens = getExportScreens(project, templateMeta);

  // Step 2: Optionally filter empty screens
  if (hideEmptyScreens) {
    screens = screens.filter(screen => screenHasContent(screen, project));
  }

  // Step 3: Optionally filter to single screen
  if (singleScreenOnly && startScreenId) {
    const targetScreen = screens.find(s => s.screenId === startScreenId);
    if (targetScreen) {
      screens = [targetScreen];
    } else {
      // Screen not found, return empty HTML with error message
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
</head>
<body>
  <div style="padding: 2rem; text-align: center; color: #666;">
    <p>Screen "${startScreenId}" not found</p>
  </div>
</body>
</html>`;
    }
  }

  // Step 4: Resolve media URLs (blob URLs for preview, base64 for export)
  const mediaUrls = await resolveMediaUrls(project, templateMeta, screens, mode);

  // Step 5: Build HTML using unified builder
  const html = await buildGiftHtmlFromTemplate(
    project,
    templateMeta,
    screens,
    mediaUrls,
    mode,
    {
      startScreenId,
      singleScreenOnly: singleScreenOnly || false,
    }
  );

  // Cache preview HTML
  if (mode === 'preview') {
    const cacheKey = generateCacheKey(project, templateMeta, options);
    setCachedPreviewHtml(cacheKey, html);
  }

  return html;
}

