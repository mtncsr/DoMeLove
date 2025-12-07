import type { Project, ImageData } from '../types/project';
import type { TemplateMeta } from '../types/template';
import { loadTemplateHTML } from './templateLoader';

// AudioManager JavaScript for exported HTML (vanilla JS version)
const AUDIO_MANAGER_JS = `
<script>
(function() {
  'use strict';
  var AudioManager = (function() {
    var currentAudio = null;
    var currentScreenId = null;
    var isMuted = false;
    var globalAudioData = null;

    function setGlobalAudio(audioData) {
      globalAudioData = audioData;
    }

    function playScreenAudio(screenId, audioData, loop) {
      // If this is the same audio already playing and should loop, don't restart
      if (currentAudio && currentScreenId === screenId && loop === currentAudio.loop) {
        if (loop) return;
      }
      
      stopAll();
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

    function stopAll() {
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
        stopAll();
      } else if (globalAudioData) {
        playGlobalAudio();
      }
    }

    function getMuteState() {
      return isMuted;
    }

    return {
      playScreenAudio: playScreenAudio,
      playGlobalAudio: playGlobalAudio,
      setGlobalAudio: setGlobalAudio,
      stopAll: stopAll,
      toggleMute: toggleMute,
      getMuteState: getMuteState,
      get globalAudioData() { return globalAudioData; },
      get currentScreenId() { return currentScreenId; }
    };
  })();

  window.AudioManager = AudioManager;
})();
</script>
`;

