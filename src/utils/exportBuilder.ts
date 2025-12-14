import type { Project, ImageData } from '../types/project';
import type { TemplateMeta } from '../types/template';
import { loadTemplateHTML } from './templateLoader';
import { MediaConfig } from '../config/mediaConfig';
import { getVideoBlob } from '../services/videoBlobStore';

// AudioManager is now integrated into GiftApp - no separate global needed

export async function buildExportHTML(project: Project, templateMeta: TemplateMeta): Promise<string> {
  // Load template HTML or generate for custom templates
  let html: string;
  if (project.templateId === 'custom' && project.data.customTemplate?.isCustom) {
    html = generateCustomTemplateHTML(project, templateMeta);
  } else {
    html = await loadTemplateHTML(project.templateId);
  }

  // Update template onclick handlers to use GiftApp namespace
  html = updateTemplateOnclickHandlers(html);

  // Transform existing template screens to preview-matching structure
  if (project.templateId !== 'custom' || !project.data.customTemplate?.isCustom) {
    html = transformTemplateScreensToPreviewStructure(html, project, templateMeta);
  }

  // Replace simple flat placeholders
  html = replacePlaceholders(html, project, templateMeta);

  // Handle repeating structures (galleries, blessings) based on template-meta
  html = injectRepeatingStructures(html, project, templateMeta);

  // Inject videos (fetch blobs and embed data URLs)
  html = await injectVideos(html, project, templateMeta);

  // Add HTML section comments and inject all scripts/styles in organized sections
  html = buildOrganizedHTML(html, project, templateMeta);

  // Dev-time verification (only in development)
  if (import.meta.env.DEV) {
    verifyExportStructure(html);
  }

  return html;
}

/**
 * Dev-time helper to verify exported HTML structure
 * Logs warnings if expected structures are missing
 */
export function verifyExportStructure(html: string): void {
  const checks = {
    hasGiftAppNamespace: /window\.GiftApp\s*=/.test(html),
    hasStylesSection: /STYLES SECTION/.test(html),
    hasTemplatesSection: /TEMPLATES & CONTENT SECTION/.test(html),
    hasRuntimeSection: /RUNTIME LOGIC SECTION/.test(html),
    noLooseGlobals: !/window\.(startExperience|nextScreen|previousScreen|carouselPrev|carouselNext|carouselGoTo|zoomImage)\s*=/.test(html),
    noGlobalAudioManager: !/window\.AudioManager\s*=/.test(html),
    hasAudioInGiftApp: /GiftApp.*audio/.test(html),
  };

  const warnings: string[] = [];
  if (!checks.hasGiftAppNamespace) warnings.push('❌ GiftApp namespace not found');
  if (!checks.hasStylesSection) warnings.push('❌ STYLES SECTION comment not found');
  if (!checks.hasTemplatesSection) warnings.push('❌ TEMPLATES & CONTENT SECTION comment not found');
  if (!checks.hasRuntimeSection) warnings.push('❌ RUNTIME LOGIC SECTION comment not found');
  if (!checks.noLooseGlobals) warnings.push('⚠️  Loose global functions found (should be in GiftApp namespace)');
  if (!checks.noGlobalAudioManager) warnings.push('⚠️  Global AudioManager found (should be integrated into GiftApp)');
  if (!checks.hasAudioInGiftApp) warnings.push('⚠️  GiftApp.audio not found');

  if (warnings.length > 0) {
    console.warn('Export structure verification:', warnings.join('\n'));
  } else {
    console.log('✅ Export structure verification passed');
  }

  // Log public API
  const giftAppMatch = html.match(/return\s*\{([\s\S]*?)\}\s*;\s*}\s*\)\s*\(\s*\)\s*;\s*window\.GiftApp/);
  if (giftAppMatch) {
    const publicAPI = giftAppMatch[1].match(/\w+:/g)?.map(k => k.replace(':', '')) || [];
    console.log('📦 GiftApp public API:', publicAPI.join(', '));
  }
}


/**
 * Generate preview-matching screen HTML structure
 * Matches the exact layout from ScreenPreview component (used in screens panel)
 */
