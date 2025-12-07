import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { audioManager } from '../../services/audioManager';
import { Button } from '../ui/Button';

interface PreviewStepProps {
  templateMeta: TemplateMeta | null;
}

export function PreviewStep({ templateMeta }: PreviewStepProps) {
  const { t } = useTranslation();
  const { currentProject } = useProject();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);

  if (!currentProject || !templateMeta) return null;

  const screens = templateMeta.screens;
  const currentScreen = screens[currentScreenIndex];

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      audioManager.stopAll();
    };
  }, []);

  const handleOverlayClick = () => {
    setOverlayVisible(false);
    // Start audio if available
    if (currentScreen?.supportsMusic) {
      const screenData = currentProject.data.screens[currentScreen.screenId];
      if (screenData?.audioId) {
        const audio = currentProject.data.audio.screens[currentScreen.screenId];
        if (audio) {
          audioManager.playScreenAudio(currentScreen.screenId, audio.data);
        }
      }
    } else if (currentProject.data.audio.global) {
      audioManager.playScreenAudio('global', currentProject.data.audio.global.data);
    }
  };

  const handleNext = () => {
    audioManager.stopAll();
    if (currentScreenIndex < screens.length - 1) {
      const nextIndex = currentScreenIndex + 1;
      setCurrentScreenIndex(nextIndex);
      const nextScreen = screens[nextIndex];
      if (nextScreen?.supportsMusic) {
        const screenData = currentProject.data.screens[nextScreen.screenId];
        if (screenData?.audioId) {
          const audio = currentProject.data.audio.screens[nextScreen.screenId];
          if (audio) {
            audioManager.playScreenAudio(nextScreen.screenId, audio.data);
          }
        }
      }
    }
  };

  const handlePrevious = () => {
    audioManager.stopAll();
    if (currentScreenIndex > 0) {
      const prevIndex = currentScreenIndex - 1;
      setCurrentScreenIndex(prevIndex);
      const prevScreen = screens[prevIndex];
      if (prevScreen?.supportsMusic) {
        const screenData = currentProject.data.screens[prevScreen.screenId];
        if (screenData?.audioId) {
          const audio = currentProject.data.audio.screens[prevScreen.screenId];
          if (audio) {
            audioManager.playScreenAudio(prevScreen.screenId, audio.data);
          }
        }
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('editor.steps.preview')}</h2>
        <div className="flex gap-2">
          <Button
            variant={isMobileView ? 'primary' : 'secondary'}
            onClick={() => setIsMobileView(true)}
          >
            {t('editor.preview.mobileView')}
          </Button>
          <Button
            variant={!isMobileView ? 'primary' : 'secondary'}
            onClick={() => setIsMobileView(false)}
          >
            {t('editor.preview.desktopView')}
          </Button>
        </div>
      </div>

      <div className={`bg-white rounded-lg border border-gray-200 ${isMobileView ? 'max-w-sm mx-auto' : 'w-full'}`}>
        {overlayVisible ? (
          <div
            className="h-96 flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-red-500 text-white cursor-pointer"
            onClick={handleOverlayClick}
          >
            <h3 className="text-3xl font-bold mb-2">
              {currentProject.data.overlay.mainText || 'Welcome'}
            </h3>
            <p className="text-xl mb-4">
              {currentProject.data.overlay.subText || 'To your special gift'}
            </p>
            <button className="px-6 py-3 bg-white text-pink-600 rounded-lg font-semibold hover:bg-gray-100">
              {currentProject.data.overlay.buttonText || 'Tap to Begin'}
            </button>
          </div>
        ) : (
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-4">
              {currentProject.data.screens[currentScreen.screenId]?.title || currentScreen.screenId}
            </h3>
            <p className="text-gray-700 mb-4">
              {currentProject.data.screens[currentScreen.screenId]?.text || ''}
            </p>
            {currentProject.data.screens[currentScreen.screenId]?.images?.map((imageId) => {
              const image = currentProject.data.images.find(img => img.id === imageId);
              return image ? (
                <img key={imageId} src={image.data} alt="" className="w-full mb-4 rounded" />
              ) : null;
            })}
            <div className="flex justify-between mt-6">
              <Button
                onClick={handlePrevious}
                disabled={currentScreenIndex === 0}
              >
                {t('editor.preview.previous')}
              </Button>
              <span className="text-gray-600">
                {currentScreenIndex + 1} / {screens.length}
              </span>
              <Button
                onClick={handleNext}
                disabled={currentScreenIndex === screens.length - 1}
              >
                {t('editor.preview.next')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



