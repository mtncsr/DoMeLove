import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import type { ImageData } from '../../types/project';
import { ImageUpload } from '../ui/ImageUpload';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { formatFileSize } from '../../utils/imageProcessor';

interface ImagesStepProps {
  templateMeta: TemplateMeta | null;
}

export function ImagesStep({ templateMeta }: ImagesStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  if (!currentProject) return null;

  const handleImageUpload = (image: ImageData) => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        images: [...currentProject.data.images, image],
      },
    });
  };

  const handleMultipleImageUpload = (images: ImageData[]) => {
    updateProject({
      ...currentProject,
      data: {
        ...currentProject.data,
        images: [...currentProject.data.images, ...images],
      },
    });
  };

  const handleDeleteImage = (imageId: string) => {
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
              <div key={screen.screenId} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Screen: {screen.screenId}</h3>
                
                {screenImages.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {screenImages.length} image(s) assigned to this screen
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                      {screenImages.map((image) => (
                        <div key={image.id} className="relative group">
                        <img
                          src={image.data}
                          alt={image.filename}
                          className="w-full h-24 object-contain rounded bg-gray-100"
                        />
                          <button
                            onClick={() => handleRemoveFromScreen(image.id, screen.screenId)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
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
                        return (
                          <div
                            key={image.id}
                            className="relative cursor-pointer group"
                            onClick={() => handleAddToScreen(image.id, screen.screenId)}
                          >
                          <img
                            src={image.data}
                            alt={image.filename}
                            className="w-full h-20 object-contain rounded border-2 border-transparent group-hover:border-blue-500 transition-colors bg-gray-100"
                          />
                            {isUsed && (() => {
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
                              <span className="text-white text-xs opacity-0 group-hover:opacity-100">Click to add</span>
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
            return (
              <div key={image.id} className="bg-white p-4 rounded-lg border border-gray-200 relative">
                {isUsed && (() => {
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
                <p className="text-xs text-gray-500 mb-2">{formatFileSize(image.size)}</p>
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
      </div>
    </div>
  );
}
