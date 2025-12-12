import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { ScreenImageSelector } from './ScreenImageSelector';
import { ScreenMusicSelector } from './ScreenMusicSelector';
import type { ImageData, AudioFile } from '../../types/project';
import { formatFileSize } from '../../utils/audioProcessor';
import { Button } from '../ui/Button';

const GALLERY_LAYOUTS = [
  { value: 'carousel', label: 'Carousel' },
  { value: 'gridWithZoom', label: 'Grid with Zoom' },
  { value: 'fullscreenSlideshow', label: 'Fullscreen Slideshow' },
  { value: 'heroWithThumbnails', label: 'Hero with Thumbnails' },
  { value: 'timeline', label: 'Timeline' },
];

interface ScreensStepProps {
  templateMeta: TemplateMeta | null;
}

const MAIN_DETAIL_HINTS: Record<string, { heading?: string; subtitle?: string; titlePlaceholder?: string; textPlaceholder?: string }> = {
  romantic: {
    heading: 'Main Screen Details',
    subtitle: 'Set the opener for your couple story (names, date, or special line).',
    titlePlaceholder: 'Our Love Story',
    textPlaceholder: 'A short opener to pull them in...',
  },
  wedding: {
    heading: 'Main Screen Details',
    subtitle: 'Save the date intro — couple names, date, venue.',
    titlePlaceholder: 'Sarah & David — Save the Date',
    textPlaceholder: 'Join us on June 12th at The Garden Venue...',
  },
  'new-baby': {
    heading: 'Main Screen Details',
    subtitle: 'Welcome your little one — name, birth date, sweet note.',
    titlePlaceholder: 'Welcome baby Noah',
    textPlaceholder: 'Born May 4th, 7 lbs 3 oz — we are so in love!',
  },
  'adult-birthday': {
    heading: 'Main Screen Details',
    subtitle: 'Birthday opener — name, age, warm greeting.',
    titlePlaceholder: 'Happy Birthday, Mom!',
    textPlaceholder: 'Celebrating 60 years of magic and love.',
  },
  'kids-birthday': {
    heading: 'Main Screen Details',
    subtitle: 'Fun opener — kid name, age, playful line.',
    titlePlaceholder: 'Ava turns 7!',
    textPlaceholder: 'Join the adventure — balloons, cake, and surprises!',
  },
  'single-screen': {
    heading: 'Main Screen Details',
    subtitle: 'Single screen announcement — headline and body.',
    titlePlaceholder: 'Big Announcement',
    textPlaceholder: 'A concise message with your key details.',
  },
};

const EMOJIS = ['🎉', '💖', '🥳', '🎁', '😊', '🌟', '💍', '👶', '✨', '🎈'];

