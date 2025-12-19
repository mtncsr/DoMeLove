import { useState, useEffect, useMemo } from 'react';
import { useProject } from '../../../contexts/ProjectContext';
import { useCanvasElements } from '../../../hooks/useCanvasElements';
import { ScreenCanvasRenderer } from '../canvas/ScreenCanvasRenderer';
import { AddElementPanel } from '../canvas/AddElementPanel';
import type { MediaUrls } from '../../../utils/elementRenderer';
import { getMediaPreviewUrl } from '../../../services/mediaService';
import { Minus, Plus, Smartphone, Monitor } from 'lucide-react';

export function ScreensCanvasView({ screenId }: { screenId: string }) {
  const { currentProject } = useProject();
  const { elements, addElement, updateElement, deleteElement } = useCanvasElements(screenId);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [isMobileView, setIsMobileView] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<MediaUrls>({
    images: new Map(),
    audio: new Map(),
    videos: new Map(),
  });

  const screen = currentProject?.data.screens[screenId];

  // Load media URLs
  useEffect(() => {
    if (!currentProject) return;

    const loadMediaUrls = async () => {
      const imageMap = new Map<string, string>();
      const audioMap = new Map<string, string>();
      const videoMap = new Map<string, string>();

      // Load image URLs
      if (currentProject.data.images) {
        for (const image of currentProject.data.images) {
          try {
            const url = await getMediaPreviewUrl(currentProject.id, image.id);
            if (url) {
              imageMap.set(image.id, url);
            }
          } catch (error) {
            console.warn(`Failed to load image ${image.id}:`, error);
          }
        }
      }

      setMediaUrls({ images: imageMap, audio: audioMap, videos: videoMap });
    };

    loadMediaUrls();
  }, [currentProject]);

  const canvasSize = useMemo(() => {
    return isMobileView ? { width: 375, height: 667 } : { width: 800, height: 600 };
  }, [isMobileView]);

  const adjustZoom = (delta: number) => {
    setZoom((prev) => Math.max(25, Math.min(200, prev + delta)));
  };

  const handleElementSelect = (elementId: string | null) => {
    setSelectedElementId(elementId);
  };

  const handleElementUpdate = (element: typeof elements[0]) => {
    updateElement(element);
  };

  const handleDeleteSelected = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
      setSelectedElementId(null);
    }
  };

  // Delete on Backspace/Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedElementId) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId]);

  if (!currentProject || !screen) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Screen not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjustZoom(-10)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-16 text-center text-sm font-medium">{zoom}%</span>
          <button
            onClick={() => adjustZoom(10)}
            className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setIsMobileView(!isMobileView)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isMobileView
              ? 'bg-fuchsia-600 text-white'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {isMobileView ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span>{isMobileView ? 'Mobile' : 'Desktop'}</span>
        </button>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-8">
        <div className="inline-block" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
          <div onClick={() => setSelectedElementId(null)}>
            <ScreenCanvasRenderer
              screen={screen}
              elements={elements}
              mediaUrls={mediaUrls}
              canvasSize={canvasSize}
              selectedElementId={selectedElementId}
              onElementSelect={handleElementSelect}
              onElementUpdate={handleElementUpdate}
            />
          </div>
        </div>
      </div>

      {/* Add Element Panel */}
      <AddElementPanel
        onAddElement={addElement}
        canvasSize={canvasSize}
        selectedElementId={selectedElementId}
      />
    </div>
  );
}
