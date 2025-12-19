import { useState } from 'react';
import type { CanvasElement } from '../../../types/canvas';
import type { CanvasSize } from '../../../utils/elementRenderer';
import { Button } from '../../ui/Button';
import { Type, Image, ChevronUp, ChevronDown } from 'lucide-react';

interface AddElementPanelProps {
  onAddElement: (element: CanvasElement) => void;
  canvasSize: CanvasSize;
  selectedElementId: string | null;
}

export function AddElementPanel({ onAddElement, canvasSize, selectedElementId }: AddElementPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleAddText = () => {
    const element: CanvasElement = {
      id: generateId(),
      type: 'text',
      position: { x: 10, y: 10 }, // 10% from top-left
      size: { width: 80, height: 10 }, // 80% width, 10% height
      zIndex: 1,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
      },
      content: 'New Text',
    };
    onAddElement(element);
  };

  const handleAddImage = () => {
    const element: CanvasElement = {
      id: generateId(),
      type: 'image',
      position: { x: 10, y: 10 }, // 10% from top-left
      size: { width: 50, height: 50 }, // 50% width, 50% height
      zIndex: 1,
      style: {
        borderRadius: 0,
        borderWidth: 0,
        borderColor: '#000000',
        shadow: false,
        opacity: 1,
      },
    };
    onAddElement(element);
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Add Element</h3>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>
      {isExpanded && (
        <div className="p-4 space-y-2 border-t border-slate-200 dark:border-slate-700">
          <Button
            onClick={handleAddText}
            variant="secondary"
            className="w-full flex items-center gap-2 justify-start"
          >
            <Type className="w-4 h-4" />
            Add Text
          </Button>
          <Button
            onClick={handleAddImage}
            variant="secondary"
            className="w-full flex items-center gap-2 justify-start"
          >
            <Image className="w-4 h-4" />
            Add Image
          </Button>
        </div>
      )}
    </div>
  );
}