function generatePreviewMatchingScreenHTML(
  screen: { screenId: string; order: number },
  screenData: any,
  project: Project,
  templateMeta: TemplateMeta
): string {
  const titleText = (screenData.title || '').trim();
  const bodyText = (screenData.text || '').trim();
  const mediaMode = screenData.mediaMode || 'classic';
  const hasVideo = mediaMode === 'video' && !!screenData.videoId;
  const isMainScreen = screen.order === 1;
  
  // Get images for this screen
  const imageMap = new Map<string, ImageData>();
  for (const img of project.data.images) {
    imageMap.set(img.id, img);
  }
  
  const screenImages = (screenData.images || [])
    .map((imageId: string) => imageMap.get(imageId))
    .filter((img: ImageData | undefined): img is ImageData => img !== undefined);
  
  const hasImages = screenImages.length > 0 && !hasVideo;
  
  // Generate media content (images carousel or video)
  let mediaContent = '';
  if (hasVideo && screenData.videoId) {
    // Video will be injected later via injectVideos, use placeholder
    mediaContent = `{{${screen.screenId}_video}}`;
  } else if (hasImages) {
    const galleryLayout = screenData.galleryLayout || 'carousel';
    switch (galleryLayout) {
      case 'gridWithZoom':
        mediaContent = generateGridWithZoomHTML(screen.screenId, screenImages);
        break;
      case 'fullscreenSlideshow':
        mediaContent = generateFullscreenSlideshowHTML(screen.screenId, screenImages);
        break;
      case 'heroWithThumbnails':
        mediaContent = generateHeroWithThumbnailsHTML(screen.screenId, screenImages);
        break;
      case 'timeline':
        mediaContent = generateTimelineHTML(screen.screenId, screenImages);
        break;
      case 'carousel':
      default:
        mediaContent = generateImageCarouselHTML(screen.screenId, screenImages);
        break;
    }
  }
  
  // Get screen-specific and global styles (matching ScreenPreview logic)
  const globalStyle = project.data.globalStyle;
  const screenStyle = screenData.style;
  const designConfig = templateMeta?.designConfig;
  
  // Determine background color (screen override > global > custom > template)
  let backgroundStyle = '';
  if (screenStyle?.colors?.background) {
    backgroundStyle = `background-color: ${screenStyle.colors.background};`;
  } else if (globalStyle?.colors?.background) {
    backgroundStyle = `background-color: ${globalStyle.colors.background};`;
  } else if (screenData.customBackground === 'custom') {
    if (screenData.backgroundGradient) {
      backgroundStyle = `background: ${screenData.backgroundGradient};`;
    } else if (screenData.backgroundColor) {
      backgroundStyle = `background-color: ${screenData.backgroundColor};`;
    }
  } else if (designConfig?.background) {
    backgroundStyle = `background: ${designConfig.background};`;
  }
  
  // For main screen, use overlay gradient background
  if (isMainScreen && project.data.overlay) {
    backgroundStyle = 'background: linear-gradient(to bottom right, rgb(236, 72, 153), rgb(239, 68, 68));';
  }
  
  // Determine text colors (screen override > global > default)
  const textColor = screenStyle?.colors?.text || globalStyle?.colors?.text || screenData.textColor || '#374151';
  const titleColor = screenStyle?.colors?.title || globalStyle?.colors?.title || screenData.titleColor || '#111827';
  
  // For main screen, use white text on gradient background
  const finalTitleColor = isMainScreen && project.data.overlay 
    ? (titleColor === '#111827' ? 'white' : titleColor)
    : titleColor;
  const finalTextColor = isMainScreen && project.data.overlay
    ? (textColor === '#374151' ? 'white' : textColor)
    : textColor;
  
  // Build inline styles for text elements
  const titleStyle = finalTitleColor ? ` style="color: ${finalTitleColor};"` : '';
  const textStyle = finalTextColor ? ` style="color: ${finalTextColor};"` : '';

  // Main screen layout (matching ScreenPreview)
  if (isMainScreen) {
    // Generate overlay button HTML based on button style
    let overlayButtonHTML = '';
    const overlay = project.data.overlay;
    
    if (overlay.buttonStyle === 'emoji-animated') {
      const emoji = overlay.emojiButton?.emoji || '🎉';
      const size = overlay.emojiButton?.size || 48;
      const animation = overlay.emojiButton?.animation || 'pulse';
      overlayButtonHTML = `<button type="button" class="emoji-button emoji-${animation}" style="font-size: ${size}px; width: ${size + 20}px; height: ${size + 20}px; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 50%;">${emoji}</button>`;
    } else if (overlay.buttonStyle === 'text-framed') {
      const text = overlay.textButton?.text || 'Start Experience';
      const frameStyle = overlay.textButton?.frameStyle || 'solid';
      const buttonBg = overlay.textButton?.backgroundColor || project.data.globalStyle?.colors?.button?.background || 'white';
      const buttonText = overlay.textButton?.textColor || project.data.globalStyle?.colors?.button?.text || '#333';
      const buttonBorder = overlay.textButton?.borderColor || project.data.globalStyle?.colors?.button?.border || '#333';
      
      // Build frame-specific styles
      let buttonStyle = `padding: 12px 24px; cursor: pointer; font-weight: bold; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center;`;
      
      if (frameStyle === 'solid' || frameStyle === 'dashed' || frameStyle === 'double' || frameStyle === 'shadow' || frameStyle === 'rectangle' || frameStyle === 'square') {
        buttonStyle += `background-color: ${buttonBg}; color: ${buttonText}; border: 2px solid ${buttonBorder}; border-radius: 8px;`;
      } else if (frameStyle === 'circle' || frameStyle === 'oval') {
        buttonStyle += `background-color: ${buttonBg}; color: ${buttonText}; border: 3px solid ${buttonBorder}; border-radius: 50%;`;
      } else if (frameStyle === 'gradient') {
        buttonStyle += `border: none; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: ${buttonText}; border-radius: 8px;`;
      } else if (frameStyle === 'heart') {
        buttonStyle += `border: none; background: ${buttonBg === 'white' ? '#ff6b6b' : buttonBg}; color: ${buttonText}; clip-path: polygon(50% 0%, 61% 0%, 68% 11%, 79% 11%, 86% 0%, 100% 0%, 100% 50%, 50% 100%, 0% 50%, 0% 0%, 14% 0%, 21% 11%, 32% 11%); width: 120px; height: 100px; font-size: 14px; border-radius: 0;`;
      } else if (frameStyle === 'star') {
        buttonStyle += `border: none; background: ${buttonBg === 'white' ? '#ffd93d' : buttonBg}; color: ${buttonText}; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); width: 100px; height: 100px; font-size: 12px; border-radius: 0;`;
      }
      
      overlayButtonHTML = `<button type="button" class="text-button frame-${frameStyle}" style="${buttonStyle}">${escapeHtmlForExport(text)}</button>`;
    }
    
    return `
    <div class="screen hidden" id="screen-${screen.screenId}" style="${backgroundStyle}">
      <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-center; text-align: center; padding: 2rem; gap: 1.5rem;">
        ${titleText ? `<h1 class="screen-title" style="font-weight: bold; font-size: 1.875rem; ${titleStyle}">${escapeHtmlForExport(titleText)}</h1>` : ''}
        ${project.data.mainGreeting ? `<p style="font-size: 1.125rem; max-width: 42rem; line-height: 1.75; ${textStyle}">${escapeHtmlForExport(project.data.mainGreeting)}</p>` : ''}
        ${overlayButtonHTML}
      </div>
    </div>
    `;
  }
  
  // Get screen config from templateMeta to check placeholders
  const screenConfig = templateMeta.screens.find(s => s.screenId === screen.screenId);
  const hasTitlePlaceholder = screenConfig?.placeholders?.includes('title');
  const hasTextPlaceholder = screenConfig?.placeholders?.includes('text');
  
  // Regular screen layout (matching ScreenPreview)
  return `
    <div class="screen hidden" id="screen-${screen.screenId}" style="${backgroundStyle}">
      <div style="padding: 2rem; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 1.5rem;">
        ${hasTitlePlaceholder && titleText ? `<h1 class="screen-title" style="font-weight: bold; font-size: 1.875rem; ${titleStyle}">${escapeHtmlForExport(titleText)}</h1>` : ''}
        ${hasTextPlaceholder && bodyText ? `<p class="screen-text" style="font-size: 1.125rem; max-width: 42rem; line-height: 1.75; ${textStyle}">${escapeHtmlForExport(bodyText)}</p>` : ''}
        ${!hasVideo && hasImages ? `<div style="width: 100%; max-width: 42rem;">${mediaContent}</div>` : ''}
        ${hasVideo && screenData.videoId ? `<div style="width: 100%; max-width: 24rem;">${mediaContent}</div>` : ''}
        ${!titleText && !bodyText && !hasImages && !screenData.videoId ? `
          <div style="color: #9ca3af; text-align: center;">
            <div style="font-size: 3.75rem; margin-bottom: 1rem;">📄</div>
            <div style="font-size: 1.125rem;">Screen content will appear here</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function generateCustomTemplateHTML(project: Project, templateMeta: TemplateMeta): string {
  const screens = templateMeta.screens.sort((a, b) => a.order - b.order);
  const screensHTML = screens.map((screen) => {
    const screenData = project.data.screens[screen.screenId] || {};
    return generatePreviewMatchingScreenHTML(screen, screenData, project, templateMeta);
  }).join('\n');

  // Generate overlay button based on button style
  let overlayButtonHTML = '<button type="button">{{overlayButtonText}}</button>';
  const overlay = project.data.overlay;

  if (overlay.buttonStyle === 'emoji-animated') {
    const emoji = overlay.emojiButton?.emoji || '🎉';
    const size = overlay.emojiButton?.size || 48;
    const animation = overlay.emojiButton?.animation || 'pulse';
    overlayButtonHTML = `<button type="button" class="emoji-button emoji-${animation}" style="font-size: ${size}px; width: ${size + 20}px; height: ${size + 20}px;">${emoji}</button>`;
  } else if (overlay.buttonStyle === 'text-framed') {
    const text = overlay.textButton?.text || 'Start Experience';
    const frameStyle = overlay.textButton?.frameStyle || 'solid';
    const buttonBg = overlay.textButton?.backgroundColor || project.data.globalStyle?.colors?.button?.background || 'white';
    const buttonText = overlay.textButton?.textColor || project.data.globalStyle?.colors?.button?.text || '#333';
    const buttonBorder = overlay.textButton?.borderColor || project.data.globalStyle?.colors?.button?.border || '#333';
    
    // Build inline style for button
    let buttonStyle = '';
    if (frameStyle === 'solid' || frameStyle === 'dashed' || frameStyle === 'double' || frameStyle === 'shadow' || frameStyle === 'rectangle' || frameStyle === 'square') {
      buttonStyle = `background-color: ${buttonBg}; color: ${buttonText}; border-color: ${buttonBorder};`;
    } else if (frameStyle === 'circle' || frameStyle === 'oval') {
      buttonStyle = `background-color: ${buttonBg}; color: ${buttonText}; border-color: ${buttonBorder};`;
    }
    
    overlayButtonHTML = `<button type="button" class="text-button frame-${frameStyle}"${buttonStyle ? ` style="${buttonStyle}"` : ''}>${escapeHtmlForExport(text)}</button>`;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.data.eventTitle || 'Digital Gift'}</title>
</head>
<body>
  <div id="overlay" class="overlay">
    <h1>{{overlayMainText}}</h1>
    <p>{{overlaySubText}}</p>
    ${overlayButtonHTML}
  </div>

  <div id="navigation" class="navigation hidden">
    <button class="nav-button" type="button">Previous</button>
    <button class="nav-button" type="button">Next</button>
  </div>

  ${screensHTML}
</body>
</html>
  `.trim();
}

function applyThemeStyles(styles: string, project: Project): string {
  const theme = project.data.customTemplate?.theme;
  let themeVars = '';

  if (theme) {
    themeVars = `
    :root {
      ${theme.colors?.text ? `--theme-text: ${theme.colors.text};` : ''}
      ${theme.colors?.textSecondary ? `--theme-text-secondary: ${theme.colors.textSecondary};` : ''}
      ${theme.colors?.background ? `--theme-background: ${theme.colors.background};` : ''}
      ${theme.colors?.backgroundSecondary ? `--theme-background-secondary: ${theme.colors.backgroundSecondary};` : ''}
      ${theme.colors?.accent ? `--theme-accent: ${theme.colors.accent};` : ''}
      ${theme.colors?.border ? `--theme-border: ${theme.colors.border};` : ''}
      ${theme.colors?.button ? `--theme-button: ${theme.colors.button};` : ''}
      ${theme.colors?.buttonText ? `--theme-button-text: ${theme.colors.buttonText};` : ''}
      ${theme.fonts?.heading ? `--theme-font-heading: ${theme.fonts.heading};` : ''}
      ${theme.fonts?.body ? `--theme-font-body: ${theme.fonts.body};` : ''}
    }

    body {
      ${theme.colors?.background ? `background-color: ${theme.colors.background};` : ''}
      ${theme.fonts?.body ? `font-family: ${theme.fonts.body};` : ''}
      ${theme.colors?.text ? `color: ${theme.colors.text};` : ''}
    }

    h1, h2, h3 {
      ${theme.fonts?.heading ? `font-family: ${theme.fonts.heading};` : ''}
      ${theme.colors?.text ? `color: ${theme.colors.text};` : ''}
    }

    .overlay {
      ${theme.colors?.overlay ? `background: ${theme.colors.overlay};` : ''}
    }

    button, .nav-button {
      ${theme.colors?.button ? `background-color: ${theme.colors.button};` : ''}
      ${theme.colors?.buttonText ? `color: ${theme.colors.buttonText};` : ''}
      ${theme.colors?.border ? `border-color: ${theme.colors.border};` : ''}
    }

    .screen {
      ${theme.colors?.background ? `background-color: ${theme.colors.background};` : ''}
      ${theme.colors?.border ? `border-color: ${theme.colors.border};` : ''}
    }
  `;
  }

  // Add custom screen styles
  const customScreenStyles = generateCustomScreenStyles(project);

  return themeVars + '\n' + customScreenStyles + '\n' + styles;
}

function generateCustomScreenStyles(project: Project): string {
  const customStyles: string[] = [];

  // Iterate through all screens and generate custom styles
  Object.entries(project.data.screens).forEach(([screenId, screenData]: [string, any]) => {
    const styles: string[] = [];

    // Background
    if (screenData.customBackground === 'custom') {
      if (screenData.backgroundGradient) {
        styles.push(`background: ${screenData.backgroundGradient};`);
      } else if (screenData.backgroundColor) {
        styles.push(`background-color: ${screenData.backgroundColor};`);
      }
    }

    // Title styling
    if (screenData.titleColor || screenData.titleSize) {
      const titleSelector = `#screen-${screenId} h1, #screen-${screenId} h2`;
      const titleStyles: string[] = [];
      if (screenData.titleColor) titleStyles.push(`color: ${screenData.titleColor};`);
      if (screenData.titleSize) {
        const sizeMap: { [key: string]: string } = {
          'text-xl': '1.25rem',
          'text-2xl': '1.5rem',
          'text-3xl': '1.875rem',
          'text-4xl': '2.25rem',
          'text-5xl': '3rem'
        };
        titleStyles.push(`font-size: ${sizeMap[screenData.titleSize] || '1.875rem'};`);
      }
      if (titleStyles.length > 0) {
        customStyles.push(`${titleSelector} { ${titleStyles.join(' ')} }`);
      }
    }

    // Text styling
    if (screenData.textColor) {
      const textSelector = `#screen-${screenId} p`;
      customStyles.push(`${textSelector} { color: ${screenData.textColor}; }`);
    }

    // Apply background to screen container
    if (styles.length > 0) {
      const screenSelector = `#screen-${screenId}`;
      customStyles.push(`${screenSelector} { ${styles.join(' ')} }`);
    }
  });

  return customStyles.length > 0 ? `/* Custom Screen Styles */\n${customStyles.join('\n')}` : '';
}

