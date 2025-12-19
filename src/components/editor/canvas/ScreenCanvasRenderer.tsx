import { useMemo } from 'react';
import type { ScreenData } from '../../../types/project';
import type { CanvasElement } from '../../../types/canvas';
import type { MediaUrls, CanvasSize } from '../../../utils/elementRenderer';
import { DraggableResizableElement } from './DraggableResizableElement';
import { TextElement } from './elements/TextElement';
import { ImageElement } from './elements/ImageElement';

interface ScreenCanvasRendererProps {
  screen: ScreenData;
  elements: CanvasElement[];
  mediaUrls: MediaUrls;
  canvasSize: CanvasSize;
  selectedElementId: string | null;
  onElementSelect: (elementId: string | null) => void;
  onElementUpdate: (element: CanvasElement) => void;
}

export function ScreenCanvasRenderer({
  screen,
  elements,
  mediaUrls,
  canvasSize,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
}: ScreenCanvasRendererProps) {
  // Wrap each element in DraggableResizableElement
  const wrappedElements = useMemo(() => {
    if (!elements || elements.length === 0) return null;

    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    return sortedElements.map((element) => {
      const isSelected = selectedElementId === element.id;

      // Render the element content
      let elementContent: React.ReactNode;
      const styles = {
        width: '100%',
        height: '100%',
        pointerEvents: 'none' as const,
      };

      switch (element.type) {
        case 'text':
          elementContent = (
            <TextElement
              element={element}
              isSelected={isSelected}
              onUpdate={onElementUpdate}
            />
          );
          break;
        case 'image':
          elementContent = (
            <ImageElement
              element={element}
              isSelected={isSelected}
              onUpdate={onElementUpdate}
              mediaUrls={mediaUrls.images}
            />
          );
          break;
        default:
          elementContent = <div style={styles}>{element.type}</div>;
      }

      return (
        <DraggableResizableElement
          key={element.id}
          element={element}
          canvasSize={canvasSize}
          onUpdate={onElementUpdate}
          onSelect={() => onElementSelect(element.id)}
          isSelected={isSelected}
        >
          {elementContent}
        </DraggableResizableElement>
      );
    });
  }, [elements, mediaUrls, canvasSize, selectedElementId, onElementSelect, onElementUpdate]);

  return (
    <div
      className="relative bg-white"
      style={{
        width: `${canvasSize.width}px`,
        height: `${canvasSize.height}px`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {wrappedElements}
    </div>
  );
}
