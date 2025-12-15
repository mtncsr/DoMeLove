import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import { useEditor } from '../../contexts/EditorContext';
import type { ImageData, AudioFile, VideoData, Project } from '../../types/project';
import type { TemplateMeta } from '../../types/template';
import type { ProcessedImage } from '../../utils/imageProcessor';
import type { ProcessedAudio } from '../../utils/audioProcessor';
import { ImageUpload } from '../ui/ImageUpload';
import { AudioUpload } from '../ui/AudioUpload';
import { VideoUpload } from '../ui/VideoUpload';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { formatFileSize } from '../../utils/imageProcessor';
import { saveVideoBlob, deleteVideoBlob, hasVideoBlob } from '../../services/videoBlobStore';
import { saveProcessedImage, saveProcessedAudio, deleteMediaWithPreview, getMediaPreviewUrl, hasMedia } from '../../services/mediaService';
import { getTextDirection } from '../../i18n/config';
import { getExportScreens } from '../../utils/screenSource';

// Simple image thumbnail component using preview URL
const ImageThumb = ({ projectId, image }: { projectId: string; image: ImageData }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMediaPreviewUrl(projectId, image.id).then((previewUrl) => {
      if (!cancelled) {
        setUrl(previewUrl);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, image.id]);

  if (loading) {
    return (
      <div className="w-full h-32 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <img
      src={url || ''}
      alt={image.filename}
      className="w-full h-32 object-cover rounded-lg mb-2"
    />
  );
};

export function ContentStep() {
  const { t, i18n } = useTranslation();
  const { currentProject, updateProject } = useProject();
  const { templateMeta } = useEditor();

  const [activeTab, setActiveTab] = useState<'images' | 'music' | 'videos'>('images');
  const [missingVideoBlobs, setMissingVideoBlobs] = useState<Record<string, boolean>>({});
  const [missingImageBlobs, setMissingImageBlobs] = useState<Record<string, boolean>>({});
  const [missingAudioBlobs, setMissingAudioBlobs] = useState<Record<string, boolean>>({});
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';

  // Check missing media (images and audio)
  async function checkMissingMediaFunction() {
    if (!currentProject) return;

    // Always check images (all in library, since they can be assigned)
    // This works even if templateMeta is not yet available
    const imageEntries = await Promise.all(
      currentProject.data.images.map(async (img) => {
        const exists = await hasMedia(currentProject.id, img.id);
        return [img.id, !exists] as const;
      })
    );
    setMissingImageBlobs(Object.fromEntries(imageEntries));

    // Check global audio (works without templateMeta)
    const audioIds = new Set<string>();
    if (currentProject.data.audio.global) {
      audioIds.add(currentProject.data.audio.global.id);
    }

    // Check per-screen audio ONLY if templateMeta is available
    // LIMIT to exported screens only (screens returned by getExportScreens)
    // This prevents incorrectly marking audio as "missing" for unused/inactive screens
    if (templateMeta) {
      const exportScreens = getExportScreens(currentProject, templateMeta);
      // Collect screen-assigned audio IDs only for screens in exportScreens
      // Use audio.screens[screenId]?.id as source of truth
      for (const screen of exportScreens) {
        const audio = currentProject.data.audio.screens[screen.screenId];
        if (audio?.id) {
          audioIds.add(audio.id);
        }
      }
    }

    const audioEntries = await Promise.all(
      Array.from(audioIds).map(async (id) => {
        const exists = await hasMedia(currentProject.id, id);
        return [id, !exists] as const;
      })
    );
    setMissingAudioBlobs(Object.fromEntries(audioEntries));
  }

  if (!currentProject) return null;

  // Cleanup temporarily disabled to avoid interfering with image assignments during navigation
  useEffect(() => {
    return;
  }, [currentProject?.id, templateMeta?.templateId]);

  // Detect missing video blobs for the current project
  useEffect(() => {
    let cancelled = false;
    async function checkBlobs() {
      if (!currentProject) return;
      const entries = await Promise.all(
        (currentProject.data.videos || []).map(async (vid: VideoData) => {
          const exists = await hasVideoBlob(currentProject.id, vid.id);
          return [vid.id, !exists] as const;
        })
      );
      if (!cancelled) {
        setMissingVideoBlobs(Object.fromEntries(entries));
      }
    }
    checkBlobs();
    return () => {
      cancelled = true;
    };
  }, [currentProject?.id, currentProject?.data.videos]);

  // Trigger missing media checks on specific events
  useEffect(() => {
    checkMissingMediaFunction();
  }, [currentProject?.id]); // On mount/entering ContentStep

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <h2 className="text-2xl font-bold text-slate-900">{t('editor.content.title')}</h2>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'videos'
                ? 'border-fuchsia-500 text-fuchsia-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('editor.content.videos')}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass rounded-2xl p-4 sm:p-6 border border-white/60 dark:border-[rgba(255,255,255,0.08)] dark:bg-[var(--surface-2)] animate-fade-in">
      {activeTab === 'images' ? (
        <ImagesTab
          project={currentProject}
          updateProject={updateProject}
          templateMeta={templateMeta}
          missingImageBlobs={missingImageBlobs}
          checkMissingMediaFunction={checkMissingMediaFunction}
        />
      ) : activeTab === 'music' ? (
        <MusicTab
          project={currentProject}
          updateProject={updateProject}
          checkMissingMediaFunction={checkMissingMediaFunction}
          missingAudioBlobs={missingAudioBlobs}
        />
      ) : (
        <VideosTab
          project={currentProject}
          updateProject={updateProject}
          missingVideoBlobs={missingVideoBlobs}
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
  missingImageBlobs: Record<string, boolean>;
  checkMissingMediaFunction: () => void;
}

function ImagesTab({ project, updateProject, templateMeta, missingImageBlobs, checkMissingMediaFunction }: ImagesTabProps) {
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

  const handleImageUpload = async (processed: ProcessedImage) => {
    if (!project) return;

    // Save to MediaStore
    const result = await saveProcessedImage(project.id, processed);

    // Update project with metadata only
    updateProject((prevProject: Project) => {
      // Check if image already exists
      const existingIndex = prevProject.data.images.findIndex((img: ImageData) => img.id === result.metadata.id);

      if (existingIndex >= 0) {
        // Update existing image
        const updatedImages = [...prevProject.data.images];
        updatedImages[existingIndex] = result.metadata;
        return {
          ...prevProject,
          data: {
            ...prevProject.data,
            images: updatedImages,
          },
        };
      } else {
        // Add new image - append to the array
        return {
          ...prevProject,
          data: {
            ...prevProject.data,
            images: [...prevProject.data.images, result.metadata],
          },
        };
      }
    });

    // Check for missing media after upload
    checkMissingMediaFunction();
  };

  const handleMultipleImageUpload = async (processedImages: ProcessedImage[]) => {
    if (processedImages.length === 0 || !project) return;

    // Save all images to MediaStore
    const results = await Promise.all(
      processedImages.map(processed => saveProcessedImage(project.id, processed))
    );

    // Use functional update to read the latest state and prevent race conditions
    updateProject((prevProject: Project) => {
      const currentImages = [...prevProject.data.images];

      // Filter out any images that already exist (by ID)
      const existingImageIds = new Set(currentImages.map(img => img.id));
      const imagesToAdd = results
        .map(result => result.metadata)
        .filter(img => !existingImageIds.has(img.id));

      // Add all new images
      return {
        ...prevProject,
        data: {
          ...prevProject.data,
          images: [...currentImages, ...imagesToAdd],
        },
      };
    });
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!project) return;

    // Delete from MediaStore
    await deleteMediaWithPreview(project.id, imageId);

    // Update project state
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

    // Check for missing media after deletion
    checkMissingMediaFunction();
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
                <div key={image.id} className="bg-white/90 dark:bg-[var(--surface-2)] p-4 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] relative shadow-sm">
                  {missingImageBlobs[image.id] && (
                    <Tooltip content="Original upload missing. Please re-upload this image." position="top">
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium shadow">
                        Missing
                      </div>
                    </Tooltip>
                  )}
                  {isUsed && (
                    <Tooltip content={tooltipContent} position="top">
                      <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1.5 z-10 cursor-help shadow">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </Tooltip>
                  )}
                  <ImageThumb projectId={project.id} image={image} />
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
  checkMissingMediaFunction: () => void;
  missingAudioBlobs: Record<string, boolean>;
}

function MusicTab({ project, updateProject, checkMissingMediaFunction, missingAudioBlobs }: MusicTabProps) {
  const { t } = useTranslation();

  const handleUploadToLibrary = async (processed: ProcessedAudio) => {
    if (!project) return;

    // Save to MediaStore
    const result = await saveProcessedAudio(project.id, processed);

    const library = project.data.audio.library || [];
    updateProject({
      ...project,
      data: {
        ...project.data,
        audio: {
          ...project.data.audio,
          library: [...library, result.metadata],
        },
      },
    });

    // Check for missing media after upload
    checkMissingMediaFunction();
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

    // Check for missing media after deletion
    checkMissingMediaFunction();
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

    // Check for missing media after deletion
    checkMissingMediaFunction();
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

    // Check for missing media after deletion
    checkMissingMediaFunction();
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
              <div key={id} className="bg-white/90 dark:bg-[var(--surface-2)] p-4 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] shadow-sm relative">
                {missingAudioBlobs[id] && (
                  <Tooltip content="Original upload missing. Please re-upload this audio." position="top">
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 font-medium shadow">
                      Missing
                    </div>
                  </Tooltip>
                )}
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

interface VideosTabProps {
  project: any;
  updateProject: (project: any) => void;
  missingVideoBlobs: Record<string, boolean>;
}

function VideosTab({ project, updateProject, missingVideoBlobs }: VideosTabProps) {
  const { t, i18n } = useTranslation();
  const dir = getTextDirection(i18n.language);
  const isRTL = dir === 'rtl';
  
  const handleUpload = async (video: VideoData, blob: Blob) => {
    await saveVideoBlob(project.id, video.id, blob);
    updateProject({
      ...project,
      data: {
        ...project.data,
        videos: [...(project.data.videos || []), video],
      },
    });
  };

  const handleDelete = async (videoId: string) => {
    await deleteVideoBlob(project.id, videoId).catch((err) => {
      console.error('Failed to delete video blob', err);
    });
    updateProject({
      ...project,
      data: {
        ...project.data,
        videos: project.data.videos.filter((v: VideoData) => v.id !== videoId),
        screens: Object.fromEntries(
          Object.entries(project.data.screens).map(([screenId, screenData]: [string, any]) => {
            if (screenData.videoId === videoId) {
              return [
                screenId,
                {
                  ...screenData,
                  mediaMode: 'classic',
                  videoId: undefined,
                },
              ];
            }
            return [screenId, screenData];
          })
        ),
      },
    });
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">{t('editor.content.uploadVideos')}</h3>
        <VideoUpload onUpload={handleUpload} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          {t('editor.content.allUploadedVideos')} ({project.data.videos.length})
        </h3>
        {project.data.videos.length === 0 ? (
          <p className="text-slate-500">{t('editor.content.noVideosUploaded')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.data.videos.map((video: VideoData) => {
              const isMissingBlob = missingVideoBlobs[video.id];
              return (
                <div key={video.id} className="bg-white/90 dark:bg-[var(--surface-2)] p-4 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] relative shadow-sm">
                  {isMissingBlob && (
                    <div className={`absolute ${isRTL ? 'top-2 left-2' : 'top-2 right-2'} text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1`}>
                      {t('editor.content.blobMissing')}
                    </div>
                  )}
                  {video.posterDataUrl ? (
                    <img
                      src={video.posterDataUrl}
                      alt={video.filename}
                      className="w-full h-40 object-cover rounded-lg mb-2 bg-gray-100"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg mb-2 bg-gray-100 grid place-items-center text-slate-500 text-sm">
                      {t('editor.content.noPoster')}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-slate-900 truncate">{video.filename}</p>
                  <p className="text-xs text-slate-600">
                    {(video.size / (1024 * 1024)).toFixed(1)} MB · {video.duration.toFixed(1)}s · {video.mime}
                  </p>
                  <p className="text-xs text-slate-500">
                    {video.width}×{video.height}px
                  </p>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(video.id)}
                    className="w-full text-sm mt-3"
                  >
                    {t('editor.content.deleteVideo')}
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

