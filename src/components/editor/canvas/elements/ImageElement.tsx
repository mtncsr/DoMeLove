import { useState, useEffect } from 'react';
import type { CanvasElement } from '../../../../types/canvas';
import { useProject } from '../../../../contexts/ProjectContext';
import { getMediaPreviewUrl } from '../../../../services/mediaService';

interface ImageElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdate: (element: CanvasElement) => void;
  mediaUrls: Map<string, string>;
}

export function ImageElement({ element, isSelected, onUpdate, mediaUrls }: ImageElementProps) {
  const { currentProject } = useProject();
  const [showImagePicker, setShowImagePicker] = useState(false);

  const imageUrl = element.mediaId ? mediaUrls.get(element.mediaId) : undefined;

  const handleImageClick = () => {
    if (isSelected) {
      setShowImagePicker(true);
    }
  };

  const handleImageSelect = async (imageId: string) => {
    if (!currentProject) return;

    try {
      const url = await getMediaPreviewUrl(currentProject.id, imageId);
      if (url) {
        onUpdate({
          ...element,
          mediaId: imageId,
        });
        setShowImagePicker(false);
      }
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  const styles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: element.style.borderRadius ? `${element.style.borderRadius}px` : '0',
    borderWidth: element.style.borderWidth ? `${element.style.borderWidth}px` : '0',
    borderColor: element.style.borderColor || 'transparent',
    borderStyle: element.style.borderWidth ? 'solid' : 'none',
    opacity: element.style.opacity ?? 1,
    boxShadow: element.style.shadow ? '0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
    cursor: isSelected ? 'pointer' : 'default',
    overflow: 'hidden',
  };

  return (
    <>
      <div
        onClick={handleImageClick}
        style={styles}
        className={isSelected ? 'ring-2 ring-fuchsia-500' : ''}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            {isSelected ? 'Click to select image' : 'No image'}
          </div>
        )}
      </div>
      {showImagePicker && currentProject && (
        <ImagePickerModal
          projectId={currentProject.id}
          images={currentProject.data.images}
          onSelect={handleImageSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </>
  );
}

function ImagePickerModal({
  projectId,
  images,
  onSelect,
  onClose,
}: {
  projectId: string;
  images: Array<{ id: string; filename: string }>;
  onSelect: (imageId: string) => void;
  onClose: () => void;
}) {
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const loadUrls = async () => {
      const urls = new Map<string, string>();
      for (const image of images) {
        try {
          const url = await getMediaPreviewUrl(projectId, image.id);
          if (url) {
            urls.set(image.id, url);
          }
        } catch (error) {
          console.warn(`Failed to load image ${image.id}:`, error);
        }
      }
      setImageUrls(urls);
    };
    loadUrls();
  }, [projectId, images]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4">Select Image</h3>
        <div className="grid grid-cols-3 gap-4">
          {images.map((image) => {
            const url = imageUrls.get(image.id);
            return (
              <button
                key={image.id}
                onClick={() => onSelect(image.id)}
                className="border-2 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden hover:border-fuchsia-500 transition-colors"
              >
                {url ? (
                  <img src={url} alt={image.filename} className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    Loading...
                  </div>
                )}
                <div className="p-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                  {image.filename}
                </div>
              </button>
            );
          })}
        </div>
        {images.length === 0 && (
          <p className="text-slate-500 text-center py-8">No images uploaded yet</p>
        )}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