function replacePlaceholders(html: string, project: Project, templateMeta: TemplateMeta): string {
  const data = project.data;

  // Replace global placeholders
  html = html.replace(/\{\{recipientName\}\}/g, data.recipientName || '');
  html = html.replace(/\{\{senderName\}\}/g, data.senderName || '');
  html = html.replace(/\{\{eventTitle\}\}/g, data.eventTitle || '');
  html = html.replace(/\{\{mainGreeting\}\}/g, data.mainGreeting || '');

  // Replace screen-specific placeholders
  for (const screen of templateMeta.screens) {
    const screenData = data.screens[screen.screenId] || {};
    
    // Replace title and text
    html = html.replace(new RegExp(`\\{\\{${screen.screenId}_title\\}\\}`, 'g'), screenData.title || '');
    html = html.replace(new RegExp(`\\{\\{${screen.screenId}_text\\}\\}`, 'g'), screenData.text || '');

    // Replace image carousel placeholder if images are assigned to this screen
    if (screenData.images && screenData.images.length > 0) {
      const imageMap = new Map<string, ImageData>();
      for (const img of project.data.images) {
        imageMap.set(img.id, img);
      }

      const screenImages = screenData.images
        .map((imageId: string) => imageMap.get(imageId))
        .filter((img): img is ImageData => img !== undefined);

      if (screenImages.length > 0) {
        // Check galleryLayout, default to 'carousel' if not set or unknown
        const galleryLayout = screenData.galleryLayout || 'carousel';
        
        let galleryHTML: string;
        switch (galleryLayout) {
          case 'gridWithZoom':
            galleryHTML = generateGridWithZoomHTML(screen.screenId, screenImages);
            break;
          case 'fullscreenSlideshow':
            galleryHTML = generateFullscreenSlideshowHTML(screen.screenId, screenImages);
            break;
          case 'heroWithThumbnails':
            galleryHTML = generateHeroWithThumbnailsHTML(screen.screenId, screenImages);
            break;
          case 'timeline':
            galleryHTML = generateTimelineHTML(screen.screenId, screenImages);
            break;
          case 'carousel':
          default:
            galleryHTML = generateImageCarouselHTML(screen.screenId, screenImages);
            break;
        }
        
        // Replace image carousel placeholder if it exists
        const carouselPlaceholder = `{{${screen.screenId}_images}}`;
        if (html.includes(carouselPlaceholder)) {
          html = html.replace(carouselPlaceholder, galleryHTML);
        } else {
          // If placeholder doesn't exist, inject after the text placeholder
          // Try to find the screen div and inject after the text
          const screenTextPlaceholder = `{{${screen.screenId}_text}}`;
          if (html.includes(screenTextPlaceholder)) {
            // Inject after the closing </p> tag that follows the text
            html = html.replace(
              new RegExp(`(\\{\\{${screen.screenId}_text\\}\\}[^<]*</p>)`, 'g'),
              `$1${galleryHTML}`
            );
          } else {
            // If no text placeholder, inject after title
            const screenTitlePlaceholder = `{{${screen.screenId}_title}}`;
            if (html.includes(screenTitlePlaceholder)) {
              html = html.replace(
                new RegExp(`(\\{\\{${screen.screenId}_title\\}\\}[^<]*</h2>)`, 'g'),
                `$1${galleryHTML}`
              );
            }
          }
        }

        // Also replace old-style image placeholders for backward compatibility
        screenImages.forEach((image, index: number) => {
          const placeholder = `{{${screen.screenId}_image${index + 1}}}`;
          html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), image.data);
        });
      } else {
        // If no images, replace placeholder with empty string
        const carouselPlaceholder = `{{${screen.screenId}_images}}`;
        html = html.replace(new RegExp(carouselPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    // Replace audio placeholder
    if (screen.supportsMusic && screenData.audioId) {
      const audio = data.audio.screens[screen.screenId];
      if (audio) {
        html = html.replace(new RegExp(`\\{\\{music_${screen.screenId}\\}\\}`, 'g'), audio.data);
      }
    }
  }

  // Replace overlay placeholders
  html = html.replace(/\{\{overlayMainText\}\}/g, data.overlay.mainText || '');
  html = html.replace(/\{\{overlaySubText\}\}/g, data.overlay.subText || '');
  // Allow empty button text - if empty, button will show with just animation
  html = html.replace(/\{\{overlayButtonText\}\}/g, data.overlay.buttonText || '');

  // Replace design variables if present
  if (templateMeta.designVariables) {
    for (const variable of templateMeta.designVariables) {
      const placeholder = `{{theme_${variable.key}}}`;
      html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), variable.defaultValue);
    }
  }

  // Inject global audio if present (will be set after AudioManager loads)
  // We'll inject it in the navigation scripts function

  return html;
}

function generateImageCarouselHTML(screenId: string, images: ImageData[]): string {
  const carouselId = `carousel-${screenId}`;
  // No onclick attributes - event listeners will be attached by GiftApp
  const carouselHTML = `
    <div class="image-carousel-container" id="${carouselId}">
      <div class="image-carousel-main">
        <img 
          src="${images[0].data}" 
          alt="${escapeHtmlForExport(images[0].filename)}" 
          class="carousel-main-image"
        />
        ${images.length > 1 ? `
        <button class="carousel-nav-btn carousel-nav-prev" type="button">‹</button>
        <button class="carousel-nav-btn carousel-nav-next" type="button">›</button>
        <div class="carousel-counter">1 / ${images.length}</div>
        ` : ''}
      </div>
      ${images.length > 1 ? `
      <div class="carousel-thumbnails">
        ${images.map((img, index) => `
          <img 
            src="${img.data}" 
            alt="${escapeHtmlForExport(img.filename)}" 
            class="carousel-thumbnail ${index === 0 ? 'active' : ''}"
          />
        `).join('')}
      </div>
      ` : ''}
    </div>
    <script>
      // Initialize carousel data (will be migrated to GiftApp on init)
      // Store in temporary location, will be migrated to GiftApp internal carouselData
      (function() {
        window._tempCarouselData = window._tempCarouselData || {};
        window._tempCarouselData['${carouselId}'] = {
          images: ${JSON.stringify(images.map(img => img.data))},
          currentIndex: 0
        };
      })();
    </script>
  `;
  return carouselHTML;
}

function generateGridWithZoomHTML(screenId: string, images: ImageData[]): string {
  const galleryId = `gallery-grid-${screenId}`;
  const gridHTML = `
    <div class="gallery-grid-container" id="${galleryId}">
      <div class="gallery-grid">
        ${images.map((img) => `
          <div class="gallery-grid-item">
            <img 
              src="${img.data}" 
              alt="${escapeHtmlForExport(img.filename)}" 
              class="gallery-grid-image"
            />
          </div>
        `).join('')}
      </div>
    </div>
    <script>
      // Initialize grid gallery data
      (function() {
        window._tempGalleryData = window._tempGalleryData || {};
        window._tempGalleryData['${galleryId}'] = {
          images: ${JSON.stringify(images.map(img => img.data))},
          type: 'gridWithZoom'
        };
      })();
    </script>
  `;
  return gridHTML;
}

function generateFullscreenSlideshowHTML(screenId: string, images: ImageData[]): string {
  const slideshowId = `slideshow-${screenId}`;
  const slideshowHTML = `
    <div class="fullscreen-slideshow-container" id="${slideshowId}">
      <div class="slideshow-wrapper">
        ${images.map((img, index) => `
          <div class="slideshow-slide ${index === 0 ? 'active' : ''}">
            <img 
              src="${img.data}" 
              alt="${escapeHtmlForExport(img.filename)}" 
              class="slideshow-image"
            />
          </div>
        `).join('')}
      </div>
      ${images.length > 1 ? `
      <button class="slideshow-nav slideshow-prev" type="button">‹</button>
      <button class="slideshow-nav slideshow-next" type="button">›</button>
      <div class="slideshow-indicator">
        <span class="slideshow-current">1</span> / <span class="slideshow-total">${images.length}</span>
      </div>
      ` : ''}
    </div>
    <script>
      // Initialize slideshow data
      (function() {
        window._tempSlideshowData = window._tempSlideshowData || {};
        window._tempSlideshowData['${slideshowId}'] = {
          images: ${JSON.stringify(images.map(img => img.data))},
          currentIndex: 0,
          autoplayInterval: 4000,
          type: 'fullscreenSlideshow'
        };
      })();
    </script>
  `;
  return slideshowHTML;
}

function generateHeroWithThumbnailsHTML(screenId: string, images: ImageData[]): string {
  const heroId = `hero-gallery-${screenId}`;
  const heroHTML = `
    <div class="hero-gallery-container" id="${heroId}">
      <div class="hero-main-image">
        <img 
          src="${images[0].data}" 
          alt="${escapeHtmlForExport(images[0].filename)}" 
          class="hero-image"
        />
      </div>
      ${images.length > 1 ? `
      <div class="hero-thumbnails">
        ${images.map((img, index) => `
          <img 
            src="${img.data}" 
            alt="${escapeHtmlForExport(img.filename)}" 
            class="hero-thumbnail ${index === 0 ? 'active' : ''}"
          />
        `).join('')}
      </div>
      ` : ''}
    </div>
    <script>
      // Initialize hero gallery data
      (function() {
        window._tempHeroData = window._tempHeroData || {};
        window._tempHeroData['${heroId}'] = {
          images: ${JSON.stringify(images.map(img => img.data))},
          currentIndex: 0,
          type: 'heroWithThumbnails'
        };
      })();
    </script>
  `;
  return heroHTML;
}

