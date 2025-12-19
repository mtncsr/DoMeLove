import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type EditorView =
  | { type: 'templates-grid' }
  | { type: 'template-details'; templateId: string }
  | { type: 'screens-canvas'; screenId: string }
  | { type: 'contents'; subtab: 'images' | 'music' | 'videos' }
  | { type: 'preview-export' };

interface EditorNavigationContextType {
  currentView: EditorView;
  navigate: (view: EditorView) => void;
  goBack: () => void;
  canGoBack: boolean;
  getViewTitle: () => string;
}

const EditorNavigationContext = createContext<EditorNavigationContextType | undefined>(undefined);

export function EditorNavigationProvider({ children }: { children: ReactNode }) {
  const [viewHistory, setViewHistory] = useState<EditorView[]>([{ type: 'templates-grid' }]);
  const [currentView, setCurrentView] = useState<EditorView>({ type: 'templates-grid' });

  const navigate = useCallback((view: EditorView) => {
    setViewHistory((prev) => [...prev, view]);
    setCurrentView(view);
  }, []);

  const goBack = useCallback(() => {
    if (viewHistory.length > 1) {
      setViewHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove current view
        const previousView = newHistory[newHistory.length - 1];
        setCurrentView(previousView);
        return newHistory;
      });
    }
  }, [viewHistory.length]);

  const canGoBack = viewHistory.length > 1;

  const getViewTitle = useCallback((): string => {
    switch (currentView.type) {
      case 'templates-grid':
        return 'Templates';
      case 'template-details':
        return 'Template Details';
      case 'screens-canvas':
        return 'Edit Screen';
      case 'contents':
        return currentView.subtab === 'images' ? 'Images' : currentView.subtab === 'music' ? 'Music' : 'Videos';
      case 'preview-export':
        return 'Preview & Export';
      default:
        return 'Editor';
    }
  }, [currentView]);

  return (
    <EditorNavigationContext.Provider
      value={{
        currentView,
        navigate,
        goBack,
        canGoBack,
        getViewTitle,
      }}
    >
      {children}
    </EditorNavigationContext.Provider>
  );
}

export function useEditorNavigation() {
  const context = useContext(EditorNavigationContext);
  if (!context) {
    throw new Error('useEditorNavigation must be used within EditorNavigationProvider');
  }
  return context;
}
