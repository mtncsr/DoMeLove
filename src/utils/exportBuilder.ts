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
      get globalAudioData() { return globalAudioData; }
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

    // Replace image placeholders (screen1_image1, screen1_image2, etc.)
    if (screenData.images) {
      const imageMap = new Map<string, ImageData>();
      for (const img of project.data.images) {
        imageMap.set(img.id, img);
      }

      screenData.images.forEach((imageId: string, index: number) => {
        const image = imageMap.get(imageId);
        if (image) {
          const placeholder = `{{${screen.screenId}_image${index + 1}}}`;
          html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), image.data);
        }
      });
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

function injectRepeatingStructures(html: string, project: Project, templateMeta: TemplateMeta): string {
  const data = project.data;

  for (const screen of templateMeta.screens) {
    // Handle gallery screens
    if (screen.type === 'gallery' && screen.galleryImageCount) {
      const screenData = data.screens[screen.screenId];
      if (screenData?.images) {
        const imageMap = new Map<string, ImageData>();
        for (const img of project.data.images) {
          imageMap.set(img.id, img);
        }

        // Find gallery container placeholder (e.g., {{screen1_gallery}})
        const galleryPlaceholder = `{{${screen.screenId}_gallery}}`;
        if (html.includes(galleryPlaceholder)) {
          const galleryHTML = screenData.images
            .map((imageId: string) => {
              const image = imageMap.get(imageId);
              if (!image) return '';
              return `<img src="${image.data}" alt="Gallery image" style="max-width: 100%; height: auto;" />`;
            })
            .join('\n');
          
          html = html.replace(galleryPlaceholder, galleryHTML);
        }
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

    // Enhance nextScreen to handle audio
    if (typeof nextScreen !== 'undefined') {
      var originalNextScreen = nextScreen;
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
            if (!currentScreenData || !currentScreenData.extendMusic) {
              if (!globalAudioData) {
                AudioManager.stopAll();
              }
            }
          }
          
          originalNextScreen();
          
          // Play next screen audio if available
          setTimeout(function() {
            if (typeof AudioManager !== 'undefined') {
              var nextScreenData = screenAudioMap[nextScreenId];
              if (nextScreenData && !globalAudioData) {
                AudioManager.playScreenAudio(nextScreenId, nextScreenData.data, false);
              }
            }
          }, 100);
        }
      };
    }

    // Enhance previousScreen to handle audio
    if (typeof previousScreen !== 'undefined') {
      var originalPreviousScreen = previousScreen;
      window.previousScreen = function() {
        var currentIndex = typeof currentScreenIndex !== 'undefined' ? currentScreenIndex : 0;
        var screens = ${JSON.stringify(screens)};
        var screenAudioMap = ${JSON.stringify(screenAudioMap)};
        
        if (currentIndex > 0) {
          var prevScreenId = screens[currentIndex - 1];
          
          if (typeof AudioManager !== 'undefined') {
            if (!globalAudioData) {
              AudioManager.stopAll();
            }
          }
          
          originalPreviousScreen();
          
          // Play previous screen audio if available
          setTimeout(function() {
            if (typeof AudioManager !== 'undefined') {
              var prevScreenData = screenAudioMap[prevScreenId];
              if (prevScreenData && !globalAudioData) {
                AudioManager.playScreenAudio(prevScreenId, prevScreenData.data, false);
              }
            }
          }, 100);
        }
      };
    }
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
