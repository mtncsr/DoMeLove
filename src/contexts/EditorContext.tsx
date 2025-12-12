import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project } from '../types/project';
import type { TemplateMeta } from '../types/template';

export type EditorStep = 'template' | 'screens' | 'content' | 'previewExport';

export type StepStatus = 'notStarted' | 'inProgress' | 'complete';

interface StepInfo {
  id: EditorStep;
  status: StepStatus;
}

interface EditorContextType {
  currentStep: EditorStep;
  setCurrentStep: (step: EditorStep) => void;
  steps: StepInfo[];
  getStepStatus: (step: EditorStep) => StepStatus;
  templateMeta: TemplateMeta | null;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ 
  children, 
  project, 
  templateMeta 
}: { 
  children: React.ReactNode;
  project: Project | null;
  templateMeta: TemplateMeta | null;
}) {
  const [currentStep, setCurrentStep] = useState<EditorStep>('template');

  const getScreensStatus = useCallback((proj: Project | null, tmpl: TemplateMeta | null): StepStatus => {
    if (!proj || !tmpl) return 'notStarted';

        // Check gift details (for Main screen)
    const hasRecipient = !!proj.data.recipientName;
    const hasSender = !!proj.data.senderName;
    const required = tmpl.globalPlaceholders.filter((p) => ['recipientName', 'senderName'].includes(p));
        let giftDetailsComplete = true;
        if (required.length > 0) {
      giftDetailsComplete = required.every((p) => {
            if (p === 'recipientName') return hasRecipient;
            if (p === 'senderName') return hasSender;
            return true;
          });
        }

        // Check screen texts and images
    const screens = tmpl.screens;
        let hasAnyScreenContent = false;
        let hasAllScreenContent = true;
        let hasAnyImages = false;
        let hasAllRequiredImages = true;
        
        for (const screen of screens) {
      const screenData = proj.data.screens[screen.screenId];
          const hasTitle = !!screenData?.title;
          const hasText = !!screenData?.text;
          const screenImages = screenData?.images || [];
          const imageCount = screenImages.length;
          
          if (hasTitle || hasText) hasAnyScreenContent = true;
          for (const required of screen.required) {
            if (required.includes('title') && !hasTitle) hasAllScreenContent = false;
            if (required.includes('text') && !hasText) hasAllScreenContent = false;
          }
          
          const requiredImageCount = typeof screen.galleryImageCount === 'number' ? screen.galleryImageCount : 0;
          if (requiredImageCount > 0) {
            if (imageCount > 0) hasAnyImages = true;
            if (imageCount < requiredImageCount) {
              hasAllRequiredImages = false;
            }
          } else if (imageCount > 0) {
            hasAnyImages = true;
          }
        }

        if (giftDetailsComplete && hasAllScreenContent && hasAllRequiredImages) return 'complete';
    if (
      hasRecipient ||
      hasSender ||
      hasAnyScreenContent ||
      hasAnyImages ||
      proj.data.overlay.mainText ||
      proj.data.overlay.buttonText
    )
      return 'inProgress';
    return 'notStarted';
  }, []);

  const calculateStepStatus = useCallback(
    (step: EditorStep, project: Project | null, templateMeta: TemplateMeta | null): StepStatus => {
      if (!project || !templateMeta) return 'notStarted';

      switch (step) {
        case 'template':
          return project.templateId ? 'complete' : 'notStarted';

        case 'screens':
          return getScreensStatus(project, templateMeta);

        case 'content': {
          const hasImages = (project.data.images?.length || 0) > 0;
          const hasLibraryAudio = (project.data.audio.library?.length || 0) > 0;
          const hasScreenAudio = Object.keys(project.data.audio.screens || {}).length > 0;
          const hasGlobalAudio = !!project.data.audio.global;
          if (hasImages || hasLibraryAudio || hasScreenAudio || hasGlobalAudio) return 'complete';
        return 'notStarted';
      }

        case 'previewExport': {
          const screensStatus = getScreensStatus(project, templateMeta);
          if (screensStatus === 'complete') return 'complete';
          if (screensStatus === 'inProgress') return 'inProgress';
          return 'notStarted';
        }

      default:
        return 'notStarted';
    }
    },
    [getScreensStatus]
  );

  const steps: StepInfo[] = useMemo(() => {
    const stepIds: EditorStep[] = ['template', 'screens', 'content', 'previewExport'];
    return stepIds.map(id => ({
      id,
      status: calculateStepStatus(id, project, templateMeta),
    }));
  }, [project, templateMeta, calculateStepStatus]);

  const getStepStatus = useCallback((step: EditorStep): StepStatus => {
    return calculateStepStatus(step, project, templateMeta);
  }, [project, templateMeta, calculateStepStatus]);

  return (
    <EditorContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        steps,
        getStepStatus,
        templateMeta,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
