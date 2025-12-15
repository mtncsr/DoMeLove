import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { buildGiftHtml } from '../../utils/giftRenderPipeline';
import { getExportScreens } from '../../utils/screenSource';
import { Button } from '../ui/Button';

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

  if (!currentProject || !templateMeta) return null;

  // Get screens using unified source of truth
  const screens = getExportScreens(currentProject, templateMeta);
  const firstScreenId = screens.length > 0 ? screens[0].screenId : undefined;

  // Generate cache key for preview HTML
  useEffect(() => {
    if (!currentProject || !templateMeta) return;

    const generateCacheKey = () => {
      return `${currentProject.id}_${currentProject.templateId}_${currentProject.updatedAt}_${firstScreenId || 'all'}`;
    };

    const newCacheKey = generateCacheKey();
    if (newCacheKey === cacheKeyRef.current) {
      // Cache hit - no need to regenerate
      return;
    }

    cacheKeyRef.current = newCacheKey;
    setIsLoading(true);
    setError(null);

    // Build HTML using unified pipeline
    buildGiftHtml(currentProject, templateMeta, {
      mode: 'preview',
      startScreenId: firstScreenId,
      hideEmptyScreens: false, // Show all screens in preview
    })
      .then((html) => {
        setPreviewHtml(html);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate preview HTML:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate preview');
        setIsLoading(false);
      });
  }, [currentProject?.id, currentProject?.templateId, currentProject?.updatedAt, templateMeta?.templateId, firstScreenId]);

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
