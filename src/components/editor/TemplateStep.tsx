import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { ScreenData, CustomScreenConfig, ThemeConfig } from '../../types/project';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PREDEFINED_THEMES, getDefaultTheme } from '../../utils/themes';

const templates = [
  { id: 'romantic', name: 'Romantic / Couple' },
  { id: 'adult-birthday', name: 'Adult Birthday' },
  { id: 'kids-birthday', name: 'Kids Birthday' },
  { id: 'new-baby', name: 'New Baby / Birth' },
  { id: 'bar-mitzvah', name: 'Bar/Bat Mitzvah' },
  { id: 'wedding', name: 'Wedding / Save the Date' },
  { id: 'single-screen', name: 'Single Screen' },
];

const GALLERY_LAYOUTS = [
  { value: 'carousel', label: 'Carousel' },
  { value: 'gridWithZoom', label: 'Grid with Zoom' },
  { value: 'fullscreenSlideshow', label: 'Fullscreen Slideshow' },
  { value: 'heroWithThumbnails', label: 'Hero with Thumbnails' },
  { value: 'timeline', label: 'Timeline' },
];

const SCREEN_TYPES = [
  { value: 'intro', label: 'Introduction' },
  { value: 'text', label: 'Text Only' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'single', label: 'Single Content' },
  { value: 'blessings', label: 'Blessings' },
];

export function TemplateStep() {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);

  if (!currentProject) return null;

  const isCustomTemplate = currentProject.templateId === 'custom' || currentProject.data.customTemplate?.isCustom;
  
  const handleSelectTemplate = (templateId: string) => {
    if (currentProject) {
      if (templateId === 'custom') {
        // Initialize custom template
        updateProject({
          ...currentProject,
          templateId: 'custom',
          data: {
            ...currentProject.data,
            customTemplate: {
              isCustom: true,
              theme: getDefaultTheme(),
              customScreens: [
                {
                  id: 'screen1',
                  type: 'intro',
                  order: 0,
                  supportsMusic: true,
                },
              ],
            },
            screens: {
              screen1: {
                title: '',
                text: '',
                images: [],
              },
            },
          },
        });
        setShowCustomBuilder(true);
      } else {
        // Clear custom template data when selecting a predefined template
        const { customTemplate, ...restData } = currentProject.data;
        updateProject({
          ...currentProject,
          templateId,
          data: restData,
        });
        setShowCustomBuilder(false);
      }
    }
  };

  if (isCustomTemplate && showCustomBuilder) {
    return <CustomTemplateBuilder project={currentProject} onUpdate={updateProject} onBack={() => setShowCustomBuilder(false)} />;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.template.selectTemplate')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
              currentProject.templateId === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          </div>
        ))}
        <div
          className={`p-6 border-2 rounded-lg cursor-pointer transition-colors ${
            isCustomTemplate
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-300'
          }`}
          onClick={() => handleSelectTemplate('custom')}
        >
          <h3 className="text-lg font-semibold text-gray-900">Custom Template</h3>
          <p className="text-sm text-gray-600 mt-2">Design your own template from scratch</p>
        </div>
      </div>
      
      {isCustomTemplate && !showCustomBuilder && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 mb-2">Custom Template is selected</p>
          <Button onClick={() => setShowCustomBuilder(true)} variant="primary">
            Edit Custom Template
          </Button>
        </div>
      )}
    </div>
  );
}

interface CustomTemplateBuilderProps {
  project: any;
  onUpdate: (project: any) => void;
  onBack: () => void;
}

