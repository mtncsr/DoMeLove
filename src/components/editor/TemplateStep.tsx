import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { ScreenData, CustomScreenConfig, ThemeConfig } from '../../types/project';
import { Button } from '../ui/Button';
import { PREDEFINED_THEMES, getDefaultTheme } from '../../utils/themes';
import { TEMPLATE_CARDS } from '../../data/templates';
import { getTextDirection } from '../../i18n/config';

const getTemplates = (t: (key: string, options?: any) => string) =>
  TEMPLATE_CARDS.map((template) => ({
    id: template.templateId, // actual template id used to load metadata
    displayId: template.id,  // card id for UI selection
    name: t(`marketing.templates.cards.${template.id}.title`, { defaultValue: template.title }),
  }));

export function TemplateStep() {
  const { t, i18n } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  const galleryLayouts = [
    { value: 'carousel', label: t('editor.template.galleryLayouts.carousel') },
    { value: 'gridWithZoom', label: t('editor.template.galleryLayouts.gridWithZoom') },
    { value: 'fullscreenSlideshow', label: t('editor.template.galleryLayouts.fullscreenSlideshow') },
    { value: 'heroWithThumbnails', label: t('editor.template.galleryLayouts.heroWithThumbnails') },
    { value: 'timeline', label: t('editor.template.galleryLayouts.timeline') },
  ];

  const screenTypes = [
    { value: 'intro', label: t('editor.template.screenTypes.intro') },
    { value: 'text', label: t('editor.template.screenTypes.text') },
    { value: 'gallery', label: t('editor.template.screenTypes.gallery') },
    { value: 'single', label: t('editor.template.screenTypes.single') },
    { value: 'blessings', label: t('editor.template.screenTypes.blessings') },
  ];

  if (!currentProject) return null;

  const isCustomTemplate = currentProject.templateId === 'custom' || currentProject.data.customTemplate?.isCustom;
  
  // Resolve which card should appear active. Prefer the stored selection; otherwise fall back
  // to the first card whose template id matches the project's templateId to avoid highlighting multiple cards.
  const templates = getTemplates(t);
  const fallbackSelectedCard = templates.find((t) => t.id === currentProject.templateId)?.displayId;
  const selectedTemplateCardId = currentProject.data.selectedTemplateCardId ?? fallbackSelectedCard;
  
  const handleSelectTemplate = (templateId: string, displayId: string) => {
    if (currentProject) {
      if (templateId === 'custom') {
        // Initialize custom template
        updateProject({
          ...currentProject,
          templateId: 'custom',
          data: {
            ...currentProject.data,
            selectedTemplateCardId: displayId,
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
          data: {
            ...restData,
            selectedTemplateCardId: displayId,
          },
        });
        setShowCustomBuilder(false);
      }
    }
  };

  if (isCustomTemplate && showCustomBuilder) {
    return <CustomTemplateBuilder project={currentProject} onUpdate={updateProject} onBack={() => setShowCustomBuilder(false)} galleryLayouts={galleryLayouts} screenTypes={screenTypes} />;
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <h2 className="text-2xl font-bold text-slate-900">{t('editor.template.selectTemplate')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => {
          const active = selectedTemplateCardId === template.displayId;
          return (
          <div
              key={template.displayId}
              className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[var(--surface-2)] ${
                active
                ? 'border-2 border-fuchsia-500 dark:border-[rgba(255,255,255,0.18)] shadow-xl ring-2 ring-fuchsia-200'
                  : 'border-slate-200 dark:border-[rgba(255,255,255,0.12)] hover:border-fuchsia-200 hover:shadow-md'
            }`}
            onClick={() => handleSelectTemplate(template.id, template.displayId)}
          >
          <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
          </div>
          );
        })}
        <div
          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-[var(--surface-2)] ${
            isCustomTemplate
              ? 'border-fuchsia-300 dark:border-[rgba(255,255,255,0.18)] shadow-lg ring-1 ring-fuchsia-200'
              : 'border-slate-200 dark:border-[rgba(255,255,255,0.12)] hover:border-fuchsia-200 hover:shadow-md'
          }`}
          onClick={() => handleSelectTemplate('custom', 'custom')}
        >
          <h3 className="text-lg font-semibold text-slate-900">{t('editor.template.customTemplate')}</h3>
          <p className="text-sm text-slate-600 mt-2">{t('editor.template.customTemplateDescription')}</p>
        </div>
      </div>
      
      {isCustomTemplate && !showCustomBuilder && (
      <div className="glass rounded-2xl p-4 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)]">
          <p className="text-slate-800 mb-2">{t('editor.template.customTemplateSelected')}</p>
          <Button onClick={() => setShowCustomBuilder(true)} variant="primary">
            {t('editor.template.editCustomTemplate')}
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
  galleryLayouts: { value: string; label: string }[];
  screenTypes: { value: string; label: string }[];
}

function CustomTemplateBuilder({ project, onUpdate, onBack, galleryLayouts, screenTypes }: CustomTemplateBuilderProps) {
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';
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
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-2xl font-bold text-slate-900">{t('editor.template.customBuilderTitle')}</h2>
        <Button onClick={onBack} variant="secondary">
          {t('editor.template.backToTemplates')}
        </Button>
      </div>

      {/* Theme Selection */}
      <div className="glass rounded-2xl p-6 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)] space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">{t('editor.template.customTheme')}</h3>
        
        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">{t('editor.template.predefinedThemes')}</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PREDEFINED_THEMES.map((predefinedTheme) => (
              <div
                key={predefinedTheme.name}
                className={`p-3 rounded-xl cursor-pointer border transition-all ${
                  theme.name === predefinedTheme.name && theme.type === 'predefined'
                    ? 'border-fuchsia-300 bg-fuchsia-50 shadow-md'
                    : 'border-slate-200 bg-white dark:bg-[var(--surface-2)] dark:border-[rgba(255,255,255,0.12)] hover:border-fuchsia-200 hover:shadow-sm'
                }`}
                onClick={() => handleSelectTheme(predefinedTheme)}
              >
                <div className="text-sm font-semibold text-slate-900">{predefinedTheme.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-800 mb-2">{t('editor.template.customTheme')}</label>
          <div
            className={`p-3 rounded-xl cursor-pointer border transition-all ${
              theme.type === 'custom'
                ? 'border-fuchsia-300 bg-fuchsia-50 shadow-md'
                : 'border-slate-200 bg-white dark:bg-[var(--surface-2)] dark:border-[rgba(255,255,255,0.12)] hover:border-fuchsia-200 hover:shadow-sm'
            }`}
            onClick={() => handleSelectTheme({ ...getDefaultTheme(), type: 'custom', name: t('editor.template.customThemeName') })}
          >
            <div className="text-sm font-semibold text-slate-900">{t('editor.template.customTheme')}</div>
            <p className="text-xs text-slate-600 mt-1">{t('editor.template.customThemeDescription')}</p>
          </div>
        </div>

        {theme.type === 'custom' && (
          <div className="mt-2 p-4 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] bg-white/70 dark:bg-[var(--surface-2)]">
            <h4 className="font-semibold text-slate-900 mb-3">{t('editor.template.customThemeSettings')}</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('editor.template.textColor')}</label>
                <input
                  type="color"
                  value={theme.colors?.text || '#333333'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, text: e.target.value } })}
                  className="w-full h-10 rounded border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('editor.template.backgroundColor')}</label>
                <input
                  type="color"
                  value={theme.colors?.background || '#ffffff'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, background: e.target.value } })}
                  className="w-full h-10 rounded border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('editor.template.accentColor')}</label>
                <input
                  type="color"
                  value={theme.colors?.accent || '#a21caf'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, accent: e.target.value } })}
                  className="w-full h-10 rounded border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">{t('editor.template.buttonColor')}</label>
                <input
                  type="color"
                  value={theme.colors?.button || '#e11d8d'}
                  onChange={(e) => handleUpdateCustomTheme({ colors: { ...theme.colors, button: e.target.value } })}
                  className="w-full h-10 rounded border border-slate-200"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screens Management */}
      <div className="glass rounded-2xl p-6 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)] space-y-4">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-lg font-semibold text-slate-900">{t('editor.template.screensTitle')}</h3>
          <Button onClick={handleAddScreen} variant="primary">
            + {t('editor.template.addScreen')}
          </Button>
        </div>

        <div className="space-y-4">
          {sortedScreens.map((screen: CustomScreenConfig, index: number) => (
            <div key={screen.id} className="bg-white/90 dark:bg-[var(--surface-2)] rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] p-4 shadow-sm">
              <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className={`flex items-center gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-slate-700">{t('editor.template.screenLabel', { index: index + 1 })}</span>
                    <select
                      value={screen.type}
                      onChange={(e) => handleUpdateScreen(screen.id, { type: e.target.value as any })}
                      className="text-sm border border-slate-200 rounded px-2 py-1"
                    >
                      {screenTypes.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {screen.type === 'gallery' && (
                    <div className="mb-2">
                      <label className="block text-sm text-slate-700 mb-1">{t('editor.template.galleryLayout')}</label>
                      <select
                        value={project.data.screens[screen.id]?.galleryLayout || 'carousel'}
                        onChange={(e) => handleUpdateScreenData(screen.id, { galleryLayout: e.target.value as any })}
                        className="text-sm border border-slate-200 rounded px-2 py-1 w-full"
                      >
                        {galleryLayouts.map((layout) => (
                          <option key={layout.value} value={layout.value}>
                            {layout.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={screen.supportsMusic || false}
                        onChange={(e) => handleUpdateScreen(screen.id, { supportsMusic: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      {t('editor.template.supportsMusic')}
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-2 text-slate-500">
                  {index > 0 && (
                    <button
                      onClick={() => handleUpdateScreen(screen.id, { order: screen.order - 1 })}
                      className="hover:text-slate-800"
                      title={t('editor.template.moveUp')}
                    >
                      ↑
                    </button>
                  )}
                  {index < sortedScreens.length - 1 && (
                    <button
                      onClick={() => handleUpdateScreen(screen.id, { order: screen.order + 1 })}
                      className="hover:text-slate-800"
                      title={t('editor.template.moveDown')}
                    >
                      ↓
                    </button>
                  )}
                  {customScreens.length > 1 && (
                    <button
                      onClick={() => handleRemoveScreen(screen.id)}
                      className="text-red-500 hover:text-red-700"
                      title={t('editor.template.removeScreen')}
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
