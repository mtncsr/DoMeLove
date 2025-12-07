import React from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import type { ImageData } from '../../types/project';
import { ImageUpload } from '../ui/ImageUpload';
import { Button } from '../ui/Button';
import { formatFileSize, getImageSizeKB } from '../../utils/imageProcessor';

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

  const handleAssignToScreen = (imageId: string, screenId: string) => {
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.images')}</h2>
      
      <ImageUpload
        onUpload={handleImageUpload}
        onMultipleUpload={handleMultipleImageUpload}
        multiple={true}
        label={t('editor.images.uploadImages')}
      />

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Uploaded Images ({currentProject.data.images.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentProject.data.images.map((image) => (
            <div key={image.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <img
                src={image.data}
                alt={image.filename}
                className="w-full h-32 object-cover rounded mb-2"
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
          ))}
        </div>
      </div>
    </div>
  );
}