export function ScreensStep({ templateMeta }: ScreensStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [editingTabValue, setEditingTabValue] = useState('');

  if (!currentProject || !templateMeta) return null;

  const screens = (currentProject.data.dynamicScreens?.length ? currentProject.data.dynamicScreens : templateMeta.screens)
    .slice()
    .sort((a, b) => a.order - b.order);

  const setScreens = (nextScreens: any[]) => {
    // Normalize order
    const normalized = nextScreens.map((s, idx) => ({ ...s, order: idx + 1 }));

    // Remove screen data/audio no longer present
    const validIds = new Set(normalized.map((s) => s.screenId));
    const nextScreenData = Object.fromEntries(
      Object.entries(currentProject.data.screens).filter(([id]) => validIds.has(id))
    );
    const nextAudioScreens = Object.fromEntries(
      Object.entries(currentProject.data.audio.screens || {}).filter(([id]) => validIds.has(id))
    );
    const nextDisplayNames = Object.fromEntries(
      Object.entries(currentProject.data.screenDisplayNames || {}).filter(([id]) => validIds.has(id))
    );

    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        dynamicScreens: normalized,
        dynamicScreensTemplateId: currentProject.templateId,
        screens: nextScreenData,
        audio: {
          ...currentProject.data.audio,
          screens: nextAudioScreens,
        },
        screenDisplayNames: nextDisplayNames,
      },
    });
  };

  const handleAddScreen = () => {
    const newScreenId = `custom-${Date.now()}`;
    const newScreen = {
      screenId: newScreenId,
      type: 'text',
      placeholders: ['title', 'text'],
      required: [],
      order: screens.length + 1,
      supportsMusic: true,
    };
    setScreens([...screens, newScreen]);
  };

  const handleRemoveScreen = (screenId: string) => {
    if (screens.length <= 1) return;
    setScreens(screens.filter((s) => s.screenId !== screenId));
    if (activeScreenIndex >= screens.length - 1) {
      setActiveScreenIndex(Math.max(0, screens.length - 2));
    }
  };

  // Generate default screen display names
  const getScreenDisplayName = (screenId: string, index: number): string => {
    const displayNames = currentProject.data.screenDisplayNames || {};
    if (displayNames[screenId]) {
      return displayNames[screenId];
    }
    // Default naming: first screen is "Main", rest are "First", "Second", etc.
    if (index === 0) return t('editor.screens.defaultNames.main');
    const ordinals = [
      t('editor.screens.defaultNames.first'),
      t('editor.screens.defaultNames.second'),
      t('editor.screens.defaultNames.third'),
      t('editor.screens.defaultNames.fourth'),
      t('editor.screens.defaultNames.fifth'),
      t('editor.screens.defaultNames.sixth'),
      t('editor.screens.defaultNames.seventh'),
      t('editor.screens.defaultNames.eighth'),
      t('editor.screens.defaultNames.ninth'),
      t('editor.screens.defaultNames.tenth')
    ];
    return ordinals[index - 1] || `${t('editor.screens.title')} ${index + 1}`;
  };

  const handleRenameScreen = (screenId: string, newName: string) => {
    const displayNames = currentProject.data.screenDisplayNames || {};
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        screenDisplayNames: {
          ...displayNames,
          [screenId]: newName.trim() || getScreenDisplayName(screenId, screens.findIndex(s => s.screenId === screenId)),
        },
      },
    });
    setEditingTabName(null);
    setEditingTabValue('');
  };

  const startEditingTab = (screenId: string) => {
    setEditingTabName(screenId);
    setEditingTabValue(getScreenDisplayName(screenId, screens.findIndex(s => s.screenId === screenId)));
  };

  const currentScreen = screens[activeScreenIndex];
  const isMainScreen = activeScreenIndex === 0;

  // Get all available audio files (library + already assigned to other screens)
  const allAvailableAudioFiles: AudioFile[] = [
    ...(currentProject.data.audio.library || []),
    ...((Object.values(currentProject.data.audio.screens || {}) as AudioFile[])),
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">{t('editor.screens.title')}</h2>

      {/* Screen Tabs */}
      <div className="border-b border-slate-200 pb-1 flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 overflow-x-auto">
          {screens.map((screen, index) => {
            const displayName = getScreenDisplayName(screen.screenId, index);
            const isEditing = editingTabName === screen.screenId;
            const isFirst = index === 0;
            
            return (
              <div
                key={screen.screenId}
                className={`px-4 py-2 cursor-pointer border-b-2 transition-colors min-w-[130px] flex items-center gap-2 rounded-t ${
                  activeScreenIndex === index
                    ? 'border-fuchsia-500 text-fuchsia-700 font-semibold bg-white dark:bg-[var(--surface-2)]'
                    : 'border-transparent text-slate-600 dark:text-[var(--text-strong)] hover:text-slate-900 dark:hover:text-[var(--text-strong)]'
                }`}
                onClick={() => {
                  setActiveScreenIndex(index);
                  setEditingTabName(null);
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editingTabValue}
                    onChange={(e) => setEditingTabValue(e.target.value)}
                    onBlur={() => handleRenameScreen(screen.screenId, editingTabValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameScreen(screen.screenId, editingTabValue);
                      } else if (e.key === 'Escape') {
                        setEditingTabName(null);
                        setEditingTabValue('');
                      }
                    }}
                    className="border border-fuchsia-400 dark:border-[rgba(255,255,255,0.18)] rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-[var(--surface-2)] dark:text-[var(--text-strong)]"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="dark:text-[var(--text-strong)]">{displayName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTab(screen.screenId);
                      }}
                      className="text-slate-400 hover:text-slate-600 text-xs dark:text-[var(--text-muted)] dark:hover:text-[var(--text-strong)]"
                      title={t('editor.screens.rename')}
                    >
                      ✎
                    </button>
                    {!isFirst && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveScreen(screen.screenId);
                        }}
                        className="text-rose-400 hover:text-rose-600 text-xs"
                        title={t('common.remove')}
                      >
                        ✕
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="secondary" onClick={handleAddScreen} className="ml-auto px-3 py-1.5 text-sm">
          + Add screen
        </Button>
      </div>

      {/* Screen Editor */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)] space-y-4 animate-fade-in">
      {isMainScreen ? (
        <MainScreenEditor
          project={currentProject}
          updateProject={updateProject}
          templateId={currentProject.templateId}
        />
      ) : (
        <ScreenEditor
          screen={currentScreen}
          project={currentProject}
          updateProject={updateProject}
          allScreenAudioFiles={allAvailableAudioFiles}
          isLastScreen={activeScreenIndex === screens.length - 1}
          templateMeta={templateMeta}
        />
      )}
      </div>
    </div>
  );
}

