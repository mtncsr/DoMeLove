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

    // Effective screens:
    // If the project has screen entries, use ONLY those screens (real state), ordered by dynamicScreens if present for this template, else by template order.
    // Else, fall back to dynamicScreens for this template, else template screens.
    const templateOrdered = tmpl.screens.slice().sort((a, b) => a.order - b.order);
    const dynamicScreens = proj.data.dynamicScreens && proj.data.dynamicScreensTemplateId === tmpl.templateId
      ? proj.data.dynamicScreens.slice().sort((a, b) => a.order - b.order)
      : null;
    const screenEntries = Object.keys(proj.data.screens || {});

    const getMetaForId = (id: string) => {
      if (dynamicScreens) {
        const found = dynamicScreens.find((s) => s.screenId === id);
        if (found) return found;
      }
      return templateOrdered.find((s) => s.screenId === id);
    };

    let screens: typeof templateOrdered;
    if (screenEntries.length > 0) {
      screens = screenEntries
        .map((id) => getMetaForId(id))
        .filter((s): s is typeof templateOrdered[number] => !!s)
        .sort((a, b) => a.order - b.order);
    } else if (dynamicScreens) {
      screens = dynamicScreens;
    } else {
      screens = templateOrdered;
    }

    const overlayOk = !!proj.data.overlay?.type;
    let allScreensHaveContent = true;
    let anyContent = false;

    const hasContent = (screenId: string): boolean => {
      const screenData = proj.data.screens[screenId];
      if (!screenData) return false;
      const mediaMode = screenData.mediaMode || 'classic';
      const hasTitle = !!screenData.title?.trim();
      const hasText = !!screenData.text?.trim();
      const hasImages = mediaMode === 'classic' && Array.isArray(screenData.images) && screenData.images.length > 0;
      const hasVideo = mediaMode === 'video' && !!screenData.videoId;
      return hasTitle || hasText || hasImages || hasVideo;
    };

    for (const screen of screens) {
      const screenHasContent = hasContent(screen.screenId);
      if (screenHasContent) {
        anyContent = true;
      } else {
        allScreensHaveContent = false;
      }
    }

    if (overlayOk && allScreensHaveContent && screens.length > 0) return 'complete';
    if (overlayOk && anyContent) return 'inProgress';
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
