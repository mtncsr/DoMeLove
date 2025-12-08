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

        // Check screen texts and images
        const screens = templateMeta.screens;
        let hasAnyScreenContent = false;
        let hasAllScreenContent = true;
        let hasAnyImages = false;
        let hasAllRequiredImages = true;
        
        for (const screen of screens) {
          const screenData = project.data.screens[screen.screenId];
          const hasTitle = !!screenData?.title;
          const hasText = !!screenData?.text;
          const screenImages = screenData?.images || [];
          const imageCount = screenImages.length;
          
          // Check text content
          if (hasTitle || hasText) hasAnyScreenContent = true;
          for (const required of screen.required) {
            if (required.includes('title') && !hasTitle) hasAllScreenContent = false;
            if (required.includes('text') && !hasText) hasAllScreenContent = false;
          }
          
          // Check images for screens that require them
          // galleryImageCount is the minimum number of images required for this screen
          const requiredImageCount = typeof screen.galleryImageCount === 'number' ? screen.galleryImageCount : 0;
          if (requiredImageCount > 0) {
            if (imageCount > 0) hasAnyImages = true;
            // If this screen requires images but doesn't have enough, mark as incomplete
            if (imageCount < requiredImageCount) {
              hasAllRequiredImages = false;
            }
          } else if (imageCount > 0) {
            // Even if not required, if images are assigned, mark as having images
            hasAnyImages = true;
          }
        }

        // Screens step is complete ONLY if:
        // 1. Gift details are complete (if required)
        // 2. All required screen texts are filled
        // 3. All screens that require images have the required number of images
        if (giftDetailsComplete && hasAllScreenContent && hasAllRequiredImages) return 'complete';
        // In progress if any part has been started (texts, images, or overlay)
        if ((hasRecipient || hasSender || hasAnyScreenContent || hasAnyImages) || project.data.overlay.mainText || project.data.overlay.buttonText) return 'inProgress';
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
