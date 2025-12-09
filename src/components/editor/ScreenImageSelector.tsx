import type { ImageData, Project } from '../../types/project';
import type { TemplateMeta } from '../../types/template';
import { Tooltip } from '../ui/Tooltip';

interface ScreenImageSelectorProps {
  allImages: ImageData[];
  selectedImageIds: string[];
  onSelectImage: (imageId: string) => void;
  onDeselectImage: (imageId: string) => void;
  screenImages: ImageData[];
  project: Project;
  templateMeta?: TemplateMeta | null;
  currentScreenId?: string;
}

export function ScreenImageSelector({
  allImages,
  selectedImageIds,
  onSelectImage,
  onDeselectImage,
  screenImages,
  project,
  templateMeta,
  currentScreenId,
}: ScreenImageSelectorProps) {
  // Get which screens an image is assigned to (excluding current screen, only if image exists AND screen exists in current template)
  const getScreensForImage = (imageId: string): string[] => {
    const screenIds: string[] = [];
    // First validate that this image ID actually exists in the project
    const validImageIds = new Set(project.data.images.map(img => img.id));
    if (!validImageIds.has(imageId)) {
      return screenIds; // Image doesn't exist, return empty array
    }
    
    // Get valid screen IDs from template (only check screens that exist in current template)
    const validScreenIds = templateMeta ? new Set(templateMeta.screens.map(s => s.screenId)) : new Set<string>();
    
    Object.entries(project.data.screens).forEach(([screenId, screenData]: [string, any]) => {
      // Skip current screen and screens that don't exist in the current template
      if (screenId === currentScreenId || !validScreenIds.has(screenId)) {
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
    
    // Try to get from templateMeta screens if available
    if (templateMeta) {
      const screen = templateMeta.screens.find(s => s.screenId === screenId);
      if (screen) {
        const sortedScreens = [...templateMeta.screens].sort((a, b) => a.order - b.order);
        const index = sortedScreens.findIndex(s => s.screenId === screenId);
        if (index === 0) return 'Main';
        const ordinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
        return ordinals[index - 1] || `Screen ${index + 1}`;
      }
    }
    
    return screenId;
  };

  return (
    <div>
      {screenImages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Images assigned to this screen ({screenImages.length})
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
            {screenImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.data}
                  alt={image.filename}
                  className="w-full h-24 object-contain rounded bg-gray-100"
                />
                <button
                  onClick={() => onDeselectImage(image.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from screen"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          {screenImages.length === 0 ? 'Select Images for This Screen' : 'Add More Images'}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {allImages
            .filter(img => !selectedImageIds.includes(img.id))
            .map((image) => {
              const assignedScreens = getScreensForImage(image.id);
              // Only show checkmark if image is actually assigned to at least one screen (excluding current)
              const isUsed = assignedScreens.length > 0;
              return (
                <div
                  key={image.id}
                  className="relative cursor-pointer group"
                  onClick={() => onSelectImage(image.id)}
                >
                  <img
                    src={image.data}
                    alt={image.filename}
                    className="w-full h-20 object-contain rounded border-2 border-transparent group-hover:border-blue-500 transition-colors bg-gray-100"
                  />
                  {isUsed && (
                    <div className="absolute top-1 left-1 z-20">
                      <Tooltip 
                        content={assignedScreens.length > 0 
                          ? `Also assigned to: ${assignedScreens.map(getScreenDisplayName).join(', ')}`
                          : 'Already used in another screen'} 
                        position="top"
                      >
                        <div className="bg-green-500 rounded-full p-1 cursor-help">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </Tooltip>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded flex items-center justify-center z-10">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100">Click to add</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
