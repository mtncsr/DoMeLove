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
import { GiftDetailsStep } from '../components/editor/GiftDetailsStep';
import { ScreenTextsStep } from '../components/editor/ScreenTextsStep';
import { ImagesStep } from '../components/editor/ImagesStep';
import { MusicStep } from '../components/editor/MusicStep';
import { OverlayStep } from '../components/editor/OverlayStep';
import { PreviewStep } from '../components/editor/PreviewStep';
import { ExportStep } from '../components/editor/ExportStep';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No project selected</p>
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
      case 'giftDetails':
        return <GiftDetailsStep />;
      case 'screenTexts':
        return <ScreenTextsStep templateMeta={templateMeta} />;
      case 'images':
        return <ImagesStep templateMeta={templateMeta} />;
      case 'music':
        return <MusicStep templateMeta={templateMeta} />;
      case 'overlay':
        return <OverlayStep />;
      case 'preview':
        return <PreviewStep templateMeta={templateMeta} />;
      case 'export':
        return <ExportStep templateMeta={templateMeta} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{currentProject.name}</h2>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full"
          >
            {t('common.back')}
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
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Debug Mode</h3>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(currentProject, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}

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

