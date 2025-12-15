import React, { useRef, useState } from 'react';
import type { ProcessedAudio } from '../../utils/audioProcessor';
import { processAudio } from '../../utils/audioProcessor';
import { MediaConfig } from '../../config/mediaConfig';

interface AudioUploadProps {
  onUpload: (audio: ProcessedAudio) => void | Promise<void>;
  accept?: string;
  label?: string;
}

export function AudioUpload({ onUpload, accept = 'audio/mpeg,audio/mp3', label }: AudioUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // Check file size before processing to show warning early
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MediaConfig.AUDIO_WARNING_SIZE_MB) {
        const proceed = confirm(
          `Audio file is large (${fileSizeMB.toFixed(1)}MB). Large files may affect sharing and loading times. Do you want to continue?`
        );
        if (!proceed) {
          setIsProcessing(false);
          return;
        }
      }

      const audioData = await processAudio(file);
      onUpload(audioData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing audio:', error);
      
      // Provide more specific error messages
      if (errorMessage.includes('Failed to read')) {
        alert(`Failed to read audio file "${file.name}". The file may be corrupted or too large for your browser to handle.`);
      } else {
        alert(`Failed to process audio file "${file.name}": ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
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
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'
        }`}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={isProcessing}
        />
        {isProcessing ? (
          <p className="text-gray-500">Processing audio...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">Click to upload audio file</p>
            <p className="text-sm text-gray-500">
              Recommended: Compress audio files before uploading
            </p>
          </>
        )}
      </div>
    </div>
  );
}

