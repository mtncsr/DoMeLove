import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import type { ImageData, Project } from '../../types/project';
import { ImageUpload } from '../ui/ImageUpload';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { formatFileSize } from '../../utils/imageProcessor';
import { useRef } from 'react';

interface ImagesStepProps {
  templateMeta: TemplateMeta | null;
}

export function ImagesStep({ templateMeta }: ImagesStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  if (!currentProject) return null;

  // Use a ref to track the latest project state for the queue
  // Initialize with currentProject, but we'll manage updates manually in the queue
  const latestProjectRef = useRef<Project>(currentProject);
  
  // Track if we're in the middle of a queue operation to prevent render from overwriting
  const isQueueActiveRef = useRef(false);
  
  // Only update ref from currentProject if queue is not active
  // This prevents render from overwriting our manual queue updates
  if (currentProject && !isQueueActiveRef.current) {
    // Only update if the new state has more images (to avoid overwriting with stale state)
    if (!latestProjectRef.current || 
        currentProject.data.images?.length > (latestProjectRef.current.data.images?.length || 0)) {
      latestProjectRef.current = currentProject;
    }
  }

  // Use a queue to ensure sequential updates and prevent race conditions
  // Start with a pending promise that will be resolved by the first update
  // This ensures all updates are properly serialized
  const updateQueueRef = useRef<Promise<Project>>(
    new Promise<Project>((resolve) => {
      // Resolve immediately with current project to start the chain
      resolve(currentProject);
    })
  );

  const handleImageUpload = (image: ImageData) => {
    // Chain updates sequentially - use functional update to read latest state
    isQueueActiveRef.current = true;
    updateQueueRef.current = updateQueueRef.current.then(() => {
      return new Promise<Project>((resolve) => {
        // Use functional update to read the latest state directly from context's ref
        // This ensures we always get the most up-to-date images array
        updateProject((prevProject) => {
          // Read current images from the previous project state
          const currentImages = prevProject.data.images || [];
          
          // Check if image already exists
          const existingIndex = currentImages.findIndex(img => img.id === image.id);
          
          let updatedProject: Project;
          
          if (existingIndex >= 0) {
            // Update existing image (shouldn't happen for new uploads)
            const updatedImages = [...currentImages];
            updatedImages[existingIndex] = image;
            updatedProject = {
              ...prevProject,
              data: {
                ...prevProject.data,
                images: updatedImages,
              },
            };
          } else {
            // Add new image - append to the array
            const newImages = [...currentImages, image];
            
            updatedProject = {
              ...prevProject,
              data: {
                ...prevProject.data,
                images: newImages,
              },
            };
          }
          
          // Update our local ref
          latestProjectRef.current = updatedProject;
          
          // Resolve the promise after a small delay
          setTimeout(() => {
            isQueueActiveRef.current = false;
            resolve(updatedProject);
          }, 10);
          
          return updatedProject;
        });
      });
    });
  };

  const handleMultipleImageUpload = (images: ImageData[]) => {
    if (images.length === 0) return;
    
    // Chain updates sequentially to prevent race conditions
    updateQueueRef.current = updateQueueRef.current.then((latestProject) => {
      return new Promise<Project>((resolve) => {
        if (!latestProject) {
          resolve(currentProject);
          return;
        }
        
        const updatedProject = {
          ...latestProject,
          data: {
            ...latestProject.data,
            images: [...latestProject.data.images, ...images],
          },
        };
        
        updateProject(updatedProject);
        
        // Small delay to ensure state update propagates
        setTimeout(() => {
          resolve(updatedProject);
        }, 10);
      });
    });
  };

  const handleDeleteImage = (imageId: string) => {
    // Find the image to clean up its object URL if it exists
    const imageToDelete = currentProject.data.images.find(img => img.id === imageId);
    if (imageToDelete?.previewUrl) {
      URL.revokeObjectURL(imageToDelete.previewUrl);
    }
    
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        images: currentProject.data.images.filter(img => img.id !== imageId),
        screens: Object.fromEntries(
          Object.entries(currentProject.data.screens).map(([screenId, screenData]) => [
            screenId,
            {
              ...screenData,
              images: screenData.images?.filter(id => id !== imageId),
            },
          ])
        ),
      },
    });
  };

  const handleRemoveFromScreen = (imageId: string, screenId: string) => {
    const screenData = currentProject.data.screens[screenId] || {};
    const currentImages = screenData.images || [];
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        screens: {
          ...currentProject.data.screens,
          [screenId]: {
            ...screenData,
            images: currentImages.filter(id => id !== imageId),
          },
        },
      },
    });
  };

  const handleAddToScreen = (imageId: string, screenId: string) => {
    const screenData = currentProject.data.screens[screenId] || {};
    const currentImages = screenData.images || [];
    if (!currentImages.includes(imageId)) {
      updateProject({
        ...currentProject,
        data: {
          ...currentProject.data,
          screens: {
            ...currentProject.data.screens,
            [screenId]: {
              ...screenData,
              images: [...currentImages, imageId],
            },
          },
        },
      });
    }
  };

  // Get all image IDs that are used in at least one screen
  // Only count images that actually exist in the project's images array AND are assigned to screens that exist in the template
  const getUsedImageIds = (): Set<string> => {
    const usedIds = new Set<string>();
    if (!currentProject.data.images || currentProject.data.images.length === 0) {
      return usedIds; // No images, so nothing is used
    }
    
    const validImageIds = new Set(currentProject.data.images.map(img => img.id));
    
    // Get valid screen IDs from template (only check screens that exist in current template)
    const validScreenIds = templateMeta ? new Set(templateMeta.screens.map(s => s.screenId)) : new Set<string>();
    
    Object.entries(currentProject.data.screens).forEach(([screenId, screenData]) => {
      // Skip screens that don't exist in the current template
      if (!validScreenIds.has(screenId)) {
        return;
      }
      
      if (screenData && screenData.images && Array.isArray(screenData.images) && screenData.images.length > 0) {
        screenData.images.forEach((imageId: any) => {
          // Validate: imageId must be a non-empty string and exist in the project
          if (typeof imageId === 'string' && imageId.trim() !== '' && validImageIds.has(imageId)) {
            usedIds.add(imageId);
          }
        });
      }
    });
    return usedIds;
  };

  const usedImageIds = getUsedImageIds();

  // Get which screens an image is assigned to (only if image exists AND screen exists in current template)
  const getScreensForImage = (imageId: string): string[] => {
    const screenIds: string[] = [];
    // First validate that this image ID actually exists in the project
    const validImageIds = new Set(currentProject.data.images.map(img => img.id));
    if (!validImageIds.has(imageId)) {
      return screenIds; // Image doesn't exist, return empty array
    }
    
    // Get valid screen IDs from template (only check screens that exist in current template)
    const validScreenIds = templateMeta ? new Set(templateMeta.screens.map(s => s.screenId)) : new Set<string>();
    
    Object.entries(currentProject.data.screens).forEach(([screenId, screenData]) => {
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
    if (!templateMeta) return screenId;
    
    const displayNames = currentProject.data.screenDisplayNames || {};
    if (displayNames[screenId]) {
      return displayNames[screenId];
    }
    
    // Try to get from templateMeta screens
    const screen = templateMeta.screens.find(s => s.screenId === screenId);
    if (screen) {
      const index = templateMeta.screens.sort((a, b) => a.order - b.order).findIndex(s => s.screenId === screenId);
      if (index === 0) return 'Main';
      const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
      return ordinals[index - 1] || `Screen ${index + 1}`;
    }
    
    return screenId;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.images')}</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Upload Images</h3>
        <ImageUpload
          onUpload={handleImageUpload}
          onMultipleUpload={handleMultipleImageUpload}
          multiple={true}
          label={t('editor.images.uploadImages')}
        />
      </div>

      {templateMeta && (
        <div className="space-y-8">
          {templateMeta.screens.map((screen) => {
            const screenData = currentProject.data.screens[screen.screenId] || {};
            const screenImages = (screenData.images || [])
              .map(id => currentProject.data.images.find(img => img.id === id))
              .filter((img): img is ImageData => img !== undefined);

            return (
              <div key={screen.screenId} className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
                <h3 className="text-lg font-semibold mb-4">Screen: {screen.screenId}</h3>
                
                {screenImages.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {screenImages.length} image(s) assigned to this screen
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                      {screenImages.map((image) => {
                        const isProcessing = image.isProcessing === true;
                        return (
                          <div key={image.id} className={`relative group ${isProcessing ? 'opacity-75' : ''}`}>
                            <img
                              src={image.data}
                              alt={image.filename}
                              className="w-full h-24 object-contain rounded bg-gray-100"
                            />
                            {isProcessing && (
                              <div className="absolute top-1 left-1 bg-blue-500 rounded-full p-1 z-20 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                            {!isProcessing && (
                              <button
                                onClick={() => handleRemoveFromScreen(image.id, screen.screenId)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-4">No images assigned to this screen</p>
                )}

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add Images to This Screen</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {currentProject.data.images
                      .filter(img => !screenImages.find(si => si.id === img.id))
                      .map((image) => {
                        const assignedScreens = getScreensForImage(image.id);
                        // Only show checkmark if image is actually assigned to at least one screen
                        const isUsed = assignedScreens.length > 0;
                        const isProcessing = image.isProcessing === true;
                        return (
                          <div
                            key={image.id}
                            className={`relative cursor-pointer group ${isProcessing ? 'opacity-75' : ''}`}
                            onClick={() => !isProcessing && handleAddToScreen(image.id, screen.screenId)}
                          >
                          <img
                            src={image.data}
                            alt={image.filename}
                            className="w-full h-20 object-contain rounded border-2 border-transparent group-hover:border-blue-500 transition-colors bg-gray-100"
                          />
                            {isProcessing && (
                              <div className="absolute top-1 left-1 bg-blue-500 rounded-full p-1 z-20 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                            {isUsed && !isProcessing && (() => {
                              const tooltipContent = assignedScreens.length > 0 
                                ? `Assigned to: ${assignedScreens.map(getScreenDisplayName).join(', ')}`
                                : 'Already used in another screen';
                              return (
                                <Tooltip content={tooltipContent} position="top">
                                  <div className="absolute top-1 left-1 bg-green-500 rounded-full p-1 cursor-help">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </Tooltip>
                              );
                            })()}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded flex items-center justify-center">
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                                {isProcessing ? 'Processing...' : 'Click to add'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">All Uploaded Images ({currentProject.data.images.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentProject.data.images.map((image) => {
            const isUsed = usedImageIds.has(image.id);
            const isProcessing = image.isProcessing === true;
            return (
              <div key={image.id} className={`bg-white dark:bg-[var(--surface-2)] p-4 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)] relative ${isProcessing ? 'opacity-75' : ''}`}>
                {isProcessing && (
                  <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1.5 z-20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {isUsed && !isProcessing && (() => {
                  const assignedScreens = getScreensForImage(image.id);
                  const tooltipContent = assignedScreens.length > 0 
                    ? `Assigned to: ${assignedScreens.map(getScreenDisplayName).join(', ')}`
                    : 'Used in at least one screen';
                  return (
                    <Tooltip content={tooltipContent} position="top">
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 z-10 cursor-help">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </Tooltip>
                  );
                })()}
                <img
                  src={image.data}
                  alt={image.filename}
                  className="w-full h-32 object-contain rounded mb-2 bg-gray-100"
                />
                <p className="text-sm text-gray-600 truncate mb-1">{image.filename}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {isProcessing ? 'Processing...' : formatFileSize(image.size)}
                </p>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteImage(image.id)}
                  className="w-full text-sm"
                  disabled={isProcessing}
                >
                  {t('editor.images.delete')}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
