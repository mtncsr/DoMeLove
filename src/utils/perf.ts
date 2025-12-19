/**
 * Performance measurement utilities (DEV only)
 * All functions no-op in production builds
 */

export function perfMark(name: string): void {
  if (import.meta.env.DEV && typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

export function perfMeasure(name: string, startMark: string, endMark: string): void {
  if (import.meta.env.DEV && typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
    } catch (e) {
      // Mark might not exist, ignore
    }
  }
}

export function perfNow(): number {
  if (import.meta.env.DEV && typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
}

export function logPerf(label: string, data?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    if (data) {
      console.log(`[PERF] ${label}`, data);
    } else {
      console.log(`[PERF] ${label}`);
    }
  }
}
