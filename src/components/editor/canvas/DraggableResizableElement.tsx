import { Rnd } from 'react-rnd';
import type { CanvasElement } from '../../../types/canvas';
import type { CanvasSize } from '../../../utils/elementRenderer';

interface DraggableResizableElementProps {
  element: CanvasElement;
  canvasSize: CanvasSize;
  onUpdate: (element: CanvasElement) => void;
  onSelect: () => void;
  isSelected: boolean;
  children: React.ReactNode;
}

export function DraggableResizableElement({
  element,
  canvasSize,
  onUpdate,
  onSelect,
  isSelected,
  children,
}: DraggableResizableElementProps) {
  // Convert percentage to pixels for react-rnd
  const x = (element.position.x / 100) * canvasSize.width;
  const y = (element.position.y / 100) * canvasSize.height;
  const width = (element.size.width / 100) * canvasSize.width;
  const height = (element.size.height / 100) * canvasSize.height;

  const handleDragStop = (_e: any, d: { x: number; y: number }) => {
    // Convert pixels back to percentages
    const newX = (d.x / canvasSize.width) * 100;
    const newY = (d.y / canvasSize.height) * 100;

    onUpdate({
      ...element,
      position: { x: newX, y: newY },
    });
  };

  const handleResizeStop = (_e: any, _direction: any, ref: HTMLElement, _delta: any, position: { x: number; y: number }) => {
    // Convert pixels back to percentages
    const newX = (position.x / canvasSize.width) * 100;
    const newY = (position.y / canvasSize.height) * 100;
    const newWidth = (ref.offsetWidth / canvasSize.width) * 100;
    const newHeight = (ref.offsetHeight / canvasSize.height) * 100;

    onUpdate({
      ...element,
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight },
    });
  };

  return (
    <Rnd
      size={{ width, height }}
      position={{ x, y }}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        zIndex: element.zIndex,
        border: isSelected ? '2px solid #f472b6' : '2px solid transparent',
        boxSizing: 'border-box',
      }}
      bounds="parent"
    >
      {children}
    </Rnd>
  );
}
