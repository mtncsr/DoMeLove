import type { Project, ImageData } from '../types/project';
import type { TemplateMeta } from '../types/template';
import { loadTemplateHTML } from './templateLoader';

// AudioManager is now integrated into GiftApp - no separate global needed

export async function buildExportHTML(project: Project, templateMeta: TemplateMeta): Promise<string> {
  // Load template HTML
  let html = await loadTemplateHTML(project.templateId);

  // Update template onclick handlers to use GiftApp namespace
  html = updateTemplateOnclickHandlers(html);

  // Replace simple flat placeholders
  html = replacePlaceholders(html, project, templateMeta);

  // Handle repeating structures (galleries, blessings) based on template-meta
  html = injectRepeatingStructures(html, project, templateMeta);

  // Add HTML section comments and inject all scripts/styles in organized sections
  html = buildOrganizedHTML(html, project, templateMeta);

  // Export-time sanity checks: validate no external URLs
  validateExportSanity(html, project);

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

function validateExportSanity(html: string, project: Project): void {
  const errors: string[] = [];
  
  // Remove HTML comments before validation (they may contain example URLs or patterns)
  const htmlWithoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Check for external HTTP/HTTPS URLs (excluding data URLs)
  const externalUrlPattern = /(?:src|href|url)\s*[:=]\s*['"]?(https?:\/\/[^'"\s<>]+)/gi;
  const matches = htmlWithoutComments.matchAll(externalUrlPattern);
  for (const match of matches) {
    // Skip data URLs
    if (!match[1].startsWith('data:')) {
      errors.push(`Found external URL in exported HTML: ${match[1]}`);
    }
  }
  
  // Check that all images are embedded as data URLs
  const imagePattern = /<img[^>]+src\s*=\s*['"]([^'"]+)['"]/gi;
  const imageMatches = htmlWithoutComments.matchAll(imagePattern);
  for (const match of imageMatches) {
    const src = match[1];
    if (!src.startsWith('data:image/')) {
      errors.push(`Image source is not embedded as data URL: ${src.substring(0, 50)}...`);
    }
  }
  
  // Check that audio data URLs are present if audio exists
  if (project.data.audio.global) {
    if (!project.data.audio.global.data.startsWith('data:audio/')) {
      errors.push('Global audio is not embedded as data URL');
    }
  }
  
  for (const [screenId, audio] of Object.entries(project.data.audio.screens)) {
    if (!audio.data.startsWith('data:audio/')) {
      errors.push(`Screen audio for ${screenId} is not embedded as data URL`);
    }
  }
  
  // Validate that GiftApp namespace exists and AudioManager is NOT a global
  if (!html.includes('window.GiftApp') && !html.includes('window.GiftApp =')) {
    errors.push('GiftApp namespace not found in exported HTML');
  }
  
  // Validate that AudioManager is NOT exposed globally
  if (htmlWithoutComments.includes('window.AudioManager')) {
    errors.push('AudioManager should not be exposed as global - it should be integrated into GiftApp');
  }
  
  // Validate that _carouselData is NOT in public API
  if (htmlWithoutComments.includes('_carouselData:') || htmlWithoutComments.includes('_carouselData,')) {
    // This is okay if it's commented out or in a string, but check if it's actually exposed
    if (htmlWithoutComments.match(/return\s*\{[\s\S]*_carouselData[\s\S]*\}\s*;/) || 
        htmlWithoutComments.match(/GiftApp[.\s]*_carouselData/)) {
      errors.push('_carouselData should not be in GiftApp public API - it should be private');
    }
  }
  
  // Validate HTML section comments are present
  const hasStylesComment = html.includes('STYLES SECTION');
  const hasTemplatesComment = html.includes('TEMPLATES & CONTENT SECTION');
  const hasRuntimeComment = html.includes('RUNTIME LOGIC SECTION');
  
  if (!hasStylesComment || !hasTemplatesComment || !hasRuntimeComment) {
    const missing = [];
    if (!hasStylesComment) missing.push('STYLES SECTION');
    if (!hasTemplatesComment) missing.push('TEMPLATES & CONTENT SECTION');
    if (!hasRuntimeComment) missing.push('RUNTIME LOGIC SECTION');
    // This is a warning, not an error - don't block export but log it
    console.warn('Missing HTML section comments:', missing.join(', '));
  }
  
  if (errors.length > 0) {
    throw new Error(`Export validation failed:\n${errors.join('\n')}`);
  }
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
        const carouselHTML = generateImageCarouselHTML(screen.screenId, screenImages);
        
        // Replace image carousel placeholder if it exists
        const carouselPlaceholder = `{{${screen.screenId}_images}}`;
        if (html.includes(carouselPlaceholder)) {
          html = html.replace(carouselPlaceholder, carouselHTML);
        } else {
          // If placeholder doesn't exist, inject after the text placeholder
          // Try to find the screen div and inject after the text
          const screenTextPlaceholder = `{{${screen.screenId}_text}}`;
          if (html.includes(screenTextPlaceholder)) {
            // Inject after the closing </p> tag that follows the text
            html = html.replace(
              new RegExp(`(\\{\\{${screen.screenId}_text\\}\\}[^<]*</p>)`, 'g'),
              `$1${carouselHTML}`
            );
          } else {
            // If no text placeholder, inject after title
            const screenTitlePlaceholder = `{{${screen.screenId}_title}}`;
            if (html.includes(screenTitlePlaceholder)) {
              html = html.replace(
                new RegExp(`(\\{\\{${screen.screenId}_title\\}\\}[^<]*</h2>)`, 'g'),
                `$1${carouselHTML}`
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
  html = html.replace(/\{\{overlayButtonText\}\}/g, data.overlay.buttonText || 'Tap to Begin');

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

// Helper for escaping HTML (works in browser context)
function escapeHtmlForExport(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  
  // Build styles section
  const stylesSection = `<!-- ========== STYLES SECTION (embedded CSS) ========== -->\n<style>\n${existingStyles.trim()}\n${getCarouselStyles()}\n</style>`;
  
  // Build runtime logic section (GiftApp with integrated AudioManager)
  const scriptsSection = `<!-- ========== RUNTIME LOGIC SECTION (GiftApp engine) ========== -->\n${buildGiftAppNamespace(project, templateMeta)}`;
  
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

function getCarouselStyles(): string {
  return `
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
  }`;
}

function buildGiftAppNamespace(project: Project, templateMeta: TemplateMeta): string {
  const data = project.data;
  const screens = templateMeta.screens.map(s => s.screenId);
  
  // Set global audio if present
  const globalAudioData = data.audio.global ? data.audio.global.data : null;
  
  // Build audio data map for screens
  const screenAudioMap: Record<string, { data: string; extendMusic?: boolean }> = {};
  for (const screen of templateMeta.screens) {
    if (screen.supportsMusic) {
      const screenData = data.screens[screen.screenId];
      if (screenData?.audioId) {
        const audio = data.audio.screens[screen.screenId];
        if (audio) {
          screenAudioMap[screen.screenId] = {
            data: audio.data,
            extendMusic: screenData.extendMusic
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
    
    function showScreen(index) {
      if (index < 0 || index >= screens.length) return;
      screens.forEach(function(screenId, i) {
        var screen = document.getElementById(screenId);
        if (screen) {
          if (i === index) {
            screen.classList.remove('hidden');
          } else {
            screen.classList.add('hidden');
          }
        }
      });
      currentScreenIndex = index;
    }
    
    function startExperience() {
      var overlay = document.getElementById('overlay');
      if (overlay) overlay.classList.add('hidden');
      var nav = document.getElementById('navigation');
      if (nav) nav.classList.remove('hidden');
      showScreen(0);
      
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
        } else if (!currentScreenData || !currentScreenData.extendMusic) {
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
    
    // Migrate temporary carousel data if it exists
    if (window._tempCarouselData) {
      for (var key in window._tempCarouselData) {
        carouselData[key] = window._tempCarouselData[key];
      }
      delete window._tempCarouselData;
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
      
      // Navigation buttons
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

function injectScript(html: string, script: string): string {
  // Inject before closing </body> tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}\n</body>`);
  }
  return html + script;
}
