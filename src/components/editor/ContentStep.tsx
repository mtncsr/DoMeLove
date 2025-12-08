import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { ImageData, AudioFile } from '../../types/project';
import { ImageUpload } from '../ui/ImageUpload';
import { AudioUpload } from '../ui/AudioUpload';
import { Button } from '../ui/Button';
import { formatFileSize, getImageSizeKB } from '../../utils/imageProcessor';

export function ContentStep() {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const [activeTab, setActiveTab] = useState<'images' | 'music'>('images');

  if (!currentProject) return null;

  // Get all image IDs that are used in at least one screen (for green checkmarks)
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.content.title')}</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'images'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('editor.content.images')}
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'music'
                ? 'border-blue-500 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('editor.content.music')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'images' ? (
        <ImagesTab
          project={currentProject}
          updateProject={updateProject}
          usedImageIds={usedImageIds}
        />
      ) : (
        <MusicTab
          project={currentProject}
          updateProject={updateProject}
        />
      )}
    </div>
  );
}

interface ImagesTabProps {
  project: any;
  updateProject: (project: any) => void;
  usedImageIds: Set<string>;
}

function ImagesTab({ project, updateProject, usedImageIds }: ImagesTabProps) {
  const { t } = useTranslation();

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
    <div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{t('editor.content.uploadImages')}</h3>
        <ImageUpload
          onUpload={handleImageUpload}
          onMultipleUpload={handleMultipleImageUpload}
          multiple={true}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {t('editor.content.allUploadedImages')} ({project.data.images.length})
        </h3>
        {project.data.images.length === 0 ? (
          <p className="text-gray-500">{t('editor.content.noImagesUploaded')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.data.images.map((image: ImageData) => {
              const isUsed = usedImageIds.has(image.id);
              return (
                <div key={image.id} className="bg-white p-4 rounded-lg border border-gray-200 relative">
                  {isUsed && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 z-10" title={t('editor.content.usedInScreen')}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <img
                    src={image.data}
                    alt={image.filename}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="text-sm text-gray-600 truncate mb-1">{image.filename}</p>
                  <p className="text-xs text-gray-500 mb-2">{formatFileSize(image.size)}</p>
                  {image.width && image.height && (
                    <p className="text-xs text-gray-400 mb-2">
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

  Object.entries(project.data.audio.screens || {}).forEach(([screenId, audio]: [string, AudioFile]) => {
    allAudioFiles.push({
      id: audio.id,
      file: audio,
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
    <div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">{t('editor.content.uploadMusic')}</h3>
        <AudioUpload
          onUpload={handleUploadToLibrary}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          {t('editor.content.allUploadedMusic')} ({allAudioFiles.length})
        </h3>
        {allAudioFiles.length === 0 ? (
          <p className="text-gray-500">{t('editor.content.noMusicUploaded')}</p>
        ) : (
          <div className="space-y-4">
            {allAudioFiles.map(({ id, file, type, screenId }) => (
              <div key={id} className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-blue-600 mt-1">
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
