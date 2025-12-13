import { useState, useEffect } from 'react';
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
import { ScreenVideoSelector } from './ScreenVideoSelector';
import { ScreenPreview } from './ScreenPreview';
import { getTextDirection } from '../../i18n/config';

// GALLERY_LAYOUTS moved to use translations in TemplateStep

interface ScreensStepProps {
  templateMeta: TemplateMeta | null;
}

// Main detail hints are now handled via translations in editor.screens.mainScreenDetails

// Comprehensive emoji list organized by category
const EMOJIS = {
  celebration: ['🎉', '🥳', '🎊', '🎈', '🎁', '🎂', '🎆', '✨', '🌟', '⭐'],
  love: ['💖', '❤️', '💕', '💘', '💑', '💍', '💒', '💑', '👩‍❤️‍👨', '👨‍❤️‍👨', '👩‍❤️‍👩'],
  family: ['👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👨‍👧‍👦', '👩‍👩‍👧‍👦', '👶', '👨‍👩‍👧‍👧', '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧‍👦'],
  events: ['🎂', '🎓', '👶', '💒', '💍', '🕎', '✝️', '☪️', '🕉️', '☸️'],
  emotions: ['😊', '😍', '🥰', '😘', '😉', '🙂', '😇', '🤗', '🤩', '🥳'],
  nature: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍀', '🌈', '⭐', '🌙'],
  food: ['🍰', '🎂', '🍭', '🍬', '🍫', '🍪', '🍩', '🧁', '🍦', '🍭'],
  symbols: ['💫', '✨', '⭐', '🌟', '💎', '💍', '👑', '🦄', '🦋', '🌈'],
  objects: ['🎁', '🎈', '🎪', '🎭', '🎨', '🎺', '🎸', '🎹', '🎤', '🎧'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯']
};

// Flatten for quick access
const ALL_EMOJIS = Object.values(EMOJIS).flat();

export function ScreensStep({ templateMeta }: ScreensStepProps) {
  const { t, i18n } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [editingTabValue, setEditingTabValue] = useState('');
  const [openEmojiDropdown, setOpenEmojiDropdown] = useState<'title' | 'text' | 'custom' | null>(null);
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

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

  const toggleEmojiDropdown = (field: 'title' | 'text' | 'custom') => {
    setOpenEmojiDropdown(openEmojiDropdown === field ? null : field);
  };

  // Close emoji dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.emoji-dropdown') && !target.closest('[data-emoji-trigger]')) {
        setOpenEmojiDropdown(null);
      }
    };

    if (openEmojiDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openEmojiDropdown]);

  const currentScreen = screens[activeScreenIndex];
  const isMainScreen = activeScreenIndex === 0;

  // Get all available audio files (library + already assigned to other screens)
  const allAvailableAudioFiles: AudioFile[] = [
    ...(currentProject.data.audio.library || []),
    ...((Object.values(currentProject.data.audio.screens || {}) as AudioFile[])),
  ];

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <h2 className="text-2xl font-bold text-slate-900">{t('editor.screens.title')}</h2>

      {/* Screen Tabs */}
      <div className={`border-b border-slate-200 pb-1 flex items-center gap-2 flex-wrap ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex gap-1 overflow-x-auto ${isRTL ? 'flex-row-reverse' : ''}`}>
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
        <Button variant="secondary" onClick={handleAddScreen} className={`${isRTL ? 'mr-auto' : 'ml-auto'} px-3 py-1.5 text-sm`}>
          + {t('editor.screens.addScreen')}
        </Button>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Live Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Live Preview</h3>
          <div className="glass rounded-2xl p-4 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)]">
            {isMainScreen ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">🏠</div>
                <div className="text-lg">Main Screen Preview</div>
                <div className="text-sm mt-2">Configure overlay and global settings in the right panel</div>
              </div>
            ) : (
              <ScreenPreview
                screen={currentScreen}
                project={currentProject}
                templateMeta={templateMeta}
              />
            )}
          </div>
        </div>

        {/* Right Panel: Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            {isMainScreen ? 'Main Screen Settings' : 'Screen Content'}
          </h3>
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
                openEmojiDropdown={openEmojiDropdown}
                toggleEmojiDropdown={toggleEmojiDropdown}
                setOpenEmojiDropdown={setOpenEmojiDropdown}
              />
            )}
          </div>
        </div>
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
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

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

  const updateOverlay = (field: string, value: any) => {
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

  // Set default button style if not set
  useEffect(() => {
    if (!project.data.overlay.buttonStyle) {
      updateOverlay('buttonStyle', 'text-framed');
      if (!project.data.overlay.textButton) {
        updateOverlay('textButton', { text: 'Start Experience', frameStyle: 'solid' });
      }
    }
  }, [project.data.overlay.buttonStyle]);

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
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      {/* Main Screen Details */}
      <div className="bg-white/90 dark:bg-[var(--surface-2)] p-6 rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] shadow-sm">
        <div className={`flex items-start justify-between gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t('editor.screens.mainScreenDetails')}</h3>
            <p className="text-sm text-slate-600">{t('editor.screens.mainScreenDetailsSubtitle')}</p>
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
          />
          <Textarea
            label={t('editor.giftDetails.mainGreeting')}
            value={project.data.mainGreeting || ''}
            onChange={(e) => updateField('mainGreeting', e.target.value)}
            rows={4}
            placeholder={t('editor.giftDetails.mainGreeting')}
            footer={
              <div className={`flex items-center gap-2 text-xs text-slate-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <span>{t('editor.screens.addEmoji')}</span>
                <div className="flex gap-1">
                  {ALL_EMOJIS.slice(0, 10).map((emoji) => (
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
          {/* Button Style Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-3">
              Button Style
            </label>
            <div className={`flex gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="radio"
                  name="buttonStyle"
                  value="emoji-animated"
                  checked={project.data.overlay.buttonStyle === 'emoji-animated'}
                  onChange={(e) => updateOverlay('buttonStyle', e.target.value)}
                  className="accent-fuchsia-500"
                />
                Animated Emoji Button
              </label>
              <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="radio"
                  name="buttonStyle"
                  value="text-framed"
                  checked={project.data.overlay.buttonStyle === 'text-framed'}
                  onChange={(e) => updateOverlay('buttonStyle', e.target.value)}
                  className="accent-fuchsia-500"
                />
                Text Button with Frame
              </label>
            </div>
          </div>

          {/* Emoji Button Controls */}
          {project.data.overlay.buttonStyle === 'emoji-animated' && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Emoji Button Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Emoji</label>
                  <input
                    type="text"
                    value={project.data.overlay.emojiButton?.emoji || '🎉'}
                    onChange={(e) => updateOverlay('emojiButton', {
                      ...project.data.overlay.emojiButton,
                      emoji: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Size</label>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    value={project.data.overlay.emojiButton?.size || 48}
                    onChange={(e) => updateOverlay('emojiButton', {
                      ...project.data.overlay.emojiButton,
                      size: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <span className="text-xs text-slate-500">{project.data.overlay.emojiButton?.size || 48}px</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Animation</label>
                <select
                  value={project.data.overlay.emojiButton?.animation || 'pulse'}
                  onChange={(e) => updateOverlay('emojiButton', {
                    ...project.data.overlay.emojiButton,
                    animation: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                >
                  <option value="pulse">Pulse</option>
                  <option value="bounce">Bounce</option>
                  <option value="rotate">Rotate</option>
                  <option value="scale">Scale</option>
                </select>
              </div>
            </div>
          )}

          {/* Text Button Controls */}
          {project.data.overlay.buttonStyle === 'text-framed' && (
            <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">Text Button Settings</h4>
              <Input
                label="Button Text"
                value={project.data.overlay.textButton?.text || 'Start Experience'}
                onChange={(e) => updateOverlay('textButton', {
                  ...project.data.overlay.textButton,
                  text: e.target.value
                })}
                placeholder="Enter button text"
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Frame Style</label>
                <select
                  value={project.data.overlay.textButton?.frameStyle || 'solid'}
                  onChange={(e) => updateOverlay('textButton', {
                    ...project.data.overlay.textButton,
                    frameStyle: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                >
                  <option value="solid">Solid Border</option>
                  <option value="dashed">Dashed Border</option>
                  <option value="double">Double Border</option>
                  <option value="shadow">Shadow Border</option>
                  <option value="gradient">Gradient Border</option>
                  <option value="heart">Heart Frame</option>
                  <option value="star">Star Frame</option>
                  <option value="circle">Circle Frame</option>
                  <option value="oval">Oval Frame</option>
                  <option value="rectangle">Rectangle Frame</option>
                  <option value="square">Square Frame</option>
                </select>
              </div>
            </div>
          )}
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
  openEmojiDropdown: 'title' | 'text' | 'custom' | null;
  toggleEmojiDropdown: (field: 'title' | 'text' | 'custom') => void;
  setOpenEmojiDropdown: (value: 'title' | 'text' | 'custom' | null) => void;
}

function ScreenEditor({ screen, project, updateProject, allScreenAudioFiles, isLastScreen, templateMeta, openEmojiDropdown, toggleEmojiDropdown, setOpenEmojiDropdown }: ScreenEditorProps) {
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';
  const screenData = project.data.screens[screen.screenId] || {};
  const mediaMode: 'classic' | 'video' = screenData.mediaMode || 'classic';
  const isVideoMode = mediaMode === 'video';

  const updateScreenField = (field: string, value: any) => {
    // Always use the latest screenData from project, not from closure
    const latestScreenData = project.data.screens[screen.screenId] || {};
    updateProject({
      ...project,
      data: {
        ...project.data,
        screens: {
          ...project.data.screens,
          [screen.screenId]: {
            ...latestScreenData,
            [field]: value,
          },
        },
      },
    });
  };

  const setMediaMode = (mode: 'classic' | 'video') => {
    if (mode === 'video') {
      updateProject({
        ...project,
        data: {
          ...project.data,
          screens: {
            ...project.data.screens,
            [screen.screenId]: {
              ...screenData,
              mediaMode: 'video',
              images: [],
              audioId: undefined,
              extendMusicToNext: undefined,
              galleryLayout: undefined,
            },
          },
        },
      });
    } else {
      updateProject({
        ...project,
        data: {
          ...project.data,
          screens: {
            ...project.data.screens,
            [screen.screenId]: {
              ...screenData,
              mediaMode: 'classic',
              videoId: undefined,
            },
          },
        },
      });
    }
  };

  const handleSelectImage = (imageId: string) => {
    if (isVideoMode) return;
    // Use latest screenData from project, not closure
    const latestScreenData = project.data.screens[screen.screenId] || {};
    const currentImages = latestScreenData.images || [];
    if (!currentImages.includes(imageId)) {
      updateScreenField('images', [...currentImages, imageId]);
    }
  };

  const handleDeselectImage = (imageId: string) => {
    if (isVideoMode) return;
    // Use latest screenData from project, not closure
    const latestScreenData = project.data.screens[screen.screenId] || {};
    const currentImages = latestScreenData.images || [];
    updateScreenField('images', currentImages.filter((id: string) => id !== imageId));
  };

  const handleSelectMusic = (music: AudioFile) => {
    if (isVideoMode) return;
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

  const hasGalleryImages = !isVideoMode && screenImages.length > 0 && (screen.type === 'gallery' || screenData.images?.length > 0);

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
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      {/* Media mode selector */}
      <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-lg font-semibold">{t('editor.screens.screenType')}</h3>
          <span className="text-xs text-slate-500">{t('editor.screens.screenTypeDescription')}</span>
        </div>
        <div className={`flex flex-wrap gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
            <input
              type="radio"
              name={`mediaMode-${screen.screenId}`}
              checked={!isVideoMode}
              onChange={() => setMediaMode('classic')}
              className="accent-fuchsia-500"
            />
            {t('editor.screens.classicMode')}
          </label>
          <label className={`flex items-center gap-2 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
            <input
              type="radio"
              name={`mediaMode-${screen.screenId}`}
              checked={isVideoMode}
              onChange={() => setMediaMode('video')}
              className="accent-fuchsia-500"
            />
            {t('editor.screens.videoMode')}
          </label>
        </div>
        {isVideoMode && (
          <p className="text-xs text-amber-600 mt-2">
            {t('editor.screens.videoModeWarning')}
          </p>
        )}
      </div>

      {/* Title and Text */}
      <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
        <div className={`flex items-center justify-between gap-3 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h3 className="text-lg font-semibold">{t('editor.screens.content')}</h3>
          <div className={`flex items-center gap-2 text-xs text-slate-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <label className={`flex items-center gap-1 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                checked={showTitle}
                onChange={() => togglePlaceholder('title')}
                className="accent-fuchsia-500"
              />
              {t('editor.screens.titleField')}
            </label>
            <label className={`flex items-center gap-1 cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                checked={showText}
                onChange={() => togglePlaceholder('text')}
                className="accent-fuchsia-500"
              />
              {t('editor.screens.textField')}
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
                <div className="relative">
                  <button
                    type="button"
                    data-emoji-trigger
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded"
                    onClick={() => toggleEmojiDropdown('title')}
                  >
                    <span>Add emoji</span>
                    <svg className={`w-3 h-3 transition-transform ${openEmojiDropdown === 'title' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openEmojiDropdown === 'title' && (
                    <div className="emoji-dropdown absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-10 min-w-[300px]">
                      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {ALL_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded"
                            onClick={() => {
                              appendEmoji('title', emoji);
                              setOpenEmojiDropdown(null);
                            }}
                            title={`Add ${emoji} to title`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <input
                          type="text"
                          placeholder="Custom emoji..."
                          maxLength={2}
                          onChange={(e) => {
                            if (e.target.value) {
                              appendEmoji('title', e.target.value);
                              e.target.value = '';
                              setOpenEmojiDropdown(null);
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                        />
                      </div>
                    </div>
                  )}
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
                <div className="relative">
                  <button
                    type="button"
                    data-emoji-trigger
                    className={`flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded ${isRTL ? 'flex-row-reverse' : ''}`}
                    onClick={() => toggleEmojiDropdown('text')}
                  >
                    <span>{t('editor.screens.addEmoji')}</span>
                    <svg className={`w-3 h-3 transition-transform ${openEmojiDropdown === 'text' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openEmojiDropdown === 'text' && (
                    <div className={`emoji-dropdown absolute bottom-full ${isRTL ? 'right-0' : 'left-0'} mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-10 min-w-[300px]`}>
                      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {ALL_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded"
                            onClick={() => {
                              appendEmoji('text', emoji);
                              setOpenEmojiDropdown(null);
                            }}
                            title={`Add ${emoji} to text`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <input
                          type="text"
                          placeholder="Custom emoji..."
                          maxLength={2}
                          onChange={(e) => {
                            if (e.target.value) {
                              appendEmoji('text', e.target.value);
                              e.target.value = '';
                              setOpenEmojiDropdown(null);
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Images */}
      {!isVideoMode && (
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
                <option value="carousel">{t('editor.template.galleryLayouts.carousel')}</option>
                <option value="gridWithZoom">{t('editor.template.galleryLayouts.gridWithZoom')}</option>
                <option value="fullscreenSlideshow">{t('editor.template.galleryLayouts.fullscreenSlideshow')}</option>
                <option value="heroWithThumbnails">{t('editor.template.galleryLayouts.heroWithThumbnails')}</option>
                <option value="timeline">{t('editor.template.galleryLayouts.timeline')}</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Video */}
      {isVideoMode && (
        <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
          <h3 className="text-lg font-semibold mb-4">{t('editor.screens.video')}</h3>
          <ScreenVideoSelector
            videos={project.data.videos || []}
            selectedVideoId={screenData.videoId}
            onSelectVideo={(videoId) => updateScreenField('videoId', videoId)}
            onClearVideo={() => updateScreenField('videoId', undefined)}
            project={project}
            templateMeta={templateMeta}
            currentScreenId={screen.screenId}
          />
        </div>
      )}

      {/* Music */}
      {screen.supportsMusic && !isVideoMode && (
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

      {/* Screen Customization */}
      <div className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
        <h3 className="text-lg font-semibold mb-4">Screen Customization</h3>
        <div className="space-y-6">

          {/* Background Customization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
            <div className="space-y-2">
              <select
                value={screenData.customBackground || 'template'}
                onChange={(e) => updateScreenField('customBackground', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="template">Use Template Default</option>
                <option value="custom">Custom Background</option>
              </select>

              {screenData.customBackground === 'custom' && (
                <div className="space-y-2">
                  <input
                    type="color"
                    value={screenData.backgroundColor || '#ffffff'}
                    onChange={(e) => updateScreenField('backgroundColor', e.target.value)}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                    title="Background Color"
                  />
                  <textarea
                    placeholder="CSS background (e.g., linear-gradient(45deg, #ff9a9e, #fecfef))"
                    value={screenData.backgroundGradient || ''}
                    onChange={(e) => updateScreenField('backgroundGradient', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text Style Customization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Text Styling</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Title Color</label>
                <input
                  type="color"
                  value={screenData.titleColor || '#000000'}
                  onChange={(e) => updateScreenField('titleColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Text Color</label>
                <input
                  type="color"
                  value={screenData.textColor || '#374151'}
                  onChange={(e) => updateScreenField('textColor', e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-xs text-gray-600 mb-1">Title Font Size</label>
              <select
                value={screenData.titleSize || 'text-3xl'}
                onChange={(e) => updateScreenField('titleSize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="text-xl">Small</option>
                <option value="text-2xl">Medium</option>
                <option value="text-3xl">Large</option>
                <option value="text-4xl">Extra Large</option>
                <option value="text-5xl">Huge</option>
              </select>
            </div>
          </div>

          {/* Emoji Customization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Emojis</label>
            <div className="relative">
              <button
                type="button"
                data-emoji-trigger
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                onClick={() => toggleEmojiDropdown('custom')}
              >
                <span>Choose emoji</span>
                <svg className={`w-4 h-4 transition-transform ${openEmojiDropdown === 'custom' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openEmojiDropdown === 'custom' && (
                <div className="emoji-dropdown absolute bottom-full left-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg p-3 z-10 min-w-[320px]">
                  <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                    {ALL_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded"
                        onClick={() => {
                          const currentTitle = screenData.title || '';
                          updateScreenField('title', currentTitle + emoji);
                          setOpenEmojiDropdown(null);
                        }}
                        title={`Add ${emoji} to title`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Custom emoji..."
                      maxLength={2}
                      onChange={(e) => {
                        if (e.target.value) {
                          const currentTitle = screenData.title || '';
                          updateScreenField('title', currentTitle + e.target.value);
                          e.target.value = '';
                          setOpenEmojiDropdown(null);
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
