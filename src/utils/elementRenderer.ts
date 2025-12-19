import type { CanvasElement } from '../types/canvas';
import type { ScreenData } from '../types/project';

// CSS properties type (compatible with React.CSSProperties)
type CSSProperties = Record<string, string | number | undefined>;

export interface MediaUrls {
  images: Map<string, string>;
  audio: Map<string, string>;
  videos: Map<string, string>;
}

export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Calculate element styles from percentage-based position/size
 */
export function calculateElementStyles(
  element: CanvasElement,
  canvasSize: CanvasSize
): CSSProperties {
  const x = (element.position.x / 100) * canvasSize.width;
  const y = (element.position.y / 100) * canvasSize.height;
  const width = (element.size.width / 100) * canvasSize.width;
  const height = (element.size.height / 100) * canvasSize.height;

  const styles: React.CSSProperties = {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: element.zIndex,
  };

  if (element.rotation) {
    styles.transform = `rotate(${element.rotation}deg)`;
  }

  // Apply type-specific styles
  if (element.type === 'text') {
    styles.fontFamily = element.style.fontFamily || 'inherit';
    styles.fontSize = element.style.fontSize ? `${element.style.fontSize}px` : undefined;
    styles.color = element.style.color || '#000000';
    styles.fontWeight = element.style.fontWeight || 'normal';
    styles.textAlign = element.style.textAlign || 'left';
  } else if (element.type === 'image') {
    styles.borderRadius = element.style.borderRadius ? `${element.style.borderRadius}px` : undefined;
    styles.borderWidth = element.style.borderWidth ? `${element.style.borderWidth}px` : undefined;
    styles.borderColor = element.style.borderColor || undefined;
    styles.opacity = element.style.opacity ?? 1;
    if (element.style.shadow) {
      styles.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    }
  }

  return styles;
}

/**
 * Calculate element styles from percentage-based position/size
 * This is used by both editor (React components) and export (HTML string)
 */

/**
 * Render screen elements as HTML string (export mode)
 */
export function renderScreenElementsExport(
  screen: ScreenData,
  elements: CanvasElement[],
  mediaUrls: MediaUrls,
  canvasSize: CanvasSize
): string {
  if (!elements || elements.length === 0) {
    return '';
  }

  // Sort by zIndex
  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  return sortedElements
    .map((element) => {
      const x = (element.position.x / 100) * canvasSize.width;
      const y = (element.position.y / 100) * canvasSize.height;
      const width = (element.size.width / 100) * canvasSize.width;
      const height = (element.size.height / 100) * canvasSize.height;

      let styleStr = `position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; z-index: ${element.zIndex};`;
      
      if (element.rotation) {
        styleStr += ` transform: rotate(${element.rotation}deg);`;
      }

      // Type-specific styles
      if (element.type === 'text') {
        styleStr += ` font-family: ${element.style.fontFamily || 'inherit'};`;
        if (element.style.fontSize) styleStr += ` font-size: ${element.style.fontSize}px;`;
        styleStr += ` color: ${element.style.color || '#000000'};`;
        styleStr += ` font-weight: ${element.style.fontWeight || 'normal'};`;
        styleStr += ` text-align: ${element.style.textAlign || 'left'};`;
      } else if (element.type === 'image') {
        if (element.style.borderRadius) styleStr += ` border-radius: ${element.style.borderRadius}px;`;
        if (element.style.borderWidth) styleStr += ` border-width: ${element.style.borderWidth}px;`;
        if (element.style.borderColor) styleStr += ` border-color: ${element.style.borderColor}; border-style: solid;`;
        styleStr += ` opacity: ${element.style.opacity ?? 1};`;
        if (element.style.shadow) styleStr += ` box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);`;
      }

      switch (element.type) {
        case 'text':
          return `<div style="${styleStr}">${element.content || 'Text'}</div>`;
        case 'image':
          const imageUrl = element.mediaId ? mediaUrls.images.get(element.mediaId) : undefined;
          if (imageUrl) {
            return `<div style="${styleStr}"><img src="${imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;" /></div>`;
          }
          return `<div style="${styleStr}; background-color: #e5e7eb;"></div>`;
        default:
          return `<div style="${styleStr}">${element.type}</div>`;
      }
    })
    .join('\n');
}
