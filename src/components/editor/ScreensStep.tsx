import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { LanguageSelector } from '../ui/LanguageSelector';
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

export function ScreensStep({ templateMeta }: ScreensStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const [activeScreenIndex, setActiveScreenIndex] = useState(0);
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [editingTabValue, setEditingTabValue] = useState('');

  if (!currentProject || !templateMeta) return null;

  const screens = templateMeta.screens.sort((a, b) => a.order - b.order);

  // Generate default screen display names
  const getScreenDisplayName = (screenId: string, index: number): string => {
    const displayNames = currentProject.data.screenDisplayNames || {};
    if (displayNames[screenId]) {
      return displayNames[screenId];
    }
    // Default naming: first screen is "Main", rest are "First", "Second", etc.
    if (index === 0) return 'Main';
    const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
    return ordinals[index - 1] || `Screen ${index + 1}`;
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

  // Get used image IDs
  const getUsedImageIds = (): Set<string> => {
    const usedIds = new Set<string>();
    Object.values(currentProject.data.screens).forEach((screenData) => {
      if (screenData.images) {
        screenData.images.forEach((imageId) => {
          usedIds.add(imageId);
        });
      }
    });
    return usedIds;
  };

  const usedImageIds = getUsedImageIds();

  // Get all available audio files (library + already assigned to other screens)
  const allAvailableAudioFiles: AudioFile[] = [
    ...(currentProject.data.audio.library || []),
    ...Object.values(currentProject.data.audio.screens || {}),
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Screens</h2>

      {/* Screen Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {screens.map((screen, index) => {
            const displayName = getScreenDisplayName(screen.screenId, index);
            const isEditing = editingTabName === screen.screenId;
            
            return (
              <div
                key={screen.screenId}
                className={`px-4 py-2 cursor-pointer border-b-2 transition-colors min-w-[100px] flex items-center gap-2 ${
                  activeScreenIndex === index
                    ? 'border-blue-500 text-blue-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
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
                    className="border border-blue-500 rounded px-1 py-0 text-sm w-full"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span>{displayName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingTab(screen.screenId);
                      }}
                      className="text-gray-400 hover:text-gray-600 text-xs"
                      title="Rename"
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen Editor */}
      {isMainScreen ? (
        <MainScreenEditor
          project={currentProject}
          updateProject={updateProject}
          usedImageIds={usedImageIds}
        />
      ) : (
        <ScreenEditor
          screen={currentScreen}
          project={currentProject}
          updateProject={updateProject}
          usedImageIds={usedImageIds}
          allScreenAudioFiles={allAvailableAudioFiles}
          isLastScreen={activeScreenIndex === screens.length - 1}
        />
      )}
    </div>
  );
}

interface MainScreenEditorProps {
  project: any;
  updateProject: (project: any) => void;
  usedImageIds: Set<string>;
}

function MainScreenEditor({ project, updateProject, usedImageIds }: MainScreenEditorProps) {
  const { t } = useTranslation();

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

  const updateLanguage = (language: string) => {
    updateProject({
      ...project,
      language,
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
      {/* Gift Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Gift Details</h3>
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
          />
          <LanguageSelector
            label={t('editor.giftDetails.language')}
            value={project.language}
            onChange={updateLanguage}
          />
        </div>
      </div>

      {/* Overlay Configuration */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Start Button</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overlay Type
            </label>
            <select
              value={project.data.overlay.type}
              onChange={(e) => updateOverlay('type', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="heart">Heart</option>
              <option value="birthday">Birthday</option>
              <option value="save_the_date">Save the Date</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <Input
            label={t('editor.overlay.buttonText')}
            value={project.data.overlay.buttonText || 'Tap to Begin'}
            onChange={(e) => updateOverlay('buttonText', e.target.value)}
          />
        </div>
      </div>

      {/* Global Music */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Background Music</h3>
        {project.data.audio.global ? (
          <div>
            <p className="text-sm text-gray-600 mb-2">{project.data.audio.global.filename}</p>
            <p className="text-xs text-gray-500 mb-4">{formatFileSize(project.data.audio.global.size)}</p>
            <Button variant="danger" onClick={handleDeleteGlobalAudio}>
              Remove
            </Button>
          </div>
        ) : (
          <div>
            {allAvailableAudioFiles.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">Select from uploaded files:</p>
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
                No music files uploaded. Upload music in the Content tab first.
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
  usedImageIds: Set<string>;
  allScreenAudioFiles: AudioFile[];
  isLastScreen: boolean;
}

function ScreenEditor({ screen, project, updateProject, usedImageIds, allScreenAudioFiles, isLastScreen }: ScreenEditorProps) {
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
    const removedAudio = project.data.audio.screens[screen.screenId];
    const isUsedElsewhere = Object.values(screens).some((a: AudioFile) => a.id === removedAudio?.id) ||
                            (project.data.audio.global?.id === removedAudio?.id);
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

  return (
    <div className="space-y-6">
      {/* Title and Text */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Content</h3>
        <div className="space-y-4">
          <Input
            label="Screen Title"
            value={screenData.title || ''}
            onChange={(e) => updateScreenField('title', e.target.value)}
          />
          <Textarea
            label="Screen Text"
            value={screenData.text || ''}
            onChange={(e) => updateScreenField('text', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {/* Images */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Images</h3>
        <ScreenImageSelector
          allImages={project.data.images}
          selectedImageIds={screenData.images || []}
          usedImageIds={usedImageIds}
          onSelectImage={handleSelectImage}
          onDeselectImage={handleDeselectImage}
          screenImages={screenImages}
        />
        {hasGalleryImages && (
          <div className="mt-4 pt-4 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Layout</label>
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
        <div className="bg-white p-6 rounded-lg border border-gray-200">
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

