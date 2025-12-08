import React, { useState, useEffect, useRef } from 'react';
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  if (!currentProject || !templateMeta) return null;

  const screens = templateMeta.screens;
  const currentScreen = screens[currentScreenIndex];

  useEffect(() => {
    isMountedRef.current = true;
    // Cleanup audio and timeouts on unmount
    return () => {
      isMountedRef.current = false;
      audioManager.stopAll();
      // Clear all pending timeouts
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  const handleOverlayClick = () => {
    setOverlayVisible(false);
    setAudioError(null);
    // Start audio if available - prioritize screen audio, fallback to global
    const timeout = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      let audioPlayed = false;
      
      // Check for global audio first (if exists, it plays across all screens)
      if (currentProject.data.audio.global) {
        try {
          audioManager.playScreenAudio('global', currentProject.data.audio.global.data, true); // Loop global audio
          audioPlayed = true;
        } catch (error) {
          if (isMountedRef.current) {
            setAudioError('Failed to play audio. Please check your browser settings.');
          }
          console.error('Audio playback error:', error);
        }
      }
      
      // If no global audio, check for screen-specific audio
      if (!audioPlayed && currentScreen?.supportsMusic) {
        const screenData = currentProject.data.screens[currentScreen.screenId];
        if (screenData?.audioId) {
          const audio = currentProject.data.audio.screens[currentScreen.screenId];
          if (audio) {
            try {
              // Check if previous screen extended music to this one
              const shouldExtend = currentScreenIndex > 0 && 
                currentProject.data.screens[screens[currentScreenIndex - 1].screenId]?.extendMusicToNext;
              
              if (!shouldExtend) {
                audioManager.playScreenAudio(currentScreen.screenId, audio.data, false);
                audioPlayed = true;
              }
            } catch (error) {
              if (isMountedRef.current) {
                setAudioError('Failed to play audio. Please check your browser settings.');
              }
              console.error('Audio playback error:', error);
            }
          }
        }
      }
    }, 100);
    timeoutRefs.current.push(timeout);
  };

  const handleToggleMute = () => {
    audioManager.toggleMute();
    setIsMuted(audioManager.getMuteState());
  };

  const handleNext = () => {
    setAudioError(null);
    if (currentScreenIndex < screens.length - 1) {
      const currentScreenData = currentProject.data.screens[currentScreen.screenId];
      const shouldExtendMusic = currentScreenData?.extendMusicToNext;
      
      // Only stop audio if not extending to next screen and no global audio
      if (!shouldExtendMusic && !currentProject.data.audio.global) {
        audioManager.stopAll();
      }
      
      const nextIndex = currentScreenIndex + 1;
      setCurrentScreenIndex(nextIndex);
      setCurrentImageIndex(0); // Reset image index when changing screens
      const nextScreen = screens[nextIndex];
      
      const timeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        // If global audio exists, it continues playing (already looping)
        if (currentProject.data.audio.global) {
          // Global audio is already playing and looping, no need to restart
          return;
        }
        
        // Check if previous screen extended music to this one
        if (shouldExtendMusic) {
          // Music continues from previous screen, don't change it
          return;
        }
        
        // Play next screen's audio
        if (nextScreen?.supportsMusic) {
          const screenData = currentProject.data.screens[nextScreen.screenId];
          if (screenData?.audioId) {
            const audio = currentProject.data.audio.screens[nextScreen.screenId];
            if (audio) {
              try {
                audioManager.playScreenAudio(nextScreen.screenId, audio.data, false);
              } catch (error) {
                if (isMountedRef.current) {
                  setAudioError('Failed to play audio');
                }
                console.error('Audio playback error:', error);
              }
            }
          }
        }
      }, 100);
      timeoutRefs.current.push(timeout);
    }
  };

  const handlePrevious = () => {
    setAudioError(null);
    if (currentScreenIndex > 0) {
      const prevIndex = currentScreenIndex - 1;
      const prevScreen = screens[prevIndex];
      const prevScreenData = currentProject.data.screens[prevScreen.screenId];
      const shouldExtendMusic = prevScreenData?.extendMusicToNext;
      
      // Only stop audio if not extending music and no global audio
      if (!shouldExtendMusic && !currentProject.data.audio.global) {
        audioManager.stopAll();
      }
      
      setCurrentScreenIndex(prevIndex);
      setCurrentImageIndex(0); // Reset image index when changing screens
      
      const timeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        
        // If global audio exists, it continues playing (already looping)
        if (currentProject.data.audio.global) {
          // Global audio is already playing and looping, no need to restart
          return;
        }
        
        // Check if we should continue previous screen's music
        if (shouldExtendMusic && prevScreenData?.audioId) {
          // Music continues from previous screen, don't change it
          return;
        }
        
        // Play previous screen's audio
        if (prevScreen?.supportsMusic) {
          const screenData = currentProject.data.screens[prevScreen.screenId];
          if (screenData?.audioId) {
            const audio = currentProject.data.audio.screens[prevScreen.screenId];
            if (audio) {
              try {
                audioManager.playScreenAudio(prevScreen.screenId, audio.data, false);
              } catch (error) {
                if (isMountedRef.current) {
                  setAudioError('Failed to play audio');
                }
                console.error('Audio playback error:', error);
              }
            }
          }
        }
      }, 100);
      timeoutRefs.current.push(timeout);
    }
  };

  // Update mute state when it changes
  useEffect(() => {
    setIsMuted(audioManager.getMuteState());
  }, []);

  return (
    <div>
      <div className="flex justify-end items-center mb-6">
        <div className="flex gap-2 items-center">
          <button
            onClick={handleToggleMute}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              isMuted 
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
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

      {audioError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">{audioError}</p>
        </div>
      )}

      <div className={`bg-white rounded-lg border border-gray-200 ${isMobileView ? 'preview-mobile' : 'preview-desktop'}`}>
        {overlayVisible ? (
          <div
            className={`flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-red-500 text-white cursor-pointer ${isMobileView ? 'h-full' : 'h-full'}`}
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
          <div className={`${isMobileView ? 'p-4 h-full overflow-y-auto' : 'p-8 h-full overflow-y-auto'}`}>
            <h3 className="text-2xl font-bold mb-4">
              {currentProject.data.screens[currentScreen.screenId]?.title || currentScreen.screenId}
            </h3>
            <p className="text-gray-700 mb-4">
              {currentProject.data.screens[currentScreen.screenId]?.text || ''}
            </p>
            
            {(() => {
              const screenData = currentProject.data.screens[currentScreen.screenId];
              const screenImages = (screenData?.images || [])
                .map(id => currentProject.data.images.find(img => img.id === id))
                .filter((img): img is typeof currentProject.data.images[0] => img !== undefined);

              if (screenImages.length > 0) {
                const currentImage = screenImages[currentImageIndex];
                
                return (
                  <div className="mb-6">
                    {/* Image Carousel */}
                    <div className="relative mb-4">
                      <img
                        src={currentImage.data}
                        alt={currentImage.filename}
                        className="w-full h-64 md:h-96 object-contain rounded-lg cursor-pointer bg-gray-100"
                        onClick={() => setZoomedImage(currentImage.data)}
                      />
                      
                      {screenImages.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => 
                                prev > 0 ? prev - 1 : screenImages.length - 1
                              );
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
                          >
                            ‹
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) => 
                                prev < screenImages.length - 1 ? prev + 1 : 0
                              );
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70"
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Image Thumbnails */}
                    {screenImages.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {screenImages.map((image, index) => (
                          <img
                            key={image.id}
                            src={image.data}
                            alt={image.filename}
                            className={`w-20 h-20 object-cover rounded cursor-pointer border-2 transition-colors ${
                              index === currentImageIndex 
                                ? 'border-blue-500' 
                                : 'border-transparent hover:border-gray-300'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Image Counter */}
                    {screenImages.length > 1 && (
                      <p className="text-sm text-gray-500 text-center mt-2">
                        {currentImageIndex + 1} / {screenImages.length}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}

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
        
        {/* Zoomed Image Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