export async function buildExportHTML(project: Project, templateMeta: TemplateMeta): Promise<string> {
  // Load template HTML
  let html = await loadTemplateHTML(project.templateId);

  // Inject AudioManager JavaScript first (before any scripts that use it)
  html = injectScript(html, AUDIO_MANAGER_JS);

  // Replace simple flat placeholders
  html = replacePlaceholders(html, project, templateMeta);

  // Handle repeating structures (galleries, blessings) based on template-meta
  html = injectRepeatingStructures(html, project, templateMeta);

  // Inject image carousel CSS and scripts
  html = injectImageCarouselScripts(html);

  // Inject navigation and audio handling scripts
  html = injectNavigationScripts(html, project, templateMeta);

  return html;
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
  const carouselHTML = `
    <div class="image-carousel-container" id="${carouselId}">
      <div class="image-carousel-main">
        <img 
          src="${images[0].data}" 
          alt="${escapeHtmlForExport(images[0].filename)}" 
          class="carousel-main-image"
          onclick="zoomImage('${images[0].data}')"
        />
        ${images.length > 1 ? `
        <button class="carousel-nav-btn carousel-nav-prev" onclick="carouselPrev('${carouselId}')">‹</button>
        <button class="carousel-nav-btn carousel-nav-next" onclick="carouselNext('${carouselId}')">›</button>
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
            onclick="carouselGoTo('${carouselId}', ${index})"
          />
        `).join('')}
      </div>
      ` : ''}
    </div>
    <script>
      (function() {
        var carouselData = window.carouselData || {};
        carouselData['${carouselId}'] = {
          images: ${JSON.stringify(images.map(img => img.data))},
          currentIndex: 0
        };
        window.carouselData = carouselData;
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

function injectImageCarouselScripts(html: string): string {
  const carouselScript = `
<script>
  function carouselPrev(carouselId) {
    var data = window.carouselData && window.carouselData[carouselId];
    if (!data) return;
    var newIndex = data.currentIndex > 0 ? data.currentIndex - 1 : data.images.length - 1;
    carouselGoTo(carouselId, newIndex);
  }

  function carouselNext(carouselId) {
    var data = window.carouselData && window.carouselData[carouselId];
    if (!data) return;
    var newIndex = data.currentIndex < data.images.length - 1 ? data.currentIndex + 1 : 0;
    carouselGoTo(carouselId, newIndex);
  }

  function carouselGoTo(carouselId, index) {
    var data = window.carouselData && window.carouselData[carouselId];
    if (!data || index < 0 || index >= data.images.length) return;
    
    data.currentIndex = index;
    var container = document.getElementById(carouselId);
    if (!container) return;
    
    var mainImg = container.querySelector('.carousel-main-image');
    var counter = container.querySelector('.carousel-counter');
    var thumbnails = container.querySelectorAll('.carousel-thumbnail');
    
    if (mainImg) {
      mainImg.src = data.images[index];
      mainImg.onclick = function() { zoomImage(data.images[index]); };
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
</script>
<style>
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
</style>
`;
  return injectScript(html, carouselScript);
}

function injectNavigationScripts(html: string, project: Project, templateMeta: TemplateMeta): string {
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

  // Create enhanced navigation script
  const navigationScript = `
<script>
  (function() {
    // Set global audio if available
    var globalAudioData = ${globalAudioData ? JSON.stringify(globalAudioData) : 'null'};
    if (globalAudioData && typeof AudioManager !== 'undefined') {
      AudioManager.setGlobalAudio(globalAudioData);
    }

    // Override startExperience to handle audio
    if (typeof startExperience !== 'undefined') {
      var originalStartExperience = startExperience;
      window.startExperience = function() {
        originalStartExperience();
        // Start global audio if available
        if (typeof AudioManager !== 'undefined' && AudioManager.playGlobalAudio) {
          AudioManager.playGlobalAudio();
        } else if (globalAudioData && typeof AudioManager !== 'undefined') {
          // Fallback: play global audio directly
          AudioManager.playScreenAudio('global', globalAudioData, true);
        }
      };
    } else {
      // If template doesn't have startExperience, create it
      window.startExperience = function() {
        var overlay = document.getElementById('overlay');
        if (overlay) overlay.classList.add('hidden');
        var nav = document.getElementById('navigation');
        if (nav) nav.classList.remove('hidden');
        if (typeof showScreen === 'function') {
          showScreen(0);
        }
        // Start global audio if available
        if (typeof AudioManager !== 'undefined' && AudioManager.playGlobalAudio) {
          AudioManager.playGlobalAudio();
        } else if (globalAudioData && typeof AudioManager !== 'undefined') {
          // Fallback: play global audio directly
          AudioManager.playScreenAudio('global', globalAudioData, true);
        }
      };
    }

    // Override nextScreen completely to handle audio properly
    window.nextScreen = function() {
      var currentIndex = typeof currentScreenIndex !== 'undefined' ? currentScreenIndex : 0;
      var screens = ${JSON.stringify(screens)};
      var screenAudioMap = ${JSON.stringify(screenAudioMap)};
      
      if (currentIndex < screens.length - 1) {
        var currentScreenId = screens[currentIndex];
        var nextScreenId = screens[currentIndex + 1];
        var currentScreenData = screenAudioMap[currentScreenId];
        
        // Only stop audio if not extending music and no global audio
        if (typeof AudioManager !== 'undefined') {
          // If global audio is playing, don't stop it
          if (globalAudioData && AudioManager.currentScreenId === 'global') {
            // Global audio continues, don't stop
          } else if (!currentScreenData || !currentScreenData.extendMusic) {
            if (!globalAudioData) {
              AudioManager.stopAll();
            }
          }
        }
        
        // Show next screen
        if (typeof showScreen === 'function') {
          showScreen(currentIndex + 1);
        }
        
        // Play next screen audio if available (only if no global audio)
        setTimeout(function() {
          if (typeof AudioManager !== 'undefined') {
            if (globalAudioData) {
              // Global audio continues playing, do nothing
            } else {
              var nextScreenData = screenAudioMap[nextScreenId];
              if (nextScreenData) {
                AudioManager.playScreenAudio(nextScreenId, nextScreenData.data, false);
              }
            }
          }
        }, 100);
      }
    };

    // Override previousScreen completely to handle audio properly
    window.previousScreen = function() {
      var currentIndex = typeof currentScreenIndex !== 'undefined' ? currentScreenIndex : 0;
      var screens = ${JSON.stringify(screens)};
      var screenAudioMap = ${JSON.stringify(screenAudioMap)};
      
      if (currentIndex > 0) {
        var prevScreenId = screens[currentIndex - 1];
        
        if (typeof AudioManager !== 'undefined') {
          // If global audio is playing, don't stop it
          if (globalAudioData && AudioManager.currentScreenId === 'global') {
            // Global audio continues, don't stop
          } else if (!globalAudioData) {
            AudioManager.stopAll();
          }
        }
        
        // Show previous screen
        if (typeof showScreen === 'function') {
          showScreen(currentIndex - 1);
        }
        
        // Play previous screen audio if available (only if no global audio)
        setTimeout(function() {
          if (typeof AudioManager !== 'undefined') {
            if (globalAudioData) {
              // Global audio continues playing, do nothing
            } else {
              var prevScreenData = screenAudioMap[prevScreenId];
              if (prevScreenData) {
                AudioManager.playScreenAudio(prevScreenId, prevScreenData.data, false);
              }
            }
          }
        }, 100);
      }
    };
  })();
</script>`;

  return injectScript(html, navigationScript);
}

function injectScript(html: string, script: string): string {
  // Inject before closing </body> tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}\n</body>`);
  }
  return html + script;
}
