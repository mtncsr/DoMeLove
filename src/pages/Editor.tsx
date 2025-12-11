import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentProject, updateProject } = useProject();
  const { currentStep, setCurrentStep, steps } = useEditor();
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);
  const [debugMode, setDebugMode] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur border-r border-slate-200 p-4 overflow-y-auto shadow-md">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
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
            ← {t('common.back')}
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
      <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto glass rounded-2xl p-4 sm:p-6 md:p-8 border border-white/60 shadow-xl">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

export function Editor() {
  const { currentProject } = useProject();
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null);

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
    return null;
  }

  return (
    <EditorProvider project={currentProject} templateMeta={templateMeta}>
      <EditorContent />
    </EditorProvider>
  );
}
