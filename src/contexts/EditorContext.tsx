import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project } from '../types/project';
import type { TemplateMeta } from '../types/template';

export type EditorStep = 'template' | 'giftDetails' | 'screenTexts' | 'images' | 'music' | 'overlay' | 'preview' | 'export';

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

  const calculateStepStatus = useCallback((step: EditorStep, project: Project | null, templateMeta: TemplateMeta | null): StepStatus => {
    if (!project || !templateMeta) return 'notStarted';

    switch (step) {
      case 'template':
        return project.templateId ? 'complete' : 'notStarted';
      
      case 'giftDetails': {
        const hasRecipient = !!project.data.recipientName;
        const hasSender = !!project.data.senderName;
        const required = templateMeta.globalPlaceholders.filter(p => 
          ['recipientName', 'senderName'].includes(p)
        );
        if (required.length === 0) return 'complete';
        const hasAll = required.every(p => {
          if (p === 'recipientName') return hasRecipient;
          if (p === 'senderName') return hasSender;
          return true;
        });
        if (hasAll) return 'complete';
        if (hasRecipient || hasSender) return 'inProgress';
        return 'notStarted';
      }

      case 'screenTexts': {
        const screens = templateMeta.screens;
        let hasAny = false;
        let hasAll = true;
        for (const screen of screens) {
          const screenData = project.data.screens[screen.screenId];
          const hasTitle = !!screenData?.title;
          const hasText = !!screenData?.text;
          if (hasTitle || hasText) hasAny = true;
          for (const required of screen.required) {
            if (required.includes('title') && !hasTitle) hasAll = false;
            if (required.includes('text') && !hasText) hasAll = false;
          }
        }
        if (hasAll) return 'complete';
        if (hasAny) return 'inProgress';
        return 'notStarted';
      }

      case 'images': {
        const hasImages = project.data.images.length > 0;
        const requiredImages = templateMeta.screens
          .filter(s => s.galleryImageCount && s.galleryImageCount > 0)
          .reduce((sum, s) => sum + (s.galleryImageCount || 0), 0);
        if (requiredImages === 0) return 'complete';
        if (project.data.images.length >= requiredImages) return 'complete';
        if (hasImages) return 'inProgress';
        return 'notStarted';
      }

      case 'music':
        // Music is optional, so always complete
        return 'complete';

      case 'overlay':
        return project.data.overlay.mainText || project.data.overlay.subText ? 'complete' : 'inProgress';

      case 'preview':
        // Preview is always accessible
        return 'complete';

      case 'export':
        // Export is always accessible
        return 'complete';

      default:
        return 'notStarted';
    }
  }, []);

  const steps: StepInfo[] = useMemo(() => {
    const stepIds: EditorStep[] = ['template', 'giftDetails', 'screenTexts', 'images', 'music', 'overlay', 'preview', 'export'];
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



