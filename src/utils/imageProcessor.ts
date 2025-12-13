import { MediaConfig } from '../config/mediaConfig';
import type { ImageData } from '../types/project';

export async function processImage(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error(`Invalid file type: ${file.type}. Please select an image file.`));
      return;
    }

    // Check file size (warn if very large, but still try to process)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      reject(new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 50MB.`));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calculate new dimensions (max 1600px, preserve aspect ratio)
          let width = img.width;
          let height = img.height;
          const maxDimension = MediaConfig.IMAGE_MAX_DIMENSION;
          
          // Validate image dimensions
          if (width === 0 || height === 0) {
            reject(new Error('Invalid image dimensions'));
            return;
          }
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: false });
          
          if (!ctx) {
            reject(new Error('Could not get canvas context. Your browser may not support image processing.'));
            return;
          }
          
          // Set image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP with compression
          const quality = MediaConfig.IMAGE_COMPRESSION_QUALITY;
          let dataUrl: string;
          
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
          } catch (error) {
            // Fallback: try without quality parameter
            try {
              dataUrl = canvas.toDataURL('image/webp');
            } catch (fallbackError) {
              reject(new Error('Failed to convert image to WebP format. Your browser may not support WebP encoding.'));
              return;
            }
          }
          
          // Validate data URL
          if (!dataUrl || dataUrl.length < 100) {
            reject(new Error('Failed to generate image data. The image may be corrupted.'));
            return;
          }
          
          // Extract Base64 data
          const base64Data = dataUrl.split(',')[1];
          if (!base64Data) {
            reject(new Error('Failed to extract image data'));
            return;
          }
          
          // Calculate size
          const size = Math.round((base64Data.length * 3) / 4);
          
          // Generate a truly unique ID using timestamp, random string, and performance counter
          const uniqueId = `img_${Date.now()}_${performance.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const imageData: ImageData = {
            id: uniqueId,
            data: dataUrl, // Full data URL for easy use
            filename: file.name,
            size,
            width: Math.round(width),
            height: Math.round(height),
          };
          
          resolve(imageData);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error processing image';
          reject(new Error(`Image processing failed: ${errorMessage}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image "${file.name}". The file may be corrupted or in an unsupported format.`));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file data'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file "${file.name}". The file may be corrupted or inaccessible.`));
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Failed to start reading file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

export function getImageSizeKB(image: ImageData): number {
  return Math.round(image.size / 1024);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