function generateTimelineHTML(screenId: string, images: ImageData[]): string {
  const timelineId = `timeline-${screenId}`;
  const timelineHTML = `
    <div class="timeline-container" id="${timelineId}">
      ${images.map((img, index) => `
        <div class="timeline-card">
          <div class="timeline-image-wrapper">
            <img 
              src="${img.data}" 
              alt="${escapeHtmlForExport(img.filename)}" 
              class="timeline-image"
            />
          </div>
          <div class="timeline-content">
            <div class="timeline-index">${index + 1}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <script>
      // Initialize timeline data
      (function() {
        window._tempTimelineData = window._tempTimelineData || {};
        window._tempTimelineData['${timelineId}'] = {
          images: ${JSON.stringify(images.map(img => img.data))},
          type: 'timeline'
        };
      })();
    </script>
  `;
  return timelineHTML;
}

function injectRepeatingStructures(html: string, project: Project, templateMeta: TemplateMeta): string {
  const data = project.data;

  for (const screen of templateMeta.screens) {
    // Handle gallery screens - only if images are NOT assigned to this screen (use carousel instead)
    if (screen.type === 'gallery' && screen.galleryImageCount) {
      const screenData = data.screens[screen.screenId];
      // Only show gallery if no images are assigned (images use carousel instead)
      if (screenData?.images && screenData.images.length === 0) {
        // Remove gallery placeholder if images are assigned elsewhere
        const galleryPlaceholder = `{{${screen.screenId}_gallery}}`;
        html = html.replace(new RegExp(galleryPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      } else if (!screenData?.images || screenData.images.length === 0) {
        // Only show gallery if no images assigned at all
        const imageMap = new Map<string, ImageData>();
        for (const img of project.data.images) {
          imageMap.set(img.id, img);
        }

        // Find gallery container placeholder (e.g., {{screen1_gallery}})
        const galleryPlaceholder = `{{${screen.screenId}_gallery}}`;
        if (html.includes(galleryPlaceholder)) {
          // If there are images assigned, remove gallery placeholder (carousel will show instead)
          html = html.replace(new RegExp(galleryPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        }
      } else {
        // Images are assigned, remove gallery placeholder
        const galleryPlaceholder = `{{${screen.screenId}_gallery}}`;
        html = html.replace(new RegExp(galleryPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
      }
    }

    // Handle blessing screens
    if (screen.type === 'blessings' && data.blessings) {
      const blessingsPlaceholder = `{{${screen.screenId}_blessings}}`;
      if (html.includes(blessingsPlaceholder)) {
        const blessingsHTML = data.blessings
          .map((blessing) => `
            <div class="blessing-card">
              <div class="blessing-sender">${escapeHtmlForExport(blessing.sender)}</div>
              <div class="blessing-text">${escapeHtmlForExport(blessing.text)}</div>
            </div>
          `)
          .join('\n');
        
        html = html.replace(blessingsPlaceholder, blessingsHTML);
      }
    }
  }

  return html;
}

async function injectVideos(html: string, project: Project, templateMeta: TemplateMeta): Promise<string> {
  const totalBudgetBytes = MediaConfig.VIDEO_MAX_TOTAL_MB * 1024 * 1024;
  let accumulatedBytes = 0;
  const fallbackBlocks: string[] = [];

  for (const screen of templateMeta.screens) {
    const screenData = project.data.screens[screen.screenId] || {};
    if (screenData.mediaMode !== 'video' || !screenData.videoId) continue;

    const videoMeta = project.data.videos.find((v) => v.id === screenData.videoId);
    if (!videoMeta) {
      throw new Error(`Video metadata missing for screen "${screen.screenId}".`);
    }

    const blob = await getVideoBlob(project.id, videoMeta.id);
    if (!blob) {
      throw new Error(`Video blob is missing for "${videoMeta.filename}". Please re-upload.`);
    }

    if (blob.size > MediaConfig.VIDEO_MAX_SIZE_MB * 1024 * 1024) {
      throw new Error(
        `Video "${videoMeta.filename}" exceeds max size of ${MediaConfig.VIDEO_MAX_SIZE_MB}MB (actual ${(blob.size / (1024 * 1024)).toFixed(1)}MB).`
      );
    }

    accumulatedBytes += blob.size;
    if (accumulatedBytes > totalBudgetBytes) {
      throw new Error(
        `Total video size exceeds budget (${(accumulatedBytes / (1024 * 1024)).toFixed(1)}MB > ${MediaConfig.VIDEO_MAX_TOTAL_MB}MB).`
      );
    }

    const dataUrl = await blobToDataUrl(blob);
    const poster = videoMeta.posterDataUrl || '';

    const videoHtml = `
      <div class="video-block" id="video-${screen.screenId}">
        <video controls playsinline preload="metadata" poster="${poster}">
          <source src="${dataUrl}" type="${videoMeta.mime || 'video/mp4'}" />
        </video>
      </div>
    `;

    const placeholder = `{{${screen.screenId}_video}}`;
    if (html.includes(placeholder)) {
      html = html.replace(placeholder, videoHtml);
    } else {
      fallbackBlocks.push(videoHtml);
    }
  }

  if (fallbackBlocks.length > 0) {
    const container = `<div id="video-fallback-container">\n${fallbackBlocks.join('\n')}\n</div>`;
    if (html.includes('</main>')) {
      html = html.replace('</main>', `${container}\n</main>`);
    } else if (html.includes('</body>')) {
      html = html.replace('</body>', `${container}\n</body>`);
    } else {
      html = `${html}\n${container}`;
    }
  }

  return html;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read video blob for export'));
    reader.readAsDataURL(blob);
  });
}

// Helper for escaping HTML (works in browser context)
function escapeHtmlForExport(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/**
 * Transform existing template screens to preview-matching structure
 */
function transformTemplateScreensToPreviewStructure(html: string, project: Project, templateMeta: TemplateMeta): string {
  const screens = templateMeta.screens.sort((a, b) => a.order - b.order);
  
  for (const screen of screens) {
    const screenData = project.data.screens[screen.screenId] || {};
    const screenId = screen.screenId;
    
    // Find the existing screen div - try multiple patterns
    // Pattern 1: id="${screenId}" (standard format)
    let screenRegex = new RegExp(
      `<div[^>]*\\s+id=["']${screenId}["'][^>]*>([\\s\\S]*?)<\\/div>`,
      'i'
    );
    
    let match = html.match(screenRegex);
    
    // Pattern 2: id="screen-${screenId}" (if already transformed)
    if (!match) {
      screenRegex = new RegExp(
        `<div[^>]*\\s+id=["']screen-${screenId}["'][^>]*>([\\s\\S]*?)<\\/div>`,
        'i'
      );
      match = html.match(screenRegex);
    }
    
    if (match) {
      // Generate new preview-matching structure
      const newScreenHTML = generatePreviewMatchingScreenHTML(screen, screenData, project, templateMeta);
      // Replace the old screen with new structure
      html = html.replace(screenRegex, newScreenHTML.trim());
    }
  }
  
  return html;
}

