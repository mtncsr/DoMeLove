import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { useEditor } from '../../contexts/EditorContext';
import type { ImageData, AudioFile } from '../../types/project';
import type { TemplateMeta } from '../../types/template';
import { ImageUpload } from '../ui/ImageUpload';
import { AudioUpload } from '../ui/AudioUpload';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { formatFileSize } from '../../utils/imageProcessor';

export function ContentStep() {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const { templateMeta } = useEditor();
  const [activeTab, setActiveTab] = useState<'images' | 'music'>('images');
  const cleanupDoneRef = useRef<string>('');

  // Clean up stale image references and screens that don't exist in current template
  useEffect(() => {
    if (!currentProject || !currentProject.data.images) return;

    // Create a unique key for this cleanup check (include template info)
    const imageIdsKey = `${currentProject.id}-${templateMeta?.templateId || 'no-template'}-${currentProject.data.images.map(img => img.id).sort().join(',')}`;
    
    // Skip if we already cleaned up for this set of images and template
    if (cleanupDoneRef.current === imageIdsKey) return;

    const validImageIds = new Set(currentProject.data.images.map(img => img.id));
    
    // Get valid screen IDs from template (only keep screens that exist in current template)
    const validScreenIds = templateMeta ? new Set(templateMeta.screens.map(s => s.screenId)) : new Set<string>();
    
    let hasStaleReferences = false;
    const cleanedScreens: Record<string, any> = {};

    // Check and clean up all screens
    for (const [screenId, screenData] of Object.entries(currentProject.data.screens)) {
      // Remove screens that don't exist in the current template
      if (!validScreenIds.has(screenId)) {
        hasStaleReferences = true;
        // Don't add this screen to cleanedScreens (effectively removes it)
        continue;
      }
      
      if (screenData.images && Array.isArray(screenData.images)) {
        const originalLength = screenData.images.length;
        const cleanedImages = screenData.images.filter((imageId: string) => validImageIds.has(imageId));
        if (cleanedImages.length !== originalLength) {
          hasStaleReferences = true;
          cleanedScreens[screenId] = {
            ...screenData,
            images: cleanedImages,
          };
        }
      }
    }

    // If we found stale references, clean them up
    if (hasStaleReferences) {
      // If we have valid screens to keep, merge them; otherwise only keep cleaned screens
      const finalScreens = validScreenIds.size > 0
        ? Object.fromEntries(
            Object.entries(currentProject.data.screens)
              .filter(([screenId]) => validScreenIds.has(screenId))
              .map(([screenId, screenData]) => [
                screenId,
                cleanedScreens[screenId] || screenData,
              ])
          )
        : cleanedScreens;
      
      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          screens: finalScreens,
        },
      });
    }
    
    // Mark cleanup as done for this set of images and template
    cleanupDoneRef.current = imageIdsKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, templateMeta?.templateId]);

  if (!currentProject) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">{t('editor.content.title')}</h2>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'images'
                ? 'border-fuchsia-500 text-fuchsia-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('editor.content.images')}
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'music'
                ? 'border-fuchsia-500 text-fuchsia-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('editor.content.music')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/60 animate-fade-in">
      {activeTab === 'images' ? (
        <ImagesTab
          project={currentProject}
          updateProject={updateProject}
          templateMeta={templateMeta}
        />
      ) : (
        <MusicTab
          project={currentProject}
          updateProject={updateProject}
        />
      )}
      </div>
    </div>
  );
}

interface ImagesTabProps {
  project: any;
  updateProject: (project: any) => void;
  templateMeta: TemplateMeta | null;
}

