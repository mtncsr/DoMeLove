import type { Project } from '../../types/project';
import type { TemplateMeta, ScreenConfig } from '../../types/template';
import { GalleryPreview } from './GalleryPreview';

interface ScreenPreviewProps {
  screen: ScreenConfig;
  project: Project;
  templateMeta: TemplateMeta | null;
  className?: string;
}

export function ScreenPreview({ screen, project, templateMeta, className = '' }: ScreenPreviewProps) {
  const screenData = project.data.screens[screen.screenId] || {};
  const mediaMode = screenData.mediaMode || 'classic';
  const isVideoMode = mediaMode === 'video';

  // Get screen images
  const screenImages = (screenData.images || [])
    .map((id: string) => project.data.images.find((img) => img.id === id))
    .filter((img) => img !== undefined);

  // Get screen audio
  const screenAudio = project.data.audio.screens[screen.screenId];

  // Get template design config
  const designConfig = templateMeta?.designConfig;

  // Apply template background or custom background
  let backgroundStyle = {};
  if (screenData.customBackground === 'custom') {
    if (screenData.backgroundGradient) {
      backgroundStyle = { background: screenData.backgroundGradient };
    } else if (screenData.backgroundColor) {
      backgroundStyle = { backgroundColor: screenData.backgroundColor };
    }
  } else {
    backgroundStyle = designConfig?.background ? { background: designConfig.background } : {};
  }

  return (
    <div
      className={`relative w-full h-full min-h-[600px] rounded-lg overflow-hidden border-2 border-gray-200 ${className}`}
      style={backgroundStyle}
    >
      {/* Screen Content */}
      <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-6">

        {/* Title */}
        {screen.placeholders?.includes('title') && screenData.title && (
          <h1
            className={`font-bold ${screenData.titleSize || 'text-3xl'}`}
            style={{ color: screenData.titleColor || '#000000' }}
          >
            {screenData.title}
          </h1>
        )}

        {/* Text */}
        {screen.placeholders?.includes('text') && screenData.text && (
          <p
            className="text-lg max-w-2xl leading-relaxed"
            style={{ color: screenData.textColor || '#374151' }}
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
              onImageClick={(image, index) => {
                // Optional: Add zoom functionality here if needed
              }}
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

        {/* Audio Indicator */}
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

      {/* Screen Info Overlay */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
        Screen {screen.order}: {screen.type}
      </div>
    </div>
  );
}