import { useState, useEffect } from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { loadTemplateMeta } from '../utils/templateLoader';
import type { TemplateMeta, ScreenConfig } from '../types/template';
import type { Project } from '../types/project';
import { EditorNavigationProvider, useEditorNavigation } from '../contexts/EditorNavigationContext';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { TemplatesGridView } from '../components/editor/views/TemplatesGridView';
import { TemplateDetailsView } from '../components/editor/views/TemplateDetailsView';
import { ScreensCanvasView } from '../components/editor/views/ScreensCanvasView';
import { ContentsView } from '../components/editor/views/ContentsView';
import { PreviewExportView } from '../components/editor/views/PreviewExportView';
import { TEMPLATE_CARDS } from '../data/templates';
import { getTextDirection } from '../i18n/config';

function generateCustomTemplateMeta(project: Project): TemplateMeta {
  const customScreens = project.data.customTemplate?.customScreens || [];
  const screens: ScreenConfig[] = customScreens.map((customScreen) => ({
    screenId: customScreen.id,
    type: customScreen.type,
    placeholders: ['title', 'text'],
    required: [],
    order: customScreen.order,
    supportsMusic: customScreen.supportsMusic,
    galleryImageCount: customScreen.type === 'gallery' ? 1 : undefined,
  }));

  return {
    templateId: 'custom',
    templateName: 'Custom Template',
    overlayType: 'custom',
    screens: screens.sort((a, b) => a.order - b.order),
    globalPlaceholders: ['recipientName', 'senderName', 'eventTitle', 'mainGreeting'],
  };
}

function EditorContent() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentProject, updateProject } = useProject();
  const { currentView, goBack, canGoBack, getViewTitle } = useEditorNavigation();
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  useEffect(() => {
    if (currentProject?.templateId) {
      if (currentProject.templateId === 'custom' && currentProject.data.customTemplate?.isCustom) {
        // Generate TemplateMeta from custom template
        const customMeta = generateCustomTemplateMeta(currentProject);
        setTemplateMeta(customMeta);
      } else {
        loadTemplateMeta(currentProject.templateId)
          .then(setTemplateMeta)
          .catch(console.error);
      }
    }
  }, [currentProject?.templateId, currentProject?.data.customTemplate]);

  // When template meta loads or template changes, sync dynamicScreens to match the template
  useEffect(() => {
    if (!templateMeta || !currentProject) return;
    const alreadySynced = currentProject.data.dynamicScreensTemplateId === templateMeta.templateId;
    if (!alreadySynced) {
      const selectedCard = TEMPLATE_CARDS.find(
        (c) => c.id === currentProject.data.selectedTemplateCardId
      );
      let orderedScreens = [...templateMeta.screens].sort((a, b) => a.order - b.order);

      // If marketing card defines a specific screen count, trim to that count to match expectation
      if (selectedCard?.screens && orderedScreens.length > selectedCard.screens) {
        orderedScreens = orderedScreens.slice(0, selectedCard.screens);
      }

      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          dynamicScreens: orderedScreens,
          dynamicScreensTemplateId: templateMeta.templateId,
        },
      });
    }
  }, [templateMeta?.templateId, currentProject, updateProject]);

  // Update project name when template changes
  useEffect(() => {
    if (!currentProject || !currentProject.data.selectedTemplateCardId) return;

    const selectedCard = TEMPLATE_CARDS.find(
      (card) => card.id === currentProject.data.selectedTemplateCardId
    );

    if (selectedCard?.shortName) {
      const newName = `my interactive ${selectedCard.shortName}`;
      if (currentProject.name !== newName) {
        updateProject({
          ...currentProject,
          name: newName,
        });
      }
    }
  }, [currentProject?.data.selectedTemplateCardId, currentProject, updateProject]);



  if (!currentProject) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-700 mb-4">No project selected</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-fuchsia-600 text-white rounded-lg hover:bg-fuchsia-700"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const renderViewContent = () => {
    switch (currentView.type) {
      case 'templates-grid':
        return <TemplatesGridView />;
      case 'template-details':
        return <TemplateDetailsView templateId={currentView.templateId} />;
      case 'screens-canvas':
        return <ScreensCanvasView screenId={currentView.screenId} />;
      case 'contents':
        return <ContentsView subtab={currentView.subtab} />;
      case 'preview-export':
        return <PreviewExportView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-[#0f0a1a] dark:via-[#140a26] dark:to-[#0f0a1a] flex flex-col" dir={dir}>
      {/* Top Bar */}
      <div className="h-16 bg-white/80 dark:bg-[rgba(23,16,34,0.85)] backdrop-blur border-b border-slate-200 dark:border-[rgba(255,255,255,0.08)] flex items-center px-4 gap-4">
        {/* Hamburger Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {getViewTitle()}
          </h1>
            </div>

        {/* Back Button */}
        {canGoBack ? (
          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Go back"
                >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        ) : (
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Exit editor"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
        )}
        </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } lg:block fixed lg:static inset-y-0 left-0 z-40 lg:z-auto w-64 mt-16 lg:mt-0`}
        >
          <EditorSidebar />
        </div>

        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      {/* Main Content */}
        <div className={`flex-1 overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`} style={{ backgroundColor: 'var(--surface)' }} dir={dir}>
          <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
            {renderViewContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Editor() {
  const { currentProject, createProject, setCurrentProject } = useProject();

  // If user navigates directly without a current project, create a default one
  useEffect(() => {
    if (!currentProject) {
      const project = createProject('romantic', 'My interactive gift');
      setCurrentProject(project);
    }
  }, [currentProject, createProject, setCurrentProject]);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-white dark:bg-[var(--surface)] flex items-center justify-center text-slate-700 dark:text-[var(--text-strong)]">
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <EditorNavigationProvider>
      <EditorContent />
    </EditorNavigationProvider>
  );
}