function ImagesTab({ project, updateProject, templateMeta }: ImagesTabProps) {
  const { t } = useTranslation();

  // Get which screens an image is assigned to (only if image exists AND screen exists in current template)
  const getScreensForImage = (imageId: string): string[] => {
    const screenIds: string[] = [];
    // First validate that this image ID actually exists in the project
    const validImageIds = new Set(project.data.images.map((img: ImageData) => img.id));
    if (!validImageIds.has(imageId)) {
      return screenIds; // Image doesn't exist, return empty array
    }
    
    // Get valid screen IDs from template (only check screens that exist in current template)
    const validScreenIds = templateMeta ? new Set(templateMeta.screens.map(s => s.screenId)) : new Set<string>();
    
    Object.entries(project.data.screens).forEach(([screenId, screenData]: [string, any]) => {
      // Only check screens that exist in the current template
      if (!validScreenIds.has(screenId)) {
        return;
      }
      
      if (screenData?.images && Array.isArray(screenData.images) && screenData.images.includes(imageId)) {
        screenIds.push(screenId);
      }
    });
    return screenIds;
  };

  // Get display name for a screen
  const getScreenDisplayName = (screenId: string): string => {
    const displayNames = project.data.screenDisplayNames || {};
    if (displayNames[screenId]) {
      return displayNames[screenId];
    }
    // Fallback to screenId if no custom name
    return screenId;
  };

  const handleImageUpload = (image: ImageData) => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        images: [...project.data.images, image],
      },
    });
  };

  const handleMultipleImageUpload = (images: ImageData[]) => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        images: [...project.data.images, ...images],
      },
    });
  };

  const handleDeleteImage = (imageId: string) => {
    updateProject({
      ...project,
      data: {
        ...project.data,
        images: project.data.images.filter((img: ImageData) => img.id !== imageId),
        screens: Object.fromEntries(
          Object.entries(project.data.screens).map(([screenId, screenData]: [string, any]) => [
            screenId,
            {
              ...screenData,
              images: screenData.images?.filter((id: string) => id !== imageId),
            },
          ])
        ),
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">{t('editor.content.uploadImages')}</h3>
        <ImageUpload
          onUpload={handleImageUpload}
          onMultipleUpload={handleMultipleImageUpload}
          multiple={true}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          {t('editor.content.allUploadedImages')} ({project.data.images.length})
        </h3>
        {project.data.images.length === 0 ? (
          <p className="text-slate-500">{t('editor.content.noImagesUploaded')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.data.images.map((image: ImageData) => {
              const assignedScreens = getScreensForImage(image.id);
              // Only show checkmark if image is actually assigned to at least one screen
              const isUsed = assignedScreens.length > 0;
              const tooltipContent = assignedScreens.length > 0 
                ? `Assigned to: ${assignedScreens.map(getScreenDisplayName).join(', ')}`
                : t('editor.content.usedInScreen');
              
              return (
                <div key={image.id} className="bg-white/90 p-4 rounded-xl border border-slate-200 relative shadow-sm">
                  {isUsed && (
                    <Tooltip content={tooltipContent} position="top">
                      <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1.5 z-10 cursor-help shadow">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </Tooltip>
                  )}
                  <img
                    src={image.data}
                    alt={image.filename}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <p className="text-sm text-slate-700 truncate mb-1">{image.filename}</p>
                  <p className="text-xs text-slate-500 mb-2">{formatFileSize(image.size)}</p>
                  {image.width && image.height && (
                    <p className="text-xs text-slate-400 mb-2">
                      {image.width} × {image.height}px
                    </p>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteImage(image.id)}
                    className="w-full text-sm"
                  >
                    {t('editor.images.delete')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface MusicTabProps {
  project: any;
  updateProject: (project: any) => void;
}

function MusicTab({ project, updateProject }: MusicTabProps) {
  const { t } = useTranslation();

  const handleUploadToLibrary = (audio: AudioFile) => {
    const library = project.data.audio.library || [];
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          library: [...library, audio],
        },
      },
    });
  };

  const handleDeleteFromLibrary = (audioId: string) => {
    const library = (project.data.audio.library || []).filter((audio: AudioFile) => audio.id !== audioId);
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          library,
        },
      },
    });
  };

  // Collect all audio files (global + screen audio + library)
  const allAudioFiles: Array<{ id: string; file: AudioFile; type: 'global' | 'screen' | 'library'; screenId?: string }> = [];
  
  if (project.data.audio.global) {
    allAudioFiles.push({
      id: project.data.audio.global.id,
      file: project.data.audio.global,
      type: 'global',
    });
  }

  Object.entries(project.data.audio.screens || {}).forEach(([screenId, audio]) => {
    const audioFile = audio as AudioFile;
    allAudioFiles.push({
      id: audioFile.id,
      file: audioFile,
      type: 'screen',
      screenId,
    });
  });

  (project.data.audio.library || []).forEach((audio: AudioFile) => {
    allAudioFiles.push({
      id: audio.id,
      file: audio,
      type: 'library',
    });
  });

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

  const handleDeleteScreenAudio = (screenId: string) => {
    const screens = { ...project.data.audio.screens };
    delete screens[screenId];
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          screens,
        },
        screens: {
          ...project.data.screens,
          [screenId]: {
            ...project.data.screens[screenId],
            audioId: undefined,
          },
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">{t('editor.content.uploadMusic')}</h3>
        <AudioUpload
          onUpload={handleUploadToLibrary}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          {t('editor.content.allUploadedMusic')} ({allAudioFiles.length})
        </h3>
        {allAudioFiles.length === 0 ? (
          <p className="text-slate-500">{t('editor.content.noMusicUploaded')}</p>
        ) : (
          <div className="space-y-4">
            {allAudioFiles.map(({ id, file, type, screenId }) => (
              <div key={id} className="bg-white/90 p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{file.filename}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-fuchsia-700 mt-1">
                      {type === 'global' 
                        ? t('editor.content.globalPlaysOnStart')
                        : type === 'library'
                        ? t('editor.content.unassignedAssignInScreens')
                        : `${t('editor.content.assignedTo')}: ${screenId}`}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (type === 'global') {
                        handleDeleteGlobalAudio();
                      } else if (type === 'library') {
                        handleDeleteFromLibrary(id);
                      } else if (screenId) {
                        handleDeleteScreenAudio(screenId);
                      }
                    }}
                  >
                    {t('common.remove')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