function updateTemplateOnclickHandlers(html: string): string {
  // FALLBACK: Update onclick handlers in templates to use GiftApp namespace
  // NOTE: This is a backward compatibility fallback. Primary event binding is now done via
  // event listeners in GiftApp initialization (attachEventListeners function).
  // This regex replacement is only needed for templates that may have inline onclick handlers
  // that we don't control or generate ourselves.
  html = html.replace(/onclick="startExperience\(\)"/g, 'onclick="GiftApp.startExperience()"');
  html = html.replace(/onclick="nextScreen\(\)"/g, 'onclick="GiftApp.nextScreen()"');
  html = html.replace(/onclick="previousScreen\(\)"/g, 'onclick="GiftApp.previousScreen()"');
  html = html.replace(/onclick="carouselPrev\(/g, 'onclick="GiftApp.carouselPrev(');
  html = html.replace(/onclick="carouselNext\(/g, 'onclick="GiftApp.carouselNext(');
  html = html.replace(/onclick="carouselGoTo\(/g, 'onclick="GiftApp.carouselGoTo(');
  html = html.replace(/onclick="zoomImage\(/g, 'onclick="GiftApp.zoomImage(');
  return html;
}

function buildOrganizedHTML(html: string, project: Project, templateMeta: TemplateMeta): string {
  // Extract existing <style> tags from head to consolidate in styles section
  let existingStyles = '';
  const styleMatches = html.matchAll(/<style>([\s\S]*?)<\/style>/gi);
  for (const match of styleMatches) {
    existingStyles += match[1] + '\n';
  }
  
  // Remove existing inline scripts that define functions (will be replaced by GiftApp)
  html = html.replace(/<script>[\s\S]*?var currentScreenIndex[\s\S]*?<\/script>/gi, '');
  
  // Remove existing <style> tags (will be re-added in organized section)
  html = html.replace(/<style>[\s\S]*?<\/style>/gi, '');
  
  // Build styles section with theme support
  // Add pulse animation for overlay buttons (hint for press when text is empty)
  const pulseAnimationStyles = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
    .overlay button {
      animation: pulse 2s infinite;
    }
  `;
  const allStyles = `${existingStyles.trim()}\n${getPreviewLayoutStyles()}\n${getGalleryStyles()}\n${pulseAnimationStyles}\n${getOverlayButtonStyles()}\n${generateColorStyles(project)}\n${generateButtonStyles(project)}\n${generateAnimationStyles(project)}`;
  const themedStyles = applyThemeStyles(allStyles, project);
  const stylesSection = `<!-- ========== STYLES SECTION (embedded CSS) ========== -->\n<style>\n${themedStyles}\n</style>`;
  
  // Build runtime logic section (GiftApp with integrated AudioManager + animations)
  const scriptsSection = `<!-- ========== RUNTIME LOGIC SECTION (GiftApp engine) ========== -->\n${buildGiftAppNamespace(project, templateMeta)}\n${generateAnimationScript(project)}`;
  
  // Inject styles before </head> or before <body> if no </head>
  if (html.includes('</head>')) {
    html = html.replace('</head>', `${stylesSection}\n</head>`);
  } else if (html.includes('<body>')) {
    html = html.replace('<body>', `${stylesSection}\n<body>`);
  } else {
    html = stylesSection + '\n' + html;
  }
  
  // Mark templates/content section (only if <body> exists and not already marked)
  if (html.includes('<body>') && !html.includes('TEMPLATES & CONTENT SECTION')) {
    html = html.replace('<body>', '<!-- ========== TEMPLATES & CONTENT SECTION (screens layout) ========== -->\n<body>');
  }
  
  // Inject scripts before </body>
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${scriptsSection}\n</body>`);
  } else {
    html = html + '\n' + scriptsSection;
  }
  
  return html;
}

function getOverlayButtonStyles(): string {
  return `
  /* ========== Overlay Button Styles ========== */
  .overlay button.emoji-button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 48px;
    transition: transform 0.3s ease;
  }

  .overlay button.emoji-pulse {
    animation: emoji-pulse 2s infinite;
  }

  .overlay button.emoji-bounce {
    animation: emoji-bounce 1s infinite;
  }

  .overlay button.emoji-rotate {
    animation: emoji-rotate 2s infinite linear;
  }

  .overlay button.emoji-scale {
    animation: emoji-scale 1.5s infinite;
  }

  @keyframes emoji-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }

  @keyframes emoji-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes emoji-rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes emoji-scale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }

  .overlay button.text-button {
    padding: 12px 24px;
    border: 2px solid;
    background: white;
    color: #333;
    cursor: pointer;
    font-weight: bold;
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
  }

  .overlay button.text-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  /* Frame styles */
  .overlay button.frame-solid {
    border-style: solid;
    border-color: #333;
  }

  .overlay button.frame-dashed {
    border-style: dashed;
    border-color: #666;
  }

  .overlay button.frame-double {
    border-style: double;
    border-width: 4px;
    border-color: #333;
  }

  .overlay button.frame-shadow {
    border: 1px solid #ccc;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
  }

  .overlay button.frame-gradient {
    border: none;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    color: white;
  }

  .overlay button.frame-heart {
    border: none;
    background: #ff6b6b;
    color: white;
    clip-path: polygon(50% 0%, 61% 0%, 68% 11%, 79% 11%, 86% 0%, 100% 0%, 100% 50%, 50% 100%, 0% 50%, 0% 0%, 14% 0%, 21% 11%, 32% 11%);
    width: 120px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .overlay button.frame-star {
    border: none;
    background: #ffd93d;
    color: #333;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .overlay button.frame-circle {
    border-radius: 50%;
    border: 3px solid #333;
    width: 120px;
    height: 120px;
  }

  .overlay button.frame-oval {
    border-radius: 50%;
    border: 3px solid #333;
    width: 160px;
    height: 100px;
  }

  .overlay button.frame-rectangle {
    border-radius: 4px;
    border: 3px solid #333;
  }

  .overlay button.frame-square {
    border-radius: 4px;
    border: 3px solid #333;
    width: 120px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  `;
}

// Generate CSS for global and screen-specific color styles
function generateColorStyles(project: Project): string {
  const globalStyle = project.data.globalStyle;
  if (!globalStyle?.colors) return '';

  let css = `
  /* ========== Global Color Styles ========== */
  :root {
    ${globalStyle.colors.background ? `--global-bg-color: ${globalStyle.colors.background};` : ''}
    ${globalStyle.colors.text ? `--global-text-color: ${globalStyle.colors.text};` : ''}
    ${globalStyle.colors.title ? `--global-title-color: ${globalStyle.colors.title};` : ''}
  }
  `;

  // Apply global colors to screens
  if (globalStyle.colors.background) {
    css += `.screen { background-color: ${globalStyle.colors.background}; }\n`;
  }
  if (globalStyle.colors.text) {
    css += `.screen-text { color: ${globalStyle.colors.text}; }\n`;
  }
  if (globalStyle.colors.title) {
    css += `.screen-title { color: ${globalStyle.colors.title}; }\n`;
  }

  // Screen-specific overrides
  Object.entries(project.data.screens).forEach(([screenId, screenData]) => {
    if (screenData.style?.colors) {
      const screenStyle = screenData.style.colors;
      if (screenStyle.background) {
        css += `#screen-${screenId} { background-color: ${screenStyle.background} !important; }\n`;
      }
      if (screenStyle.text) {
        css += `#screen-${screenId} .screen-text { color: ${screenStyle.text} !important; }\n`;
      }
      if (screenStyle.title) {
        css += `#screen-${screenId} .screen-title { color: ${screenStyle.title} !important; }\n`;
      }
    }
  });

  return css;
}

// Generate CSS for navigation button styles
function generateButtonStyles(project: Project): string {
  const globalStyle = project.data.globalStyle;
  if (!globalStyle?.colors?.navigation) return '';

  let css = `
  /* ========== Navigation Button Styles ========== */
  `;

  ['next', 'prev', 'menu'].forEach((buttonType) => {
    const buttonStyle = globalStyle.colors?.navigation?.[buttonType as 'next' | 'prev' | 'menu'];
    if (!buttonStyle) return;

    const selector = buttonType === 'next' ? '.screen-next-btn' : buttonType === 'prev' ? '.screen-prev-btn' : '.screen-menu-btn';
    const borderRadius = buttonStyle.shape === 'pill' ? '9999px' : buttonStyle.shape === 'circle' ? '50%' : `${buttonStyle.borderRadius || 8}px`;

    css += `
    ${selector} {
      ${buttonStyle.backgroundColor ? `background-color: ${buttonStyle.backgroundColor};` : ''}
      ${buttonStyle.textColor ? `color: ${buttonStyle.textColor};` : ''}
      ${buttonStyle.borderColor ? `border-color: ${buttonStyle.borderColor};` : ''}
      ${buttonStyle.borderWidth !== undefined ? `border-width: ${buttonStyle.borderWidth}px;` : ''}
      ${buttonStyle.borderStyle ? `border-style: ${buttonStyle.borderStyle};` : ''}
      ${buttonStyle.borderRadius !== undefined ? `border-radius: ${borderRadius};` : ''}
      ${buttonStyle.fontSize ? `font-size: ${buttonStyle.fontSize}px;` : ''}
      ${buttonStyle.fontWeight ? `font-weight: ${buttonStyle.fontWeight};` : ''}
      ${buttonStyle.padding ? `padding: ${buttonStyle.padding.top || 0}px ${buttonStyle.padding.right || 0}px ${buttonStyle.padding.bottom || 0}px ${buttonStyle.padding.left || 0}px;` : ''}
      ${buttonStyle.effects?.shadow ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);' : ''}
    }
    `;

    if (buttonStyle.effects?.hover) {
      css += `
      ${selector}:hover:not(:disabled) {
        ${buttonStyle.effects.hover.backgroundColor ? `background-color: ${buttonStyle.effects.hover.backgroundColor};` : ''}
        ${buttonStyle.effects.hover.textColor ? `color: ${buttonStyle.effects.hover.textColor};` : ''}
      }
      `;
    }
  });

  return css;
}

// Generate CSS for background animations
function generateAnimationStyles(_project: Project): string {
  let css = `
  /* ========== Background Animation Styles ========== */
  @keyframes floatUp {
    0% {
      transform: translateY(0) translateX(0) scale(1);
      opacity: 0.7;
    }
    50% {
      transform: translateY(-50vh) translateX(10px) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) translateX(-10px) scale(0.8);
      opacity: 0;
    }
  }

  @keyframes sparkle {
    0%, 100% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1) rotate(180deg);
    }
  }

  @keyframes bubbleUp {
    0% {
      transform: translateY(0) translateX(0) scale(0.5);
      opacity: 0.5;
    }
    50% {
      transform: translateY(-50vh) translateX(15px) scale(1);
      opacity: 0.8;
    }
    100% {
      transform: translateY(-100vh) translateX(-15px) scale(1.2);
      opacity: 0;
    }
  }

  @keyframes twinkle {
    0%, 100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.2);
    }
  }
  `;

  return css;
}

// Generate JavaScript for background animations
function generateAnimationScript(project: Project): string {
  const globalStyle = project.data.globalStyle;
  const screens = project.data.dynamicScreens || [];
  const globalAnimation = globalStyle?.backgroundAnimation;

  let script = `
  // Background Animation System
  (function() {
    function getParticleCount(intensity) {
      switch(intensity) {
        case 'low': return 10;
        case 'medium': return 25;
        case 'high': return 50;
        default: return 25;
      }
    }

    function getAnimationDuration(speed) {
      switch(speed) {
        case 'slow': return 8000;
        case 'normal': return 5000;
        case 'fast': return 3000;
        default: return 5000;
      }
    }

    function initHeartsAnimation(container, config) {
      const count = getParticleCount(config.intensity);
      const duration = getAnimationDuration(config.speed);
      const color = config.color || '#ff6b9d';
      
      for (let i = 0; i < count; i++) {
        const heart = document.createElement('div');
        heart.textContent = '❤️';
        heart.style.position = 'absolute';
        heart.style.bottom = '0';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.fontSize = (15 + Math.random() * 20) + 'px';
        heart.style.color = color;
        heart.style.opacity = (0.7 + Math.random() * 0.3);
        heart.style.animation = 'floatUp ' + (duration / 1000) + 's linear infinite';
        heart.style.animationDelay = ((i / count) * duration / 1000) + 's';
        heart.style.pointerEvents = 'none';
        container.appendChild(heart);
      }
    }

    function initSparklesAnimation(container, config) {
      const count = getParticleCount(config.intensity);
      const duration = getAnimationDuration(config.speed);
      const color = config.color || '#ffd700';
      
      for (let i = 0; i < count; i++) {
        const sparkle = document.createElement('div');
        sparkle.textContent = '✨';
        sparkle.style.position = 'absolute';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.fontSize = (8 + Math.random() * 12) + 'px';
        sparkle.style.color = color;
        sparkle.style.animation = 'sparkle ' + (duration / 1000) + 's ease-in-out infinite';
        sparkle.style.animationDelay = (Math.random() * duration / 1000) + 's';
        sparkle.style.pointerEvents = 'none';
        container.appendChild(sparkle);
      }
    }

    function initBubblesAnimation(container, config) {
      const count = getParticleCount(config.intensity);
      const duration = getAnimationDuration(config.speed);
      const color = config.color || '#87ceeb';
      
      for (let i = 0; i < count; i++) {
        const bubble = document.createElement('div');
        const size = 20 + Math.random() * 40;
        bubble.style.position = 'absolute';
        bubble.style.bottom = '0';
        bubble.style.left = Math.random() * 100 + '%';
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        bubble.style.borderRadius = '50%';
        bubble.style.border = '2px solid ' + color;
        bubble.style.backgroundColor = 'rgba(135, 206, 235, 0.2)';
        bubble.style.animation = 'bubbleUp ' + (3 + Math.random() * 4) + 's linear infinite';
        bubble.style.animationDelay = ((i / count) * duration / 1000) + 's';
        bubble.style.pointerEvents = 'none';
        container.appendChild(bubble);
      }
    }

    function initConfettiAnimation(container, config) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1';
      container.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      
      const count = getParticleCount(config.intensity);
      const speed = config.speed || 'normal';
      const speedMultiplier = speed === 'slow' ? 0.5 : speed === 'fast' ? 2 : 1;
      const color = config.color || '#ff6b9d';
      const colors = [color, '#4ecdc4', '#ffe66d', '#ff6b9d', '#95e1d3', '#f38181'];
      
      const particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10,
          vx: (Math.random() - 0.5) * 2 * speedMultiplier,
          vy: (Math.random() * 3 + 2) * speedMultiplier,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 5 + Math.random() * 5,
        });
      }
      
      function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(function(particle) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.1 * speedMultiplier;
          if (particle.y > canvas.height) {
            particle.y = -10;
            particle.x = Math.random() * canvas.width;
          }
          ctx.fillStyle = particle.color;
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        requestAnimationFrame(animate);
      }
      animate();
    }

    function initFireworksAnimation(container, config) {
      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1';
      container.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      
      const speed = config.speed || 'normal';
      const speedMultiplier = speed === 'slow' ? 0.5 : speed === 'fast' ? 2 : 1;
      const color = config.color || '#ff6b9d';
      const colors = [color, '#4ecdc4', '#ffe66d', '#ff6b9d', '#95e1d3', '#f38181'];
      const fireworks = [];
      
      function createFirework(x, y) {
        const particles = [];
        for (let i = 0; i < 30; i++) {
          const angle = (Math.PI * 2 * i) / 30;
          const velocity = 2 + Math.random() * 2;
          particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * velocity * speedMultiplier,
            vy: Math.sin(angle) * velocity * speedMultiplier,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
          });
        }
        fireworks.push({ x: x, y: y, particles: particles });
      }
      
      function animate() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (Math.random() < 0.02) {
          createFirework(
            Math.random() * canvas.width,
            Math.random() * (canvas.height * 0.5) + canvas.height * 0.2
          );
        }
        
        fireworks.forEach(function(firework, fIdx) {
          firework.particles = firework.particles.filter(function(particle) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1 * speedMultiplier;
            particle.life -= 0.02;
            
            if (particle.life > 0) {
              ctx.globalAlpha = particle.life;
              ctx.fillStyle = particle.color;
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
              ctx.fill();
              return true;
            }
            return false;
          });
          
          if (firework.particles.length === 0) {
            fireworks.splice(fIdx, 1);
          }
        });
        
        ctx.globalAlpha = 1;
        requestAnimationFrame(animate);
      }
      animate();
    }

    function initStarsAnimation(container, config) {
      const count = getParticleCount(config.intensity);
      const duration = getAnimationDuration(config.speed);
      const color = config.color || '#ffd700';
      
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.textContent = '⭐';
        star.style.position = 'absolute';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.fontSize = (4 + Math.random() * 8) + 'px';
        star.style.color = color;
        star.style.animation = 'twinkle ' + (duration / 1000) + 's ease-in-out infinite';
        star.style.animationDelay = (Math.random() * duration / 1000) + 's';
        star.style.pointerEvents = 'none';
        container.appendChild(star);
      }
    }

    function initScreenAnimations() {
      const globalAnimation = ${globalAnimation ? JSON.stringify(globalAnimation) : 'null'};
      
      ${screens.map((screen) => {
        const screenData = project.data.screens[screen.screenId] || {};
        const screenAnimation = screenData.style?.backgroundAnimation;
        const animation = (screenAnimation && screenAnimation.type !== 'none') ? screenAnimation : globalAnimation;
        
        if (!animation || animation.type === 'none') return '';
        
        const animationType = animation.type as 'hearts' | 'sparkles' | 'bubbles' | 'confetti' | 'fireworks' | 'stars';
        const initFunctionMap: Record<'hearts' | 'sparkles' | 'bubbles' | 'confetti' | 'fireworks' | 'stars', string> = {
          hearts: 'initHeartsAnimation',
          sparkles: 'initSparklesAnimation',
          bubbles: 'initBubblesAnimation',
          confetti: 'initConfettiAnimation',
          fireworks: 'initFireworksAnimation',
          stars: 'initStarsAnimation',
        };
        const initFunction = initFunctionMap[animationType];
        
        if (!initFunction) return '';
        
        return `
        (function() {
          const screen = document.getElementById('screen-${screen.screenId}');
          if (screen) {
            const animContainer = document.createElement('div');
            animContainer.style.position = 'absolute';
            animContainer.style.inset = '0';
            animContainer.style.zIndex = '0';
            animContainer.style.pointerEvents = 'none';
            screen.appendChild(animContainer);
            ${initFunction}(animContainer, ${JSON.stringify(animation)});
          }
        })();
        `;
      }).join('\n')}
    }

    // Initialize animations when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initScreenAnimations);
    } else {
      initScreenAnimations();
    }
  })();
  `;

  return script;
}

function getPreviewLayoutStyles(): string {
  return `
  /* ========== Preview-Matching Screen Layout ========== */
  .screen {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    overflow: hidden;
  }

  /* Fixed Top Bar */
  .screen-top-bar {
    flex: none;
    height: 48px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e5e7eb;
    background-color: rgba(255, 255, 255, 0.9);
  }

  @media (min-width: 768px) {
    .screen-top-bar {
      height: 48px;
      padding: 0 20px;
    }
  }

  .screen-menu-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    cursor: pointer;
    font-size: 18px;
    transition: background-color 0.2s;
  }

  .screen-menu-btn:hover {
    background-color: #f9fafb;
  }

  .screen-top-nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .screen-prev-btn,
  .screen-next-btn {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: white;
    color: #374151;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }

  .screen-prev-btn:hover:not(:disabled),
  .screen-next-btn:hover:not(:disabled) {
    background-color: #f3f4f6;
  }

  .screen-prev-btn:disabled,
  .screen-next-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Optional Title Section */
  .screen-title-section {
    flex: none;
    padding: 12px 16px 8px;
    border-bottom: 1px solid #f3f4f6;
    background-color: rgba(255, 255, 255, 0.9);
  }

  @media (min-width: 768px) {
    .screen-title-section {
      padding: 12px 24px 8px;
    }
  }

  .screen-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.4;
    color: #111827;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (min-width: 768px) {
    .screen-title {
      font-size: 20px;
    }
  }

  /* Content Area */
  .screen-content-area {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Desktop: Split Layout */
  .screen-desktop-layout {
    display: none;
  }

  @media (min-width: 768px) {
    .screen-desktop-layout {
      display: block;
      height: 100%;
      padding: 8px 24px 12px;
    }
  }

  .screen-desktop-layout .screen-text-column {
    display: inline-block;
    width: 41.666667%; /* col-span-5 = 5/12 */
    vertical-align: top;
    padding-right: 16px;
    height: 100%;
    overflow-y: auto;
  }

  .screen-desktop-layout .screen-media-column {
    display: inline-block;
    width: 58.333333%; /* col-span-7 = 7/12 */
    vertical-align: top;
    height: 100%;
    overflow-y: auto;
    padding-left: 16px;
  }

  .screen-text {
    color: #374151;
    line-height: 1.6;
    font-size: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Mobile: Stacked Layout */
  .screen-mobile-layout {
    display: block;
    padding: 12px 16px;
    min-height: 100%;
  }

  @media (min-width: 768px) {
    .screen-mobile-layout {
      display: none;
    }
  }

  .screen-mobile-layout .screen-text {
    -webkit-line-clamp: 4;
    margin-bottom: 12px;
  }

  .screen-media-mobile {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow: hidden;
  }

  .screen-no-media {
    color: #9ca3af;
    font-size: 14px;
    text-align: center;
    padding: 40px 20px;
  }

  /* Fixed Bottom Bar */
  .screen-bottom-bar {
    flex: none;
    height: 56px;
    padding: 0 16px;
    border-top: 1px solid #e5e7eb;
    background-color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .screen-bottom-bar {
      height: 56px;
      padding: 0 24px;
    }
  }

  .screen-next-btn {
    width: 100%;
    max-width: 200px;
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    background: #3b82f6;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  @media (min-width: 640px) {
    .screen-next-btn {
      width: auto;
    }
  }

  .screen-next-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .screen-next-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Hidden class for screen visibility */
  .screen.hidden {
    display: none;
  }
  `;
}

function getGalleryStyles(): string {
  return `
  /* ========== Carousel Layout ========== */
  .image-carousel-container {
    margin: 1rem 0;
    width: 100%;
    max-width: 100%;
  }
  .image-carousel-main {
    position: relative;
    width: 100%;
    margin-bottom: 0.5rem;
    max-height: 50vh;
  }
  .carousel-main-image {
    width: 100%;
    max-height: 50vh;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
    background: #f3f4f6;
    cursor: pointer;
  }
  @media (min-width: 768px) {
    .image-carousel-container {
      margin: 2rem 0;
    }
    .image-carousel-main {
      margin-bottom: 1rem;
      max-height: 60vh;
    }
    .carousel-main-image {
      max-height: 60vh;
      height: 400px;
    }
  }
  .carousel-nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  .carousel-nav-btn:hover {
    background: rgba(0, 0, 0, 0.7);
  }
  .carousel-nav-prev {
    left: 10px;
  }
  .carousel-nav-next {
    right: 10px;
  }
  .carousel-counter {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 14px;
  }
  .carousel-thumbnails {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;
    justify-content: center;
    max-width: 100%;
  }
  .carousel-thumbnail {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.2s;
    flex-shrink: 0;
  }
  @media (min-width: 768px) {
    .carousel-thumbnail {
      width: 80px;
      height: 80px;
    }
  }
  .carousel-thumbnail:hover {
    border-color: #9ca3af;
  }
  .carousel-thumbnail.active {
    border-color: #3b82f6;
  }

  /* ========== Grid with Zoom Layout ========== */
  .gallery-grid-container {
    margin: 1rem 0;
    width: 100%;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 0.5rem 0;
  }
  @media (min-width: 640px) {
    .gallery-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
  }
  @media (min-width: 1024px) {
    .gallery-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
  }
  .gallery-grid-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    background: #f3f4f6;
  }
  .gallery-grid-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .gallery-grid-item:hover .gallery-grid-image {
    transform: scale(1.05);
  }

  /* ========== Fullscreen Slideshow Layout ========== */
  .fullscreen-slideshow-container {
    position: relative;
    width: 100%;
    height: 70vh;
    min-height: 400px;
    margin: 1rem 0;
    overflow: hidden;
    border-radius: 8px;
  }
  .slideshow-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .slideshow-slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.8s ease-in-out;
  }
  .slideshow-slide.active {
    opacity: 1;
    z-index: 1;
  }
  .slideshow-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #f3f4f6;
  }
  .slideshow-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    transition: background 0.2s;
  }
  .slideshow-nav:hover {
    background: rgba(0, 0, 0, 0.8);
  }
  .slideshow-prev {
    left: 20px;
  }
  .slideshow-next {
    right: 20px;
  }
  .slideshow-indicator {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 10;
  }

  /* ========== Hero with Thumbnails Layout ========== */
  .hero-gallery-container {
    margin: 1rem 0;
    width: 100%;
  }
  .hero-main-image {
    width: 100%;
    margin-bottom: 1rem;
    max-height: 60vh;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
  }
  .hero-image {
    width: 100%;
    max-height: 60vh;
    height: auto;
    object-fit: contain;
    display: block;
  }
  .hero-thumbnails {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0.5rem 0;
    justify-content: center;
    flex-wrap: wrap;
  }
  .hero-thumbnail {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    cursor: pointer;
    border: 3px solid transparent;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  @media (min-width: 768px) {
    .hero-thumbnail {
      width: 100px;
      height: 100px;
    }
  }
  .hero-thumbnail:hover {
    border-color: #9ca3af;
    transform: scale(1.05);
  }
  .hero-thumbnail.active {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }

  /* ========== Timeline Layout ========== */
  .timeline-container {
    margin: 2rem 0;
    width: 100%;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  .timeline-card {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    align-items: flex-start;
    position: relative;
  }
  .timeline-card:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 20px;
    top: 80px;
    bottom: -2rem;
    width: 2px;
    background: #e5e7eb;
  }
  .timeline-image-wrapper {
    flex-shrink: 0;
    width: 200px;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    background: #f3f4f6;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  @media (max-width: 640px) {
    .timeline-image-wrapper {
      width: 120px;
      height: 120px;
    }
    .timeline-card {
      gap: 1rem;
    }
  }
  .timeline-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
  }
  .timeline-content {
    flex: 1;
    padding-top: 0.5rem;
  }
  .timeline-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    font-weight: bold;
    font-size: 18px;
    margin-bottom: 0.5rem;
  }

  /* ========== Video Block ========== */
  .video-block {
    margin: 1rem 0;
    width: 100%;
  }
  .video-block video {
    width: 100%;
    max-height: 60vh;
    border-radius: 10px;
    background: #0f172a;
    display: block;
  }`;
}

function buildGiftAppNamespace(project: Project, templateMeta: TemplateMeta): string {
  const data = project.data;
  const screens = templateMeta.screens.map(s => s.screenId);
  
  // Set global audio if present
  const globalAudioData = data.audio.global ? data.audio.global.data : null;
  
  // Build audio data map for screens
  const screenAudioMap: Record<string, { data: string; extendMusicToNext?: boolean }> = {};
  for (const screen of templateMeta.screens) {
    if (screen.supportsMusic) {
      const screenData = data.screens[screen.screenId];
      if (screenData?.audioId) {
        const audio = data.audio.screens[screen.screenId];
        if (audio) {
          screenAudioMap[screen.screenId] = {
            data: audio.data,
            extendMusicToNext: screenData.extendMusicToNext
          };
        }
      }
    }
  }
  
  return `
<script>
(function() {
  'use strict';
  
  // GiftApp namespace - all runtime functions isolated here (including AudioManager)
  var GiftApp = (function() {
    var currentScreenIndex = 0;
    var screens = ${JSON.stringify(screens)};
    var screenAudioMap = ${JSON.stringify(screenAudioMap)};
    var globalAudioData = ${globalAudioData ? JSON.stringify(globalAudioData) : 'null'};
    var carouselData = {};
    
    // ========== AudioManager (integrated into GiftApp) ==========
    var currentAudio = null;
    var currentScreenId = null;
    var isMuted = false;
    
    function playScreenAudio(screenId, audioData, loop) {
      // If this is the same audio already playing and should loop, don't restart
      if (currentAudio && currentScreenId === screenId && loop === currentAudio.loop) {
        if (loop) return;
      }
      
      stopAllAudio();
      if (isMuted) return;
      
      try {
        var audio = new Audio(audioData);
        audio.volume = 1.0;
        audio.loop = loop || false;
        audio.preload = 'auto';
        
        audio.onerror = function(e) {
          console.error('Audio element error:', e);
        };
        
        var playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(function() {
              currentAudio = audio;
              currentScreenId = screenId;
            })
            .catch(function(error) {
              console.error('Error playing audio:', error);
            });
        } else {
          currentAudio = audio;
          currentScreenId = screenId;
        }
      } catch (error) {
        console.error('Error creating audio element:', error);
      }
    }

    function playGlobalAudio() {
      if (globalAudioData && !isMuted) {
        playScreenAudio('global', globalAudioData, true);
      }
    }

    function stopAllAudio() {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
      currentScreenId = null;
    }

    function toggleMute() {
      isMuted = !isMuted;
      if (isMuted) {
        stopAllAudio();
      } else if (globalAudioData) {
        playGlobalAudio();
      }
    }

    function getMuteState() {
      return isMuted;
    }
    // ========== End AudioManager ==========
    
    function updateButtonStates() {
      screens.forEach(function(screenId, i) {
        // Try new format first (screen- prefix)
        var screen = document.getElementById('screen-' + screenId);
        // Fallback to old format (no prefix)
        if (!screen) {
          screen = document.getElementById(screenId);
        }
        if (!screen) return;
        
        var prevBtn = screen.querySelector('.screen-prev-btn');
        var nextBtn = screen.querySelector('.screen-next-btn');
        
        if (prevBtn) {
          prevBtn.disabled = (i === 0);
        }
        if (nextBtn) {
          nextBtn.disabled = (i === screens.length - 1);
        }
      });
    }
    
    function showScreen(index) {
      if (index < 0 || index >= screens.length) return;
      screens.forEach(function(screenId, i) {
        // Try new format first (screen- prefix)
        var screen = document.getElementById('screen-' + screenId);
        // Fallback to old format (no prefix)
        if (!screen) {
          screen = document.getElementById(screenId);
        }
        if (screen) {
          if (i === index) {
            screen.classList.remove('hidden');
          } else {
            screen.classList.add('hidden');
          }
        }
      });
      currentScreenIndex = index;
      updateButtonStates();
    }
    
    function startExperience() {
      var overlay = document.getElementById('overlay');
      if (overlay) overlay.classList.add('hidden');
      var nav = document.getElementById('navigation');
      if (nav) nav.classList.remove('hidden');
      showScreen(0);
      updateButtonStates();
      
      // Start global audio if available
      if (globalAudioData) {
        playGlobalAudio();
      }
    }
    
    function nextScreen() {
      if (currentScreenIndex < screens.length - 1) {
        var currentScreenIdValue = screens[currentScreenIndex];
        var nextScreenId = screens[currentScreenIndex + 1];
        var currentScreenData = screenAudioMap[currentScreenIdValue];
        
        // Handle audio - check if global audio is currently playing
        if (globalAudioData && currentScreenId === 'global') {
          // Global audio continues, don't stop
        } else if (!currentScreenData || !currentScreenData.extendMusicToNext) {
          if (!globalAudioData) {
            stopAllAudio();
          }
        }
        
        showScreen(currentScreenIndex + 1);
        
        // Play next screen audio if available (only if no global audio)
        setTimeout(function() {
          if (!globalAudioData) {
            var nextScreenData = screenAudioMap[nextScreenId];
            if (nextScreenData) {
              playScreenAudio(nextScreenId, nextScreenData.data, false);
            }
          }
        }, 100);
      }
    }
    
    function previousScreen() {
      if (currentScreenIndex > 0) {
        var prevScreenId = screens[currentScreenIndex - 1];
        
        // Check if global audio is currently playing (use audio manager's currentScreenId)
        if (globalAudioData && currentScreenId === 'global') {
          // Global audio continues, don't stop
        } else if (!globalAudioData) {
          stopAllAudio();
        }
        
        showScreen(currentScreenIndex - 1);
        
        // Play previous screen audio if available (only if no global audio)
        setTimeout(function() {
          if (!globalAudioData) {
            var prevScreenData = screenAudioMap[prevScreenId];
            if (prevScreenData) {
              playScreenAudio(prevScreenId, prevScreenData.data, false);
            }
          }
        }, 100);
      }
    }
    
    function carouselPrev(carouselId) {
      var data = carouselData[carouselId];
      if (!data) return;
      var newIndex = data.currentIndex > 0 ? data.currentIndex - 1 : data.images.length - 1;
      carouselGoTo(carouselId, newIndex);
    }
    
    function carouselNext(carouselId) {
      var data = carouselData[carouselId];
      if (!data) return;
      var newIndex = data.currentIndex < data.images.length - 1 ? data.currentIndex + 1 : 0;
      carouselGoTo(carouselId, newIndex);
    }
    
    function carouselGoTo(carouselId, index) {
      var data = carouselData[carouselId];
      if (!data || index < 0 || index >= data.images.length) return;
      
      data.currentIndex = index;
      var container = document.getElementById(carouselId);
      if (!container) return;
      
      var mainImg = container.querySelector('.carousel-main-image');
      var counter = container.querySelector('.carousel-counter');
      var thumbnails = container.querySelectorAll('.carousel-thumbnail');
      
      if (mainImg) {
        var imgSrc = data.images[index];
        mainImg.src = imgSrc;
        // Update zoom handler for this image
        mainImg.onclick = function() { zoomImage(imgSrc); };
      }
      
      if (counter) {
        counter.textContent = (index + 1) + ' / ' + data.images.length;
      }
      
      thumbnails.forEach(function(thumb, i) {
        if (i === index) {
          thumb.classList.add('active');
        } else {
          thumb.classList.remove('active');
        }
      });
    }
    
    function zoomImage(imageSrc) {
      var modal = document.createElement('div');
      modal.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;';
      modal.onclick = function() { document.body.removeChild(modal); };
      
      var img = document.createElement('img');
      img.src = imageSrc;
      img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
      img.onclick = function(e) { e.stopPropagation(); };
      
      var closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = 'position: absolute; top: 20px; right: 20px; color: white; font-size: 40px; background: none; border: none; cursor: pointer; z-index: 10000;';
      closeBtn.onclick = function() { document.body.removeChild(modal); };
      
      modal.appendChild(img);
      modal.appendChild(closeBtn);
      document.body.appendChild(modal);
    }
    
    // Gallery data storage for different layout types
    var gridGalleryData = {};
    var slideshowData = {};
    var heroGalleryData = {};
    
    // Migrate temporary gallery data if it exists
    if (window._tempCarouselData) {
      for (var key in window._tempCarouselData) {
        carouselData[key] = window._tempCarouselData[key];
      }
      delete window._tempCarouselData;
    }
    if (window._tempGalleryData) {
      for (var key in window._tempGalleryData) {
        gridGalleryData[key] = window._tempGalleryData[key];
      }
      delete window._tempGalleryData;
    }
    if (window._tempSlideshowData) {
      for (var key in window._tempSlideshowData) {
        slideshowData[key] = window._tempSlideshowData[key];
      }
      delete window._tempSlideshowData;
    }
    if (window._tempHeroData) {
      for (var key in window._tempHeroData) {
        heroGalleryData[key] = window._tempHeroData[key];
      }
      delete window._tempHeroData;
    }
    
    // Grid with Zoom gallery functions
    function initGridGallery(galleryId) {
      var container = document.getElementById(galleryId);
      if (!container) return;
      var images = container.querySelectorAll('.gallery-grid-image');
      images.forEach(function(img) {
        img.addEventListener('click', function() {
          zoomImage(img.src);
        });
      });
    }
    
    // Fullscreen Slideshow functions
    function initSlideshow(slideshowId) {
      var container = document.getElementById(slideshowId);
      if (!container) return;
      var data = slideshowData[slideshowId];
      if (!data || !data.images || data.images.length <= 1) return;
      
      var slides = container.querySelectorAll('.slideshow-slide');
      var prevBtn = container.querySelector('.slideshow-prev');
      var nextBtn = container.querySelector('.slideshow-next');
      var currentSpan = container.querySelector('.slideshow-current');
      var totalSpan = container.querySelector('.slideshow-total');
      
      function showSlide(index) {
        slides.forEach(function(slide, i) {
          if (i === index) {
            slide.classList.add('active');
          } else {
            slide.classList.remove('active');
          }
        });
        data.currentIndex = index;
        if (currentSpan) {
          currentSpan.textContent = index + 1;
        }
      }
      
      function nextSlide() {
        var nextIndex = (data.currentIndex + 1) % data.images.length;
        showSlide(nextIndex);
      }
      
      function prevSlide() {
        var prevIndex = (data.currentIndex - 1 + data.images.length) % data.images.length;
        showSlide(prevIndex);
      }
      
      if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
      }
      
      // Auto-play (3-5 seconds)
      var autoplayInterval = data.autoplayInterval || 4000;
      var autoplayTimer = setInterval(nextSlide, autoplayInterval);
      
      // Pause on hover
      container.addEventListener('mouseenter', function() {
        clearInterval(autoplayTimer);
      });
      container.addEventListener('mouseleave', function() {
        autoplayTimer = setInterval(nextSlide, autoplayInterval);
      });
      
      // Initialize with first slide
      showSlide(0);
    }
    
    // Hero with Thumbnails functions
    function initHeroGallery(heroId) {
      var container = document.getElementById(heroId);
      if (!container) return;
      var data = heroGalleryData[heroId];
      if (!data || !data.images || data.images.length <= 1) return;
      
      var heroImg = container.querySelector('.hero-image');
      var thumbnails = container.querySelectorAll('.hero-thumbnail');
      
      thumbnails.forEach(function(thumb, index) {
        thumb.addEventListener('click', function() {
          if (heroImg) {
            heroImg.src = data.images[index];
          }
          thumbnails.forEach(function(t, i) {
            if (i === index) {
              t.classList.add('active');
            } else {
              t.classList.remove('active');
            }
          });
          data.currentIndex = index;
        });
      });
      
      // Click hero image to zoom
      if (heroImg) {
        heroImg.addEventListener('click', function() {
          zoomImage(heroImg.src);
        });
      }
    }
    
    // Timeline functions
    function initTimeline(timelineId) {
      var container = document.getElementById(timelineId);
      if (!container) return;
      var images = container.querySelectorAll('.timeline-image');
      images.forEach(function(img) {
        img.addEventListener('click', function() {
          zoomImage(img.src);
        });
      });
    }
    
    // Attach event listeners to core UI elements (replacing onclick attributes)
    function attachEventListeners() {
      // Overlay start button
      var overlay = document.getElementById('overlay');
      if (overlay) {
        var startButton = overlay.querySelector('button');
        if (startButton) {
          startButton.addEventListener('click', startExperience);
        }
        // Also allow clicking the overlay itself to start
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay || e.target === overlay.querySelector('h1') || e.target === overlay.querySelector('p')) {
            startExperience();
          }
        });
      }
      
      // Screen navigation buttons (new preview-matching structure)
      screens.forEach(function(screenId) {
        var screen = document.getElementById('screen-' + screenId);
        if (!screen) {
          // Fallback: try without screen- prefix for old templates
          screen = document.getElementById(screenId);
        }
        if (screen) {
          // Menu button (no-op for now, can be extended later)
          var menuBtn = screen.querySelector('.screen-menu-btn');
          if (menuBtn) {
            menuBtn.addEventListener('click', function(e) {
              e.preventDefault();
              // Menu functionality can be added here if needed
            });
          }
          
          // Previous button
          var prevBtn = screen.querySelector('.screen-prev-btn');
          if (prevBtn) {
            prevBtn.addEventListener('click', previousScreen);
          }
          
          // Next button
          var nextBtn = screen.querySelector('.screen-next-btn');
          if (nextBtn) {
            nextBtn.addEventListener('click', nextScreen);
          }
        }
      });
      
      // Legacy navigation buttons (for old templates)
      var nav = document.getElementById('navigation');
      if (nav) {
        var prevBtn = nav.querySelector('.nav-button');
        var nextBtn = nav.querySelectorAll('.nav-button');
        if (prevBtn && nextBtn.length >= 2) {
          prevBtn.addEventListener('click', previousScreen);
          nextBtn[1].addEventListener('click', nextScreen);
        }
      }
      
      // Carousel controls - attach to all carousels
      var carousels = document.querySelectorAll('.image-carousel-container');
      carousels.forEach(function(container) {
        var carouselId = container.id;
        var prevBtn = container.querySelector('.carousel-nav-prev');
        var nextBtn = container.querySelector('.carousel-nav-next');
        var thumbnails = container.querySelectorAll('.carousel-thumbnail');
        var mainImg = container.querySelector('.carousel-main-image');
        
        if (prevBtn) {
          prevBtn.addEventListener('click', function() {
            carouselPrev(carouselId);
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener('click', function() {
            carouselNext(carouselId);
          });
        }
        thumbnails.forEach(function(thumb, index) {
          thumb.addEventListener('click', function() {
            carouselGoTo(carouselId, index);
          });
        });
        if (mainImg && mainImg.src) {
          mainImg.addEventListener('click', function() {
            zoomImage(mainImg.src);
          });
        }
      });
      
      // Grid galleries
      var gridGalleries = document.querySelectorAll('.gallery-grid-container');
      gridGalleries.forEach(function(container) {
        initGridGallery(container.id);
      });
      
      // Fullscreen slideshows
      var slideshows = document.querySelectorAll('.fullscreen-slideshow-container');
      slideshows.forEach(function(container) {
        initSlideshow(container.id);
      });
      
      // Hero galleries
      var heroGalleries = document.querySelectorAll('.hero-gallery-container');
      heroGalleries.forEach(function(container) {
        initHeroGallery(container.id);
      });
      
      // Timelines
      var timelines = document.querySelectorAll('.timeline-container');
      timelines.forEach(function(container) {
        initTimeline(container.id);
      });
    }
    
    // Initialize event listeners when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachEventListeners);
    } else {
      // DOM already loaded
      attachEventListeners();
    }
    
    // Public API
    return {
      startExperience: startExperience,
      nextScreen: nextScreen,
      previousScreen: previousScreen,
      carouselPrev: carouselPrev,
      carouselNext: carouselNext,
      carouselGoTo: carouselGoTo,
      zoomImage: zoomImage,
      // Audio API (integrated, not separate global)
      audio: {
        playScreenAudio: playScreenAudio,
        playGlobalAudio: playGlobalAudio,
        stopAll: stopAllAudio,
        toggleMute: toggleMute,
        getMuteState: getMuteState,
        get currentScreenId() { return currentScreenId; },
        get isMuted() { return isMuted; }
      }
    };
  })();
  
  // Attach to window
  window.GiftApp = GiftApp;
})();
</script>`;
}

// (injectScript removed - not used)
