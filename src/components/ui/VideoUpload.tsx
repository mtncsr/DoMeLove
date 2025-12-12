import React, { useRef, useState } from 'react';
import type { VideoData } from '../../types/project';
import { processVideo } from '../../utils/videoProcessor';
import { MediaConfig } from '../../config/mediaConfig';

interface VideoUploadProps {
  onUpload: (video: VideoData, blob: Blob) => Promise<void> | void;
  accept?: string;
  label?: string;
}

export function VideoUpload({ onUpload, accept = 'video/mp4,video/webm', label }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;
    setIsProcessing(true);
    const nextErrors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const { videoData, blob } = await processVideo(file);
        await onUpload(videoData, blob);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        nextErrors.push(`"${file.name}": ${message}`);
      }
    }

    setErrors(nextErrors);
    setIsProcessing(false);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={onChange}
          className="hidden"
          disabled={isProcessing}
        />
        {isProcessing ? (
          <p className="text-gray-500">Processing video...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              Drag and drop videos here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Max duration {MediaConfig.VIDEO_MAX_DURATION_SECONDS}s, max size {MediaConfig.VIDEO_MAX_SIZE_MB}MB each
            </p>
          </>
        )}
      </div>
      {errors.length > 0 && (
        <div className="mt-3 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700 space-y-1">
          {errors.map((err) => (
            <div key={err}>{err}</div>
          ))}
        </div>
      )}
    </div>
  );
}


