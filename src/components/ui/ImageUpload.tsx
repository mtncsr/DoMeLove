import React, { useRef, useState } from 'react';
import type { ImageData } from '../../types/project';
import { processImage, formatFileSize } from '../../utils/imageProcessor';

interface ImageUploadProps {
  onUpload: (image: ImageData) => void;
  onMultipleUpload?: (images: ImageData[]) => void;
  multiple?: boolean;
  accept?: string;
  label?: string;
}

export function ImageUpload({ onUpload, onMultipleUpload, multiple = false, accept = 'image/*', label }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const fileArray = Array.from(files);
    
    try {
      // Process all files in parallel and collect results
      const imagePromises = fileArray.map((file) => 
        processImage(file)
          .then((imageData) => ({ success: true, imageData, filename: file.name }))
          .catch((error) => ({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            filename: file.name 
          }))
      );
      
      const results = await Promise.all(imagePromises);
      
      // Separate successful and failed images
      const successfulImages: ImageData[] = [];
      const failedFiles: Array<{ filename: string; error: string }> = [];
      
      results.forEach((result) => {
        if (result.success && result.imageData) {
          successfulImages.push(result.imageData);
        } else {
          failedFiles.push({ filename: result.filename, error: result.error });
        }
      });
      
      // Show errors for failed files
      if (failedFiles.length > 0) {
        failedFiles.forEach(({ filename, error }) => {
          console.error(`Error processing image ${filename}:`, error);
          alert(`Failed to process "${filename}": ${error}`);
        });
      }
      
      // Upload all successful images at once
      if (successfulImages.length > 0) {
        if (onMultipleUpload && successfulImages.length > 1) {
          // Batch upload for multiple images
          onMultipleUpload(successfulImages);
        } else {
          // Single upload for one image or if batch not available
          successfulImages.forEach(img => onUpload(img));
        }
      }
      
      const successCount = successfulImages.length;
      const failCount = failedFiles.length;
      
      if (failCount > 0 && successCount > 0) {
        console.log(`Processed ${successCount} image(s) successfully, ${failCount} failed`);
      } else if (failCount > 0 && successCount === 0) {
        console.log(`All ${failCount} image(s) failed to process`);
      }
    } catch (error) {
      console.error('Error in handleFiles:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = e.target.files;
      handleFiles(files);
      // Reset input to allow selecting same files again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />
        {isProcessing ? (
          <p className="text-gray-500">Processing image...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              Drag and drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Recommended: Images will be compressed to ~100-200KB each
            </p>
          </>
        )}
      </div>
    </div>
  );
}