function CustomTemplateBuilder({ project, onUpdate, onBack }: CustomTemplateBuilderProps) {
  const customScreens = project.data.customTemplate?.customScreens || [];
  const theme = project.data.customTemplate?.theme || getDefaultTheme();

  const handleAddScreen = () => {
    const newScreenId = `screen${Date.now()}`;
    const newScreen: CustomScreenConfig = {
      id: newScreenId,
      type: 'text',
      order: customScreens.length,
      supportsMusic: false,
    };

    onUpdate({
      ...project,
      data: {
        ...project.data,
        customTemplate: {
          ...project.data.customTemplate,
          customScreens: [...customScreens, newScreen],
        },
        screens: {
          ...project.data.screens,
          [newScreenId]: {
            title: '',
            text: '',
            images: [],
          },
        },
      },
    });
  };

  const handleRemoveScreen = (screenId: string) => {
    if (customScreens.length <= 1) {
      alert('You must have at least one screen');
      return;
    }

    const newScreens = customScreens.filter((s: CustomScreenConfig) => s.id !== screenId);
    const newScreensData = { ...project.data.screens };
    delete newScreensData[screenId];

    onUpdate({
      ...project,
      data: {
        ...project.data,
        customTemplate: {
          ...project.data.customTemplate,
          customScreens: newScreens,
        },
        screens: newScreensData,
      },
    });
  };

  const handleUpdateScreen = (screenId: string, updates: Partial<CustomScreenConfig>) => {
    const updatedScreens = customScreens.map((s: CustomScreenConfig) =>
      s.id === screenId ? { ...s, ...updates } : s
    );

    onUpdate({
      ...project,
      data: {
        ...project.data,
        customTemplate: {
          ...project.data.customTemplate,
          customScreens: updatedScreens,
        },
      },
    });
  };

  const handleUpdateScreenData = (screenId: string, screenData: Partial<ScreenData>) => {
    onUpdate({
      ...project,
      data: {
        ...project.data,
        screens: {
          ...project.data.screens,
          [screenId]: {
            ...project.data.screens[screenId],
            ...screenData,
          },
        },
      },
    });
  };

  const handleSelectTheme = (themeConfig: ThemeConfig) => {
    onUpdate({
      ...project,
      data: {
        ...project.data,
        customTemplate: {
          ...project.data.customTemplate,
          theme: themeConfig,
        },
      },
    });
  };

  const handleUpdateCustomTheme = (updates: Partial<ThemeConfig>) => {
    const currentTheme = project.data.customTemplate?.theme || getDefaultTheme();
    onUpdate({
      ...project,
      data: {
        ...project.data,
        customTemplate: {
          ...project.data.customTemplate,
          theme: {
            ...currentTheme,
            ...updates,
            type: 'custom',
          },
        },
      },
    });
  };

  const sortedScreens = [...customScreens].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Custom Template Builder</h2>
        <Button onClick={onBack} variant="secondary">
          Back to Templates
        </Button>
      </div>

      {/* Theme Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold mb-4">Theme</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Predefined Themes</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PREDEFINED_THEMES.map((predefinedTheme) => (
              <div
                key={predefinedTheme.name}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  theme.name === predefinedTheme.name && theme.type === 'predefined'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                onClick={() => handleSelectTheme(predefinedTheme)}
              >
                <div className="text-sm font-medium">{predefinedTheme.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Theme</label>
          <div
            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
              theme.type === 'custom'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-300'
            }`}
            onClick={() => handleSelectTheme({ ...getDefaultTheme(), type: 'custom', name: 'Custom' })}
          >
            <div className="text-sm font-medium">Custom Theme</div>
            <p className="text-xs text-gray-600 mt-1">Define your own colors and fonts</p>
          </div>
        </div>

        {theme.type === 'custom' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Custom Theme Settings</h4>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Text Color</label>
                <input
                  type="color"
                  value={theme.colors?.text || '#333333'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, text: e.target.value } })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Background Color</label>
                <input
                  type="color"
                  value={theme.colors?.background || '#ffffff'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, background: e.target.value } })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Accent Color</label>
                <input
                  type="color"
                  value={theme.colors?.accent || '#3b82f6'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, accent: e.target.value } })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Button Color</label>
                <input
                  type="color"
                  value={theme.colors?.button || '#3b82f6'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, button: e.target.value } })}
                  className="w-full h-10 rounded border border-gray-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screens Management */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Screens</h3>
          <Button onClick={handleAddScreen} variant="primary">
            + Add Screen
          </Button>
        </div>

        <div className="space-y-4">
          {sortedScreens.map((screen: CustomScreenConfig, index: number) => (
            <div key={screen.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-600">Screen {index + 1}</span>
                    <select
                      value={screen.type}
                      onChange={(e) => handleUpdateScreen(screen.id, { type: e.target.value as any })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {SCREEN_TYPES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {screen.type === 'gallery' && (
                    <div className="mb-2">
                      <label className="block text-sm text-gray-700 mb-1">Gallery Layout</label>
                      <select
                        value={project.data.screens[screen.id]?.galleryLayout || 'carousel'}
                        onChange={(e) => handleUpdateScreenData(screen.id, { galleryLayout: e.target.value as any })}
                        className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                      >
                        {GALLERY_LAYOUTS.map((layout) => (
                          <option key={layout.value} value={layout.value}>
                            {layout.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={screen.supportsMusic || false}
                        onChange={(e) => handleUpdateScreen(screen.id, { supportsMusic: e.target.checked })}
                        className="rounded"
                      />
                      Supports Music
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {index > 0 && (
                    <button
                      onClick={() => handleUpdateScreen(screen.id, { order: screen.order - 1 })}
                      className="text-gray-600 hover:text-gray-900"
                      title="Move up"
                    >
                      ↑
                    </button>
                  )}
                  {index < sortedScreens.length - 1 && (
                    <button
                      onClick={() => handleUpdateScreen(screen.id, { order: screen.order + 1 })}
                      className="text-gray-600 hover:text-gray-900"
                      title="Move down"
                    >
                      ↓
                    </button>
                  )}
                  {customScreens.length > 1 && (
                    <button
                      onClick={() => handleRemoveScreen(screen.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove screen"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




