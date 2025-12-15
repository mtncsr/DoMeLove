/**
 * @deprecated This component is no longer used for canonical preview.
 * Preview now uses iframe rendering via giftRenderPipeline.ts
 * This component may still be used for non-canonical editor UI, but should not be used
 * for the product preview panels (Screens panel, Preview & Export panel).
 * 
 * For canonical preview, use buildGiftHtml() from giftRenderPipeline.ts instead.
 */

import type { Project } from '../../types/project';
import type { TemplateMeta, ScreenConfig } from '../../types/template';
import { GalleryPreview } from './GalleryPreview';
import { BackgroundAnimations } from '../animations/BackgroundAnimations';

interface ScreenPreviewProps {
  screen: ScreenConfig;
  project: Project;
  templateMeta: TemplateMeta | null;
  className?: string;
  /**
   * Optional handler for the main screen "start" action.
   * When provided, the overlay button on the main screen will call this.
   */
  onMainStart?: () => void;
}

export function ScreenPreview({
  screen,
  project,
  templateMeta,
  className = '',
  onMainStart,
}: ScreenPreviewProps) {
  const screenData = project.data.screens[screen.screenId] || {};
  const mediaMode = screenData.mediaMode || 'classic';
  const isVideoMode = mediaMode === 'video';
  const isMainScreen = screen.order === 1;

  // Get screen images
  const screenImages = (screenData.images || [])
    .map((id: string) => project.data.images.find((img) => img.id === id))
    .filter((img) => img !== undefined);

  // Get screen audio
  const screenAudio = project.data.audio.screens[screen.screenId];

  // Get template design config
  const designConfig = templateMeta?.designConfig;

  // Get global and screen-specific styles
  const globalStyle = project.data.globalStyle;
  const screenStyle = screenData.style;
  
  // Determine background color (screen override > global > custom > template)
  let backgroundStyle = {};
  if (screenStyle?.colors?.background) {
    backgroundStyle = { backgroundColor: screenStyle.colors.background };
  } else if (globalStyle?.colors?.background) {
    backgroundStyle = { backgroundColor: globalStyle.colors.background };
  } else if (screenData.customBackground === 'custom') {
    if (screenData.backgroundGradient) {
      backgroundStyle = { background: screenData.backgroundGradient };
    } else if (screenData.backgroundColor) {
      backgroundStyle = { backgroundColor: screenData.backgroundColor };
    }
  } else {
    backgroundStyle = designConfig?.background ? { background: designConfig.background } : {};
  }

  // Determine text colors (screen override > global > default)
  const textColor = screenStyle?.colors?.text || globalStyle?.colors?.text || screenData.textColor || '#374151';
  const titleColor = screenStyle?.colors?.title || globalStyle?.colors?.title || screenData.titleColor || '#111827';

  // Determine background animation (screen override > global)
  const backgroundAnimation = screenStyle?.backgroundAnimation?.type && screenStyle.backgroundAnimation.type !== 'none'
    ? screenStyle.backgroundAnimation
    : globalStyle?.backgroundAnimation;
  
  // Render background animation if configured
  const shouldRenderAnimation = backgroundAnimation && backgroundAnimation.type && backgroundAnimation.type !== 'none';

  // Generate overlay button based on button style
  const renderOverlayButton = () => {
    const overlay = project.data.overlay;
    if (!overlay) return null;

    if (overlay.buttonStyle === 'emoji-animated') {
      const emoji = overlay.emojiButton?.emoji || '🎉';
      const size = overlay.emojiButton?.size || 48;
      const animation = overlay.emojiButton?.animation || 'pulse';
      return (
        <button
          type="button"
          className={`emoji-button emoji-${animation}`}
          onClick={onMainStart}
          style={{
            fontSize: `${size}px`,
            width: `${size + 20}px`,
            height: `${size + 20}px`,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
        >
          {emoji}
        </button>
      );
    } else if (overlay.buttonStyle === 'text-framed') {
      const text = overlay.textButton?.text || 'Start Experience';
      const frameStyle = overlay.textButton?.frameStyle || 'solid';
      
      // Get button colors from overlay config or global style
      const buttonBg = overlay.textButton?.backgroundColor || project.data.globalStyle?.colors?.button?.background || 'white';
      const buttonText = overlay.textButton?.textColor || project.data.globalStyle?.colors?.button?.text || '#333';
      const buttonBorder = overlay.textButton?.borderColor || project.data.globalStyle?.colors?.button?.border || '#333';
      
      // Base styles that apply to all frame styles
      const baseStyle: React.CSSProperties = {
        padding: '12px 24px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

      // Frame-specific style overrides
      const frameSpecificStyles: Record<string, React.CSSProperties> = {
        solid: {
          border: `2px solid ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
          borderRadius: '8px',
        },
        dashed: {
          border: `2px dashed ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
          borderRadius: '8px',
        },
        double: {
          border: `4px double ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
          borderRadius: '8px',
        },
        shadow: {
          border: `1px solid ${buttonBorder}`,
          boxShadow: '0 0 10px rgba(0,0,0,0.3)',
          background: buttonBg,
          color: buttonText,
          borderRadius: '8px',
        },
        gradient: {
          border: 'none',
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          color: buttonText,
          borderRadius: '8px',
        },
        heart: {
          border: 'none',
          background: buttonBg === 'white' ? '#ff6b6b' : buttonBg,
          color: buttonText,
          clipPath: 'polygon(50% 0%, 61% 0%, 68% 11%, 79% 11%, 86% 0%, 100% 0%, 100% 50%, 50% 100%, 0% 50%, 0% 0%, 14% 0%, 21% 11%, 32% 11%)',
          width: '120px',
          height: '100px',
          fontSize: '14px',
          borderRadius: '0',
        },
        star: {
          border: 'none',
          background: buttonBg === 'white' ? '#ffd93d' : buttonBg,
          color: buttonText,
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          width: '100px',
          height: '100px',
          fontSize: '12px',
          borderRadius: '0',
        },
        circle: {
          borderRadius: '50%',
          border: `3px solid ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
          width: '120px',
          height: '120px',
        },
        oval: {
          borderRadius: '50%',
          border: `3px solid ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
          width: '160px',
          height: '100px',
        },
        rectangle: {
          borderRadius: '4px',
          border: `3px solid ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
        },
        square: {
          borderRadius: '4px',
          border: `3px solid ${buttonBorder}`,
          background: buttonBg,
          color: buttonText,
          width: '120px',
          height: '120px',
        },
      };

      return (
        <button
          type="button"
          className={`text-button frame-${frameStyle}`}
          onClick={onMainStart}
          style={{
            ...baseStyle,
            ...(frameSpecificStyles[frameStyle] || frameSpecificStyles.solid),
          }}
        >
          {text}
        </button>
      );
    }
    return null;
  };

  // For main screen, use overlay gradient background, otherwise use screen background
  const finalBackground = isMainScreen && project.data.overlay
    ? { background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(239, 68, 68))' }
    : backgroundStyle;

  return (
    <div
      className={`relative w-full h-full min-h-[600px] rounded-lg overflow-hidden border-2 border-gray-200 ${className}`}
      style={finalBackground}
    >
      {/* Background Animation */}
      {shouldRenderAnimation && (
        <BackgroundAnimations config={backgroundAnimation!} />
      )}
      {isMainScreen ? (
        /* Main Screen: Title, Main Greeting, Button (in order) - single background */
        <div className="h-full flex flex-col items-center justify-center text-white p-8 space-y-6">
          {/* Title */}
          {screenData.title && (
            <h1
              className={`font-bold ${screenData.titleSize || 'text-3xl'}`}
              style={{ color: titleColor === '#111827' ? 'white' : titleColor }}
            >
              {screenData.title}
            </h1>
          )}

          {/* Main Greeting */}
          {project.data.mainGreeting && (
            <p
              className="text-lg max-w-2xl leading-relaxed"
              style={{ color: textColor === '#374151' ? 'white' : textColor }}
            >
              {project.data.mainGreeting}
            </p>
          )}

          {/* Overlay Button */}
          {renderOverlayButton()}
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.05); opacity: 0.9; }
            }
            @keyframes emoji-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            @keyframes emoji-bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
            @keyframes emoji-rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes emoji-scale {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.2); }
            }
            .emoji-pulse { animation: emoji-pulse 2s infinite; }
            .emoji-bounce { animation: emoji-bounce 1s infinite; }
            .emoji-rotate { animation: emoji-rotate 2s infinite linear; }
            .emoji-scale { animation: emoji-scale 1.5s infinite; }
          `}</style>
        </div>
      ) : (
        /* Regular Screen Content */
        <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">
          {/* Title */}
          {screen.placeholders?.includes('title') && screenData.title && (
            <h1
              className={`font-bold ${screenData.titleSize || 'text-3xl'}`}
              style={{ color: titleColor }}
            >
              {screenData.title}
            </h1>
          )}

          {/* Text */}
          {screen.placeholders?.includes('text') && screenData.text && (
            <p
              className="text-lg max-w-2xl leading-relaxed"
              style={{ color: textColor }}
            >
              {screenData.text}
            </p>
          )}

          {/* Images/Gallery */}
          {!isVideoMode && screenImages.length > 0 && (
            <div className="w-full max-w-2xl">
              <GalleryPreview
                images={screenImages}
                galleryLayout={screenData.galleryLayout || 'carousel'}
                projectId={project.id}
              />
            </div>
          )}

          {/* Video */}
          {isVideoMode && screenData.videoId && (
            <div className="w-full max-w-md">
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center shadow-lg">
                <div className="text-gray-500 text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <div className="text-sm">Video Preview</div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Indicator - only for non-main screens (music is heard, not shown) */}
          {screenAudio && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>🎵</span>
              <span>{screenAudio.filename}</span>
              {screenData.extendMusicToNext && (
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">Continues to next</span>
              )}
            </div>
          )}

          {/* Placeholder for empty screens */}
          {!screenData.title && !screenData.text && screenImages.length === 0 && !screenData.videoId && (
            <div className="text-gray-400 dark:text-gray-500 text-center">
              <div className="text-6xl mb-4">📄</div>
              <div className="text-lg">Screen content will appear here</div>
            </div>
          )}
        </div>
      )}

      {/* Screen Info Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm z-20">
        Screen {screen.order}: {screen.type}
      </div>
    </div>
  );
}