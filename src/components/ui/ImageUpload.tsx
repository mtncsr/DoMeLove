import React, { useRef, useState } from 'react';
import { processImage, type ProcessedImage } from '../../utils/imageProcessor';

interface ImageUploadProps {
  onUpload: (image: ProcessedImage) => void | Promise<void>;
  onMultipleUpload?: (images: ProcessedImage[]) => void | Promise<void>;
  multiple?: boolean;
  accept?: string;
  label?: string;
}

// Concurrency limit: process this many images simultaneously
const CONCURRENT_LIMIT = 8;

export function ImageUpload({ onUpload, onMultipleUpload: _onMultipleUpload, multiple = false, accept = 'image/*', label }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  // Process images with concurrency limiting - upload each image immediately as it's processed
  const processImagesProgressively = async (files: File[]) => {
    const total = files.length;
    let processed = 0;
    let successful = 0;
    let failed = 0;
    const failedFiles: Array<{ filename: string; error: string }> = [];

    // Process files in batches to limit concurrency
    for (let i = 0; i < files.length; i += CONCURRENT_LIMIT) {
      const batch = files.slice(i, i + CONCURRENT_LIMIT);

      // Process batch in parallel
      const batchPromises = batch.map(async (file) => {
        try {
          const processedImage = await processImage(file);
          processed++;
          successful++;
          setProgress({ current: processed, total });

          // Upload image immediately as it's processed - images will appear progressively
          // The queue system in handleImageUpload will handle concurrent updates safely
          await onUpload(processedImage);

          return { success: true, processedImage, filename: file.name };
        } catch (error) {
          processed++;
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedFiles.push({ filename: file.name, error: errorMessage });
          setProgress({ current: processed, total });

          console.error(`Error processing image ${file.name}:`, error);
          return { success: false, error: errorMessage, filename: file.name };
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);

      // Yield to browser between batches for better responsiveness
      if (i + CONCURRENT_LIMIT < files.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Show summary of failures
    if (failedFiles.length > 0) {
      const errorMessage = failedFiles.length === 1
        ? `Failed to process "${failedFiles[0].filename}": ${failedFiles[0].error}`
        : `${failedFiles.length} images failed to process. Check console for details.`;
      console.error('Failed images:', failedFiles);
      alert(errorMessage);
    }

    return { successful, failed };
  };

  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });
    const fileArray = Array.from(files);

    try {
      await processImagesProgressively(fileArray);
    } catch (error) {
      console.error('Error in handleFiles:', error);
      alert('An unexpected error occurred while processing images.');
    } finally {
      setIsProcessing(false);
      setProgress(null);
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
        {isProcessing && progress ? (
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">
              Processing images... {progress.current} / {progress.total}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Images will appear as they are processed...
            </p>
          </div>
        ) : isProcessing ? (
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