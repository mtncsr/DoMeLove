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
      
      case 'screens': {
        // Check gift details (for Main screen)
        const hasRecipient = !!project.data.recipientName;
        const hasSender = !!project.data.senderName;
        const required = templateMeta.globalPlaceholders.filter(p => 
          ['recipientName', 'senderName'].includes(p)
        );
        let giftDetailsComplete = true;
        if (required.length > 0) {
          giftDetailsComplete = required.every(p => {
            if (p === 'recipientName') return hasRecipient;
            if (p === 'senderName') return hasSender;
            return true;
          });
        }

        // Check screen texts
        const screens = templateMeta.screens;
        let hasAnyScreenContent = false;
        let hasAllScreenContent = true;
        for (const screen of screens) {
          const screenData = project.data.screens[screen.screenId];
          const hasTitle = !!screenData?.title;
          const hasText = !!screenData?.text;
          if (hasTitle || hasText) hasAnyScreenContent = true;
          for (const required of screen.required) {
            if (required.includes('title') && !hasTitle) hasAllScreenContent = false;
            if (required.includes('text') && !hasText) hasAllScreenContent = false;
          }
        }

        // Screens step is complete if gift details and all screen content is filled
        if (giftDetailsComplete && hasAllScreenContent) return 'complete';
        // In progress if any part has been started
        if ((hasRecipient || hasSender || hasAnyScreenContent) || project.data.overlay.mainText || project.data.overlay.buttonText) return 'inProgress';
        return 'notStarted';
      }

      case 'content':
        // Content is optional, so always complete
        return 'complete';

      case 'previewExport':
        // Preview & Export is always accessible
        return 'complete';

      default:
        return 'notStarted';
    }
  }, []);

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




