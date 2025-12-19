import { useState, useEffect, useRef, useMemo, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { buildGiftHtml } from '../../utils/giftRenderPipeline';
import { getExportScreens } from '../../utils/screenSource';
import { Button } from '../ui/Button';
import { useRenderCount } from '../../hooks/useRenderCount';
import { perfMark, perfMeasure, perfNow, logPerf } from '../../utils/perf';

interface PreviewStepProps {
  templateMeta: TemplateMeta | null;
}

export function PreviewStep({ templateMeta }: PreviewStepProps) {
  const { t } = useTranslation();
  const { currentProject } = useProject();
  const [isMobileView, setIsMobileView] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cacheKeyRef = useRef<string>('');
  const pendingKeyRef = useRef<string>('');
  const debounceTimerRef = useRef<number | null>(null);
  const genRef = useRef(0);

  // DEV: Track render counts
  useRenderCount('PreviewStep');

  if (!currentProject || !templateMeta) return null;

  // Memoize screens computation - use updatedAt to detect screen changes
  // TODO: After PR D, switch to dataRevision dependency
  const screens = useMemo(() => {
    return getExportScreens(currentProject, templateMeta);
  }, [
    currentProject?.id,
    currentProject?.updatedAt, // Temporarily use updatedAt until dataRevision available
    templateMeta?.templateId,
  ]);

  const firstScreenId = screens.length > 0 ? screens[0].screenId : undefined;

  // Generate stable cache key based on preview-relevant data only (NOT updatedAt)
  const previewCacheKey = useMemo(() => {
    if (!currentProject || !templateMeta) return '';

    // Collect media IDs used in screens
    const imageIds = new Set<string>();
    const audioIds = new Set<string>();
    const videoIds = new Set<string>();

    for (const screen of screens) {
      const screenData = currentProject.data.screens[screen.screenId];
      if (screenData?.images) {
        screenData.images.forEach((id: string) => imageIds.add(id));
      }
      if (screenData?.mediaMode === 'video' && screenData.videoId) {
        videoIds.add(screenData.videoId);
      }
    }

    if (currentProject.data.audio.global?.id) {
      audioIds.add(currentProject.data.audio.global.id);
    }
    for (const screen of screens) {
      const audio = currentProject.data.audio.screens[screen.screenId];
      if (audio?.id) {
        audioIds.add(audio.id);
      }
    }

    // Create stable signature from preview-relevant data
    const mediaSignature = [
      Array.from(imageIds).sort().join(','),
      Array.from(audioIds).sort().join(','),
      Array.from(videoIds).sort().join(','),
    ].join('|');

    // Include screen texts for cache key (but hash them, don't include full strings)
    const screenTexts = screens
      .map(s => {
        const screenData = currentProject.data.screens[s.screenId];
        return `${s.screenId}:${screenData?.title || ''}:${screenData?.text || ''}`;
      })
      .sort()
      .join('||');

    // Hash the texts to keep key size reasonable (simple hash)
    let textHash = 0;
    for (let i = 0; i < screenTexts.length; i++) {
      const char = screenTexts.charCodeAt(i);
      textHash = ((textHash << 5) - textHash) + char;
      textHash = textHash & textHash; // Convert to 32-bit integer
    }

    return `${currentProject.id}_${currentProject.templateId}_${firstScreenId || 'all'}_${mediaSignature}_${textHash}`;
  }, [
    currentProject?.id,
    currentProject?.templateId,
    currentProject?.data.screens,
    currentProject?.data.images,
    currentProject?.data.audio,
    currentProject?.data.videos,
    templateMeta?.templateId,
    firstScreenId,
    screens,
  ]);

  // Debounced preview regeneration effect
  useEffect(() => {
    if (!currentProject || !templateMeta) return;

    // Clear any pending debounce
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
    }

    const newCacheKey = previewCacheKey;
    const oldCacheKey = cacheKeyRef.current;
    
    if (newCacheKey === cacheKeyRef.current) {
      // Cache hit - no need to regenerate
      if (import.meta.env.DEV) {
        logPerf('[PreviewStep] Cache hit, skipping regeneration');
      }
      return;
    }

    // Debounce preview regeneration (250ms) to avoid regenerating on every keystroke
    debounceTimerRef.current = window.setTimeout(() => {
      // Check again after debounce - cache key might have changed
      if (previewCacheKey !== newCacheKey) {
        // Cache key changed during debounce, skip this regeneration
        return;
      }

      // Track pending key (don't update cacheKeyRef until success)
      pendingKeyRef.current = newCacheKey;
      
      // Generation ID guard to prevent out-of-order results
      const genId = ++genRef.current;

      // Use startTransition to mark preview generation as non-urgent
      startTransition(() => {
        perfMark('preview-regeneration-start');
        logPerf('[PreviewStep] Cache miss, regenerating preview', {
          old: oldCacheKey,
          new: newCacheKey,
          genId,
        });

        setIsLoading(true);
        setError(null);

        const startTime = perfNow();
        // Always use currentProject (not deferred) to ensure cache key matches generated HTML
        buildGiftHtml(currentProject, templateMeta, {
          mode: 'preview',
          startScreenId: firstScreenId,
          hideEmptyScreens: false,
        })
          .then((html) => {
            // Generation ID guard: ignore if this is not the latest generation
            if (genId !== genRef.current) {
              if (import.meta.env.DEV) {
                logPerf(`[PreviewStep] Ignoring outdated generation ${genId} (current: ${genRef.current})`);
              }
              return;
            }

            const duration = perfNow() - startTime;
            perfMark('preview-regeneration-end');
            perfMeasure('preview-regeneration', 'preview-regeneration-start', 'preview-regeneration-end');
            logPerf(`[PreviewStep] Preview generated in ${duration.toFixed(2)}ms`, {
              htmlSize: html.length,
              imageCount: currentProject.data.images?.length || 0,
              genId,
            });
            
            // Only update cache key on success
            cacheKeyRef.current = newCacheKey;
            pendingKeyRef.current = '';
            setPreviewHtml(html);
            setIsLoading(false);
          })
          .catch((err) => {
            // Generation ID guard: ignore if this is not the latest generation
            if (genId !== genRef.current) {
              if (import.meta.env.DEV) {
                logPerf(`[PreviewStep] Ignoring outdated error ${genId} (current: ${genRef.current})`);
              }
              return;
            }

            perfMark('preview-regeneration-end');
            if (import.meta.env.DEV) {
              console.error('[PreviewStep] Failed to generate preview HTML:', err);
            }
            setError(err instanceof Error ? err.message : 'Failed to generate preview');
            // Don't update cacheKeyRef on failure - allows retry on next change
            pendingKeyRef.current = '';
            setIsLoading(false);
          });
      });
    }, 250); // 250ms debounce

    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [previewCacheKey, currentProject, templateMeta, firstScreenId]);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(previewHtml);
        iframeDoc.close();
      }
    }
  }, [previewHtml]);

  return (
    <div className="bg-transparent">
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-2 items-center">
          <Button
            variant={isMobileView ? 'primary' : 'secondary'}
            onClick={() => setIsMobileView(true)}
          >
            {t('editor.preview.mobileView')}
          </Button>
          <Button
            variant={!isMobileView ? 'primary' : 'secondary'}
            onClick={() => setIsMobileView(false)}
          >
            {t('editor.preview.desktopView')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      <div
        className={`bg-white rounded-lg border border-gray-200 ${
          isMobileView ? 'preview-mobile' : 'preview-desktop'
        } relative overflow-hidden force-light-preview`}
        style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-gray-500">Loading preview...</div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full min-h-[600px] border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', height: '100%', minHeight: '600px' }}
          />
        )}
      </div>
    </div>
  );
}
