import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { audioManager } from '../../services/audioManager';
import { Button } from '../ui/Button';
import { ScreenPreview } from './ScreenPreview';
import { getMediaDataUrl } from '../../services/mediaService';

interface PreviewStepProps {
  templateMeta: TemplateMeta | null;
}

export function PreviewStep({ templateMeta }: PreviewStepProps) {
  const { t } = useTranslation();
  const { currentProject } = useProject();
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  // Overlay gate: initially show the main screen as an overlay
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  if (!currentProject || !templateMeta) return null;

  // Effective screens: prefer dynamicScreens; else screens that have data; else template screens
  const templateOrdered = templateMeta.screens.slice().sort((a, b) => a.order - b.order);
  const screenIdsWithData = Object.keys(currentProject.data.screens || {});
  let screens =
    (currentProject.data.dynamicScreens?.length &&
      currentProject.data.dynamicScreensTemplateId === templateMeta.templateId)
      ? currentProject.data.dynamicScreens.slice().sort((a, b) => a.order - b.order)
      : (screenIdsWithData.length > 0
          ? templateOrdered.filter((s) => screenIdsWithData.includes(s.screenId))
          : templateOrdered);

  const contentScreens = screens.filter((s) => {
    const sd = currentProject.data.screens[s.screenId] || {};
    const mediaMode = sd.mediaMode || 'classic';
    const hasImages = mediaMode === 'classic' && Array.isArray(sd.images) && sd.images.length > 0;
    const hasVideo = mediaMode === 'video' && !!sd.videoId;
    const hasText = !!sd.text?.trim();
    const hasTitle = !!sd.title?.trim();
    return hasImages || hasVideo || hasText || hasTitle;
  });

  // Clamp screen index to available screens
  useEffect(() => {
    if (currentScreenIndex >= contentScreens.length) {
      setCurrentScreenIndex(contentScreens.length > 0 ? 0 : 0);
      setCurrentImageIndex(0);
    }
  }, [currentScreenIndex, contentScreens.length]);

  const currentScreen = contentScreens[currentScreenIndex];

  // Main screen config (order === 1) - used as the overlay screen
  const mainScreen = screens.find((s) => s.order === 1);

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
    const timeout = setTimeout(async () => {
      if (!isMountedRef.current) return;

      let audioPlayed = false;

      // Check for global audio first (if exists, it plays across all screens)
      if (currentProject.data.audio.global) {
        try {
          const audioDataUrl = await getMediaDataUrl(currentProject.id, currentProject.data.audio.global.id);
          if (audioDataUrl) {
            audioManager.playScreenAudio('global', audioDataUrl, true); // Loop global audio
            audioPlayed = true;
          }
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
                const audioDataUrl = await getMediaDataUrl(currentProject.id, audio.id);
                if (audioDataUrl) {
                  audioManager.playScreenAudio(currentScreen.screenId, audioDataUrl, false);
                  audioPlayed = true;
                }
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

      const timeout = setTimeout(async () => {
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
                const audioDataUrl = await getMediaDataUrl(currentProject.id, audio.id);
                if (audioDataUrl) {
                  audioManager.playScreenAudio(nextScreen.screenId, audioDataUrl, false);
                }
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

      const timeout = setTimeout(async () => {
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
                const audioDataUrl = await getMediaDataUrl(currentProject.id, audio.id);
                if (audioDataUrl) {
                  audioManager.playScreenAudio(prevScreen.screenId, audioDataUrl, false);
                }
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
    <div className="bg-transparent">
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

      <div
        className={`bg-white rounded-lg border border-gray-200 ${
          isMobileView ? 'preview-mobile' : 'preview-desktop'
        } relative overflow-x-hidden overflow-y-auto force-light-preview`}
        style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
      >
        <div className="relative w-full h-full min-h-[600px]">
          {overlayVisible && mainScreen ? (
            // Overlay: show the main screen as designed in Screens, using the styled button
            <ScreenPreview
              screen={mainScreen}
              project={currentProject}
              templateMeta={templateMeta}
              className="w-full h-full"
              onMainStart={handleOverlayClick}
            />
          ) : (
            currentScreen && (
              <>
                {/* Navigation Controls Overlay */}
                <div className="absolute top-4 right-4 z-30 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handlePrevious}
                    disabled={currentScreenIndex === 0}
                    className="px-3 py-2 bg-white/90 backdrop-blur-sm"
                  >
                    ← {t('editor.preview.previous')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleNext}
                    disabled={currentScreenIndex === screens.length - 1}
                    className="px-3 py-2 bg-white/90 backdrop-blur-sm"
                  >
                    {t('editor.preview.next')} →
                  </Button>
                </div>
                
                {/* Use ScreenPreview component to match screens panel preview */}
                <ScreenPreview
                  screen={currentScreen}
                  project={currentProject}
                  templateMeta={templateMeta}
                  className="w-full h-full"
                />
              </>
            )
          )}
        </div>
        
        {/* Zoomed Image Modal */}
        {zoomedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            {/* Navigation arrows in zoomed view */}
            {(() => {
              const screenData = currentProject.data.screens[currentScreen.screenId];
              const screenImages = (screenData?.images || [])
                .map(id => currentProject.data.images.find(img => img.id === id))
                .filter((img): img is typeof currentProject.data.images[0] => img !== undefined);
              
              const canNavigate = screenImages.length > 1;
              
              return (
                <>
                  {canNavigate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : screenImages.length - 1));
                        const prevImage = screenImages[(currentImageIndex > 0 ? currentImageIndex - 1 : screenImages.length - 1)];
                        if (prevImage) {
                          getMediaDataUrl(currentProject.id, prevImage.id).then(setZoomedImage);
                        } else {
                          setZoomedImage(null);
                        }
                      }}
                      className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/70 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-white"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                  )}
                  <img
                    src={zoomedImage}
                    alt="Zoomed"
                    className="max-w-full max-h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {canNavigate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex((prev) => (prev < screenImages.length - 1 ? prev + 1 : 0));
                        const nextImage = screenImages[(currentImageIndex < screenImages.length - 1 ? currentImageIndex + 1 : 0)];
                        if (nextImage) {
                          getMediaDataUrl(currentProject.id, nextImage.id).then(setZoomedImage);
                        } else {
                          setZoomedImage(null);
                        }
                      }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/70 text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-white"
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  )}
                </>
              );
            })()}

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
