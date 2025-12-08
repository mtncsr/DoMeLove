import React from 'react';
import type { ImageData } from '../../types/project';

interface ScreenImageSelectorProps {
  allImages: ImageData[];
  selectedImageIds: string[];
  usedImageIds: Set<string>;
  onSelectImage: (imageId: string) => void;
  onDeselectImage: (imageId: string) => void;
  screenImages: ImageData[];
}

export function ScreenImageSelector({
  allImages,
  selectedImageIds,
  usedImageIds,
  onSelectImage,
  onDeselectImage,
  screenImages,
}: ScreenImageSelectorProps) {
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
                  className="w-full h-24 object-cover rounded"
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
              const isUsed = usedImageIds.has(image.id);
              return (
                <div
                  key={image.id}
                  className="relative cursor-pointer group"
                  onClick={() => onSelectImage(image.id)}
                >
                  <img
                    src={image.data}
                    alt={image.filename}
                    className="w-full h-20 object-cover rounded border-2 border-transparent group-hover:border-blue-500 transition-colors"
                  />
                  {isUsed && (
                    <div className="absolute top-1 left-1 bg-green-500 rounded-full p-1" title="Already used in another screen">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
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
}



