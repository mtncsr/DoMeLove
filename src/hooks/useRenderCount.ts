import { useEffect, useRef } from 'react';

/**
 * Hook to track and log component render counts (DEV only)
 * Throttled to avoid flooding console - logs every N renders or via requestAnimationFrame
 */
export function useRenderCount(componentName: string, throttleInterval: number = 10): void {
  const renderCountRef = useRef(0);
  const lastLogTimeRef = useRef(0);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    renderCountRef.current += 1;
    const now = Date.now();

    // Log every N renders or if enough time has passed
    if (
      renderCountRef.current % throttleInterval === 0 ||
      now - lastLogTimeRef.current > 2000
    ) {
      requestAnimationFrame(() => {
        console.log(`[RENDER] ${componentName} rendered ${renderCountRef.current} times`);
      });
      lastLogTimeRef.current = now;
    }
  });
}
