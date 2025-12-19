import { useState, useEffect, useRef } from 'react';
import { useEditorNavigation } from '../../../contexts/EditorNavigationContext';
import { useProject } from '../../../contexts/ProjectContext';
import { loadTemplateMeta } from '../../../utils/templateLoader';
import { buildGiftHtml } from '../../../utils/giftRenderPipeline';
import type { TemplateMeta } from '../../../types/template';
import { Button } from '../../ui/Button';
import { Minus, Plus, Smartphone, Monitor } from 'lucide-react';
import { NEW_TEMPLATES } from '../../../data/newTemplates';

export function TemplateDetailsView({ templateId }: { templateId: string }) {
  const { navigate } = useEditorNavigation();
  const { currentProject, updateProject, createProject, setCurrentProject } = useProject();
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [isMobileView, setIsMobileView] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const templateInfo = NEW_TEMPLATES.find((t) => t.id === templateId);

  useEffect(() => {
    // Try to load template meta - if it doesn't exist yet, that's ok (will be created in Phase 1.5)
    loadTemplateMeta(templateId)
      .then((meta) => {
        setTemplateMeta(meta);
        // Generate preview with default/placeholder data
        generatePreview(meta);
      })
      .catch((err) => {
        console.warn(`Template ${templateId} not found yet (will be created in Phase 1.5):`, err);
        setIsLoading(false);
      });
  }, [templateId]);

  const generatePreview = async (meta: TemplateMeta) => {
    try {
      // Create a temporary project with default data for preview
      const tempProject = createProject(templateId, `Preview: ${meta.templateName}`);
      
      // Fill with placeholder data
      const projectWithDefaults: typeof tempProject = {
        ...tempProject,
        data: {
          ...tempProject.data,
          recipientName: 'Recipient Name',
          senderName: 'Sender Name',
          mainGreeting: meta.designConfig?.textPlaceholders?.mainGreeting || 'Hello!',
          screens: meta.screens.reduce((acc, screen) => {
            acc[screen.screenId] = {
              title: meta.designConfig?.textPlaceholders?.title || 'Title',
              text: meta.designConfig?.textPlaceholders?.text || 'Text content...',
            };
            return acc;
          }, {} as Record<string, any>),
        },
      };

      const html = await buildGiftHtml(projectWithDefaults, meta, {
        mode: 'preview',
        startScreenId: meta.screens[0]?.screenId,
      });
      setPreviewHtml(html);
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = () => {
    if (!templateMeta) return;

    // Create or update project with this template
    let project = currentProject;
    if (!project || project.templateId !== templateId) {
      project = createProject(templateId, templateInfo?.name || templateMeta.templateName);
      setCurrentProject(project);
    }

    // Update project with template screens
    updateProject({
      ...project,
      templateId: templateId,
      data: {
        ...project.data,
        dynamicScreens: templateMeta.screens.sort((a, b) => a.order - b.order),
        dynamicScreensTemplateId: templateId,
      },
    });

    // Navigate to first screen
    const firstScreen = templateMeta.screens.sort((a, b) => a.order - b.order)[0];
    if (firstScreen) {
      navigate({ type: 'screens-canvas', screenId: firstScreen.screenId });
    }
  };

  const adjustZoom = (delta: number) => {
    setZoom((prev) => Math.max(25, Math.min(200, prev + delta)));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-slate-600">Loading template preview...</p>
      </div>
    );
  }

  if (!templateMeta && !templateInfo) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Template not found: {templateId}</p>
        <Button onClick={() => navigate({ type: 'templates-grid' })} className="mt-4">
          Back to Templates
        </Button>
      </div>
    );
  }

  const canvasWidth = isMobileView ? 375 : 800;
  const canvasHeight = isMobileView ? 667 : 600;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {templateInfo?.name || templateMeta?.templateName || templateId}
        </h2>
        {templateInfo && (
          <p className="text-slate-600 dark:text-slate-400">
            {templateInfo.screenCount} screens • {templateInfo.category}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustZoom(-10)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-16 text-center text-sm font-medium">{zoom}%</span>
          <button
            onClick={() => adjustZoom(10)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setIsMobileView(!isMobileView)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isMobileView
              ? 'bg-fuchsia-600 text-white'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {isMobileView ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span>{isMobileView ? 'Mobile' : 'Desktop'}</span>
        </button>
      </div>

      {/* Preview Window */}
      <div className="flex justify-center">
        <div
          className="border-4 border-slate-300 dark:border-slate-600 rounded-lg shadow-2xl bg-white"
          style={{
            width: `${(canvasWidth * zoom) / 100}px`,
            height: `${(canvasHeight * zoom) / 100}px`,
            transform: 'scale(1)',
            transformOrigin: 'top center',
          }}
        >
          {previewHtml ? (
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-0"
              style={{ pointerEvents: 'none' }}
              title="Template Preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Preview not available
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleSelectTemplate}
          className="px-8 py-3 text-lg"
          disabled={!templateMeta}
        >
          Select Template
        </Button>
      </div>
    </div>
  );
}
