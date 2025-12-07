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

    function playScreenAudio(screenId, audioData) {
      stopAll();
      if (isMuted) return;
      
      try {
        var audio = new Audio(audioData);
        audio.volume = 1.0;
        audio.play().catch(function(error) {
          console.error('Error playing audio:', error);
        });
        currentAudio = audio;
        currentScreenId = screenId;
      } catch (error) {
        console.error('Error creating audio element:', error);
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
      }
    }

    function getMuteState() {
      return isMuted;
    }

    return {
      playScreenAudio: playScreenAudio,
      stopAll: stopAll,
      toggleMute: toggleMute,
      getMuteState: getMuteState
    };
  })();

  window.AudioManager = AudioManager;
})();
</script>
`;

export async function buildExportHTML(project: Project, templateMeta: TemplateMeta): Promise<string> {
  // Load template HTML
  let html = await loadTemplateHTML(project.templateId);

  // Replace simple flat placeholders
  html = replacePlaceholders(html, project, templateMeta);

  // Handle repeating structures (galleries, blessings) based on template-meta
  html = injectRepeatingStructures(html, project, templateMeta);

  // Inject AudioManager JavaScript
  html = injectScript(html, AUDIO_MANAGER_JS);

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

function injectScript(html: string, script: string): string {
  // Inject before closing </body> tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}\n</body>`);
  }
  return html + script;
}
