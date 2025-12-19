import { useState, useRef, useEffect } from 'react';
import type { CanvasElement } from '../../../../types/canvas';

interface TextElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdate: (element: CanvasElement) => void;
}

export function TextElement({ element, isSelected, onUpdate }: TextElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (isSelected) {
      setIsEditing(true);
      setEditValue(element.content || '');
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== element.content) {
      onUpdate({
        ...element,
        content: editValue,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(element.content || '');
      setIsEditing(false);
    }
  };

  const styles: React.CSSProperties = {
    fontFamily: element.style.fontFamily || 'Arial',
    fontSize: element.style.fontSize ? `${element.style.fontSize}px` : '24px',
    color: element.style.color || '#000000',
    fontWeight: element.style.fontWeight || 'normal',
    textAlign: element.style.textAlign || 'left',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    boxSizing: 'border-box',
    cursor: isSelected ? 'text' : 'default',
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={styles}
        className="border-2 border-fuchsia-500 rounded"
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={styles}
      className={isSelected ? 'ring-2 ring-fuchsia-500' : ''}
    >
      {element.content || 'Text'}
    </div>
  );
}