interface MainScreenEditorProps {
  project: any;
  updateProject: (project: any) => void;
  templateId: string;
}

function MainScreenEditor({ project, updateProject, templateId }: MainScreenEditorProps) {
  const { t } = useTranslation();
  const hint = MAIN_DETAIL_HINTS[templateId] || {
    heading: 'Main Screen Details',
    subtitle: 'Set the opener for your gift.',
  };

  // Get all available audio files (library + already assigned to other screens)
  const allAvailableAudioFiles: AudioFile[] = [
    ...(project.data.audio.library || []),
    ...Object.values(project.data.audio.screens || {}),
  ];

  const updateField = (field: string, value: string) => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        [field]: value,
      },
    });
  };

  const updateOverlay = (field: string, value: string | 'heart' | 'birthday' | 'save_the_date' | 'custom') => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        overlay: {
          ...project.data.overlay,
          [field]: value,
        },
      },
    });
  };

  const handleGlobalAudioUpload = (audio: AudioFile) => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          global: audio,
        },
      },
    });
  };

  const handleDeleteGlobalAudio = () => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          global: undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Main Screen Details */}
      <div className="bg-white/90 dark:bg-[var(--surface-2)] p-6 rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{hint.heading}</h3>
            {hint.subtitle && <p className="text-sm text-slate-600">{hint.subtitle}</p>}
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {templateId}
          </span>
        </div>
        <div className="space-y-4">
          <Input
            label={t('editor.giftDetails.recipientName')}
            value={project.data.recipientName || ''}
            onChange={(e) => updateField('recipientName', e.target.value)}
            placeholder={hint.titlePlaceholder}
          />
          <Input
            label={t('editor.giftDetails.senderName')}
            value={project.data.senderName || ''}
            onChange={(e) => updateField('senderName', e.target.value)}
          />
          <Input
            label={t('editor.giftDetails.eventTitle')}
            value={project.data.eventTitle || ''}
            onChange={(e) => updateField('eventTitle', e.target.value)}
            placeholder={hint.titlePlaceholder}
          />
          <Textarea
            label={t('editor.giftDetails.mainGreeting')}
            value={project.data.mainGreeting || ''}
            onChange={(e) => updateField('mainGreeting', e.target.value)}
            rows={4}
            placeholder={hint.textPlaceholder || t('editor.giftDetails.mainGreeting')}
            footer={
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Add emoji:</span>
                <div className="flex gap-1">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                      onClick={() => updateField('mainGreeting', `${project.data.mainGreeting || ''}${emoji}`)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Overlay Configuration */}
      <div className="bg-white/90 dark:bg-[var(--surface-2)] p-6 rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('editor.overlay.startButton')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              {t('editor.overlay.overlayType')}
            </label>
            <select
              value={project.data.overlay.type}
              onChange={(e) => updateOverlay('type', e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
            >
              <option value="heart">{t('editor.overlay.types.heart')}</option>
              <option value="birthday">{t('editor.overlay.types.birthday')}</option>
              <option value="save_the_date">{t('editor.overlay.types.saveTheDate')}</option>
              <option value="custom">{t('editor.overlay.types.custom')}</option>
            </select>
          </div>
          <Input
            label={t('editor.overlay.buttonText')}
            value={project.data.overlay.buttonText || ''}
            onChange={(e) => updateOverlay('buttonText', e.target.value)}
            placeholder={t('editor.overlay.buttonTextPlaceholder') || 'Leave empty for no text (button will pulse)'}
          />
        </div>
      </div>

      {/* Global Music */}
      <div className="bg-white/90 dark:bg-[var(--surface-2)] p-6 rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('editor.screens.backgroundMusic')}</h3>
        {project.data.audio.global ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">{project.data.audio.global.filename}</p>
            <p className="text-xs text-gray-500 mb-4">{formatFileSize(project.data.audio.global.size)}</p>
            <Button variant="danger" onClick={handleDeleteGlobalAudio}>
              {t('editor.screens.remove')}
            </Button>
          </div>
        ) : (
          <div>
            {allAvailableAudioFiles.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">{t('editor.screens.selectFromUploaded')}</p>
                {allAvailableAudioFiles.map((music) => (
                  <div
                    key={music.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                    onClick={() => handleGlobalAudioUpload(music)}
                  >
                    <p className="text-sm font-medium text-gray-900">{music.filename}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(music.size)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t('editor.screens.noMusicUploaded')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ScreenEditorProps {
  screen: any;
  project: any;
  updateProject: (project: any) => void;
  allScreenAudioFiles: AudioFile[];
  isLastScreen: boolean;
  templateMeta: TemplateMeta | null;
}

function ScreenEditor({ screen, project, updateProject, allScreenAudioFiles, isLastScreen, templateMeta }: ScreenEditorProps) {
  const { t } = useTranslation();
  const screenData = project.data.screens[screen.screenId] || {};

  const updateScreenField = (field: string, value: any) => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        screens: {
          ...project.data.screens,
          [screen.screenId]: {
            ...screenData,
            [field]: value,
          },
        },
      },
    });
  };

  const handleSelectImage = (imageId: string) => {
    const currentImages = screenData.images || [];
    if (!currentImages.includes(imageId)) {
      updateScreenField('images', [...currentImages, imageId]);
    }
  };

  const handleDeselectImage = (imageId: string) => {
    const currentImages = screenData.images || [];
    updateScreenField('images', currentImages.filter((id: string) => id !== imageId));
  };

  const handleSelectMusic = (music: AudioFile) => {
    // When selecting music, keep it in library (can be reused)
    // But assign a reference to the screen
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          screens: {
            ...project.data.audio.screens,
            [screen.screenId]: music,
          },
        },
        screens: {
          ...project.data.screens,
          [screen.screenId]: {
            ...screenData,
            audioId: music.id,
          },
        },
      },
    });
  };

  const handleRemoveMusic = () => {
    const screens = { ...project.data.audio.screens };
    delete screens[screen.screenId];
    
    // Check if this audio was only used for this screen, and if it's not in library, add it back
    const removedAudio = project.data.audio.screens[screen.screenId] as AudioFile | undefined;
    const isUsedElsewhere =
      Object.values(screens).some((a) => (a as AudioFile).id === removedAudio?.id) ||
      project.data.audio.global?.id === removedAudio?.id;
    const isInLibrary = (project.data.audio.library || []).some((a: AudioFile) => a.id === removedAudio?.id);
    
    let library = project.data.audio.library || [];
    if (removedAudio && !isUsedElsewhere && !isInLibrary) {
      // Add back to library if it's not used elsewhere and not already in library
      library = [...library, removedAudio];
    }
    
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          library,
          screens,
        },
        screens: {
          ...project.data.screens,
          [screen.screenId]: {
            ...screenData,
            audioId: undefined,
          },
        },
      },
    });
  };

  const handleToggleExtendMusic = () => {
    updateScreenField('extendMusicToNext', !screenData.extendMusicToNext);
  };

  const screenImages = (screenData.images || [])
    .map((id: string) => project.data.images.find((img: ImageData) => img.id === id))
    .filter((img: ImageData | undefined): img is ImageData => img !== undefined);

  const hasGalleryImages = screenImages.length > 0 && (screen.type === 'gallery' || screenData.images?.length > 0);

  const togglePlaceholder = (field: 'title' | 'text') => {
    const placeholders = new Set(screen.placeholders || []);
    if (placeholders.has(field)) {
      placeholders.delete(field);
    } else {
      placeholders.add(field);
    }
    updateProject({
      ...project,
      data: {
        ...project.data,
        dynamicScreens: (project.data.dynamicScreens || []).map((s: any) =>
          s.screenId === screen.screenId ? { ...s, placeholders: Array.from(placeholders) } : s
        ),
      },
    });
  };

  const appendEmoji = (field: 'title' | 'text', emoji: string) => {
    const currentValue = screenData[field] || '';
    updateScreenField(field, `${currentValue}${emoji}`);
  };

  const showTitle = (screen.placeholders || []).includes('title');
  const showText = (screen.placeholders || []).includes('text');

  return (
    <div className="space-y-6">
      {/* Title and Text */}
      <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">{t('editor.screens.content')}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showTitle}
                onChange={() => togglePlaceholder('title')}
                className="accent-fuchsia-500"
              />
              Title field
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showText}
                onChange={() => togglePlaceholder('text')}
                className="accent-fuchsia-500"
              />
              Text field
            </label>
          </div>
        </div>
        <div className="space-y-4">
          {showTitle && (
            <Input
              label={t('editor.screens.screenTitle')}
              value={screenData.title || ''}
              onChange={(e) => updateScreenField('title', e.target.value)}
              footer={
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Add emoji:</span>
                  <div className="flex gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                        onClick={() => appendEmoji('title', emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          )}
          {showText && (
            <Textarea
              label={t('editor.screens.screenText')}
              value={screenData.text || ''}
              onChange={(e) => updateScreenField('text', e.target.value)}
              rows={4}
              footer={
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Add emoji:</span>
                  <div className="flex gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                        onClick={() => appendEmoji('text', emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
        <h3 className="text-lg font-semibold mb-4">{t('editor.screens.images')}</h3>
        <ScreenImageSelector
          allImages={project.data.images}
          selectedImageIds={screenData.images || []}
          onSelectImage={handleSelectImage}
          onDeselectImage={handleDeselectImage}
          screenImages={screenImages}
          project={project}
          templateMeta={templateMeta}
          currentScreenId={screen.screenId}
        />
        {hasGalleryImages && (
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('editor.screens.galleryLayout')}</label>
            <select
              value={screenData.galleryLayout || 'carousel'}
              onChange={(e) => updateScreenField('galleryLayout', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GALLERY_LAYOUTS.map((layout) => (
                <option key={layout.value} value={layout.value}>
                  {layout.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Music */}
      {screen.supportsMusic && (
        <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
          <ScreenMusicSelector
            availableMusic={allScreenAudioFiles}
            selectedMusicId={screenData.audioId}
            onSelectMusic={handleSelectMusic}
            onRemoveMusic={handleRemoveMusic}
            extendMusicToNext={screenData.extendMusicToNext}
            onToggleExtendMusic={handleToggleExtendMusic}
            canExtendMusic={!isLastScreen}
          />
        </div>
      )}
    </div>
  );
}
