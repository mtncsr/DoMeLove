import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { useEditorNavigation } from '../../contexts/EditorNavigationContext';
import { ChevronDown, ChevronRight, LayoutGrid, Layers, Image, Music, Video, Eye } from 'lucide-react';

export function EditorSidebar() {
  const { t } = useTranslation();
  const { currentProject } = useProject();
  const { navigate, currentView } = useEditorNavigation();
  const [expandedSection, setExpandedSection] = useState<string | null>('templates');

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const screens = currentProject?.data.dynamicScreens || [];
  const screenEntries = Object.entries(currentProject?.data.screens || {});

  return (
    <div className="h-full bg-white/80 dark:bg-[rgba(23,16,34,0.85)] backdrop-blur border-r border-slate-200 dark:border-[rgba(255,255,255,0.08)] overflow-y-auto">
      <div className="p-4 space-y-1">
        {/* Templates Section */}
        <div>
          <button
            onClick={() => {
              toggleSection('templates');
              if (expandedSection !== 'templates') {
                navigate({ type: 'templates-grid' });
              }
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Templates</span>
            </div>
            {expandedSection === 'templates' ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {expandedSection === 'templates' && (
            <div className="ml-6 mt-1 space-y-1">
              <button
                onClick={() => navigate({ type: 'templates-grid' })}
                className={`w-full text-left px-3 py-1.5 rounded text-sm ${
                  currentView.type === 'templates-grid'
                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                All Templates
              </button>
            </div>
          )}
        </div>

        {/* Screens Section */}
        <div>
          <button
            onClick={() => toggleSection('screens')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Screens</span>
            </div>
            {expandedSection === 'screens' ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {expandedSection === 'screens' && screens.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {screens.map((screen, index) => {
                const screenData = screenEntries.find(([id]) => id === screen.screenId)?.[1];
                const displayName = currentProject?.data.screenDisplayNames?.[screen.screenId] || `Screen ${index + 1}`;
                return (
                  <button
                    key={screen.screenId}
                    onClick={() => navigate({ type: 'screens-canvas', screenId: screen.screenId })}
                    className={`w-full text-left px-3 py-1.5 rounded text-sm ${
                      currentView.type === 'screens-canvas' && currentView.screenId === screen.screenId
                        ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Contents Section */}
        <div>
          <button
            onClick={() => toggleSection('contents')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Contents</span>
            </div>
            {expandedSection === 'contents' ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500" />
            )}
          </button>
          {expandedSection === 'contents' && (
            <div className="ml-6 mt-1 space-y-1">
              <button
                onClick={() => navigate({ type: 'contents', subtab: 'images' })}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                  currentView.type === 'contents' && currentView.subtab === 'images'
                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Image className="w-3 h-3" />
                Images
              </button>
              <button
                onClick={() => navigate({ type: 'contents', subtab: 'music' })}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                  currentView.type === 'contents' && currentView.subtab === 'music'
                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Music className="w-3 h-3" />
                Music
              </button>
              <button
                onClick={() => navigate({ type: 'contents', subtab: 'videos' })}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                  currentView.type === 'contents' && currentView.subtab === 'videos'
                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Video className="w-3 h-3" />
                Videos
              </button>
            </div>
          )}
        </div>

        {/* Preview & Export Section */}
        <div>
          <button
            onClick={() => navigate({ type: 'preview-export' })}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              currentView.type === 'preview-export' ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30' : ''
            }`}
          >
            <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-medium text-slate-900 dark:text-slate-100">Preview & Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
