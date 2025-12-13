import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { EditorProvider, useEditor } from '../contexts/EditorContext';
import { loadTemplateMeta } from '../utils/templateLoader';
import type { TemplateMeta, ScreenConfig } from '../types/template';
import type { Project } from '../types/project';
import { StepIndicator } from '../components/ui/StepIndicator';
import { Button } from '../components/ui/Button';
import { TemplateStep } from '../components/editor/TemplateStep';
import { ScreensStep } from '../components/editor/ScreensStep';
import { ContentStep } from '../components/editor/ContentStep';
import { PreviewExportStep } from '../components/editor/PreviewExportStep';
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
  const { currentProject, updateProject, saveCurrentProject } = useProject();
  const { setAutosaveEnabled } = useAppSettings();
  const { currentStep, setCurrentStep, steps } = useEditor();
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [debugMode, setDebugMode] = useState(false);
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

  // Debug mode toggle (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setDebugMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-700 mb-4">No project selected</p>
          <Button onClick={() => navigate('/')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'template':
        return <TemplateStep />;
      case 'screens':
        return <ScreensStep templateMeta={templateMeta} />;
      case 'content':
        return <ContentStep />;
      case 'previewExport':
        return <PreviewExportStep templateMeta={templateMeta} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-[#0f0a1a] dark:via-[#140a26] dark:to-[#0f0a1a] flex" dir={dir}>
      {/* Sidebar */}
      <div className={`w-64 bg-white/80 dark:bg-[rgba(23,16,34,0.85)] backdrop-blur ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:border-[rgba(255,255,255,0.08)] p-4 overflow-y-auto shadow-md ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="mb-6">
          <div className={`flex items-center gap-2 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-base">
              ✨
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug line-clamp-2">{currentProject.name}</h2>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full rounded-xl px-4 py-2 text-sm font-semibold"
          >
            {isRTL ? `${t('common.back')} ←` : `← ${t('common.back')}`}
          </Button>
        </div>

        <div className="space-y-2">
          {steps.map((step) => (
            <StepIndicator
              key={step.id}
              step={step.id}
              status={step.status}
              isActive={currentStep === step.id}
              onClick={() => setCurrentStep(step.id)}
              label={t(`editor.steps.${step.id}`)}
            />
          ))}
        </div>

        <div className="mt-10">
          <Button
            className="w-full gradient-button text-white px-4 py-3 rounded-2xl text-base shadow-lg hover:shadow-xl"
            onClick={() => {
              saveCurrentProject();
              setAutosaveEnabled(true);
            }}
          >
            {t('editor.sidebar.saveProject')}
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            {t('editor.sidebar.saveProjectDescription')}
          </p>
        </div>

        {debugMode && (
          <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold mb-2 text-slate-900">Debug Mode</h3>
            <pre className="text-xs overflow-auto max-h-96 text-slate-700">
              {JSON.stringify(currentProject, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`flex-1 p-6 sm:p-8 overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`} style={{ backgroundColor: 'var(--surface)' }} dir={dir}>
        <div className="max-w-5xl mx-auto glass rounded-2xl p-4 sm:p-6 md:p-8 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)] shadow-xl">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

export function Editor() {
  const { currentProject, createProject, setCurrentProject } = useProject();
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);

  // If user navigates directly without a current project, create a default one
  useEffect(() => {
    if (!currentProject) {
      const project = createProject('romantic', 'My interactive gift');
      setCurrentProject(project);
    }
  }, [currentProject, createProject, setCurrentProject]);

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

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-white dark:bg-[var(--surface)] flex items-center justify-center text-slate-700 dark:text-[var(--text-strong)]">
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <EditorProvider project={currentProject} templateMeta={templateMeta}>
      <EditorContent />
    </EditorProvider>
  );
}
