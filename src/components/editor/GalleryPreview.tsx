import { useState, useEffect, useRef } from 'react';
import type { ImageData } from '../../types/project';

interface GalleryPreviewProps {
  images: ImageData[];
  galleryLayout: 'carousel' | 'gridWithZoom' | 'fullscreenSlideshow' | 'heroWithThumbnails' | 'timeline';
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  onImageClick?: (image: ImageData, index: number) => void;
  className?: string;
  isMobile?: boolean;
}

export function GalleryPreview({
  images,
  galleryLayout,
  currentIndex: controlledIndex,
  onIndexChange,
  onImageClick,
  className = '',
  isMobile = false,
}: GalleryPreviewProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const slideshowIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Use controlled index if provided, otherwise use internal state
  const currentIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const setCurrentIndex = (index: number) => {
    if (onIndexChange) {
      onIndexChange(index);
    } else {
      setInternalIndex(index);
    }
  };

  const handleImageClick = (image: ImageData, index: number) => {
    if (onImageClick) {
      onImageClick(image, index);
    } else {
      // Default: zoom the image
      setCurrentIndex(index);
    }
  };

  // Auto-play for fullscreen slideshow
  useEffect(() => {
    if (galleryLayout === 'fullscreenSlideshow' && images.length > 1 && !isPaused) {
      slideshowIntervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => {
        if (slideshowIntervalRef.current) {
          clearInterval(slideshowIntervalRef.current);
        }
      };
    }
  }, [galleryLayout, images.length, isPaused, setCurrentIndex]);

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-400 ${className}`}>
        <span>No images</span>
      </div>
    );
  }

  // Single image - show simple display
  if (images.length === 1) {
    return (
      <div className={className}>
        <img
          src={images[0].data}
          alt={images[0].filename}
          className="w-full h-auto object-contain rounded-lg cursor-pointer"
          onClick={() => handleImageClick(images[0], 0)}
        />
      </div>
    );
  }

  // Carousel layout
  if (galleryLayout === 'carousel') {
    const currentImage = images[currentIndex];
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <div className="relative flex-1 min-h-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          <img
            src={currentImage.data}
            alt={currentImage.filename}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => handleImageClick(currentImage, currentIndex)}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 text-gray-700 rounded-full w-9 h-9 flex items-center justify-center border border-gray-200 shadow-sm hover:bg-white"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 text-gray-700 rounded-full w-9 h-9 flex items-center justify-center border border-gray-200 shadow-sm hover:bg-white"
            aria-label="Next image"
          >
            ›
          </button>
        </div>
        <div className="flex-none">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <img
                key={image.id}
                src={image.data}
                alt={image.filename}
                className={`object-contain rounded cursor-pointer border-2 transition-colors bg-gray-100 ${
                  isMobile ? 'w-16 h-16' : 'w-14 h-14'
                } ${
                  index === currentIndex
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            {currentIndex + 1} / {images.length}
          </p>
        </div>
      </div>
    );
  }

  // Grid with Zoom layout
  if (galleryLayout === 'gridWithZoom') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer group"
            onClick={() => handleImageClick(image, index)}
          >
            <img
              src={image.data}
              alt={image.filename}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ))}
      </div>
    );
  }

  // Fullscreen Slideshow layout
  if (galleryLayout === 'fullscreenSlideshow') {
    return (
      <div
        className={`relative w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden bg-gray-100 ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative w-full h-full">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-opacity duration-800 ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={image.data}
                alt={image.filename}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => handleImageClick(image, index)}
              />
            </div>
          ))}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/80 z-20"
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-black/80 z-20"
          aria-label="Next image"
        >
          ›
        </button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm z-20">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    );
  }

  // Hero with Thumbnails layout
  if (galleryLayout === 'heroWithThumbnails') {
    const heroImage = images[currentIndex];
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <div className="relative w-full rounded-lg bg-gray-100 overflow-hidden">
          <img
            src={heroImage.data}
            alt={heroImage.filename}
            className="w-full h-auto max-h-[60vh] object-contain cursor-pointer"
            onClick={() => handleImageClick(heroImage, currentIndex)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 justify-center flex-wrap">
          {images.map((image, index) => (
            <img
              key={image.id}
              src={image.data}
              alt={image.filename}
              className={`object-cover rounded-lg cursor-pointer border-2 transition-all w-20 h-20 sm:w-24 sm:h-24 ${
                index === currentIndex
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Timeline layout
  if (galleryLayout === 'timeline') {
    return (
      <div className={`flex flex-col gap-6 max-w-2xl mx-auto ${className}`}>
        {images.map((image, index) => (
          <div key={image.id} className="flex gap-4 items-start relative">
            <div className="flex-shrink-0 w-32 h-32 sm:w-48 sm:h-48 rounded-xl overflow-hidden bg-gray-100 shadow-md cursor-pointer">
              <img
                src={image.data}
                alt={image.filename}
                className="w-full h-full object-cover"
                onClick={() => handleImageClick(image, index)}
              />
            </div>
            <div className="flex-1 pt-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg mb-2">
                {index + 1}
              </div>
            </div>
            {index < images.length - 1 && (
              <div className="absolute left-16 sm:left-24 top-32 sm:top-48 bottom-0 w-0.5 bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Fallback (should not reach here)
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        {images.map((image) => (
          <img
            key={image.id}
            src={image.data}
            alt={image.filename}
            className="w-full h-32 object-cover rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
