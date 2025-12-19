# Performance Instrumentation Guide

This document describes the lightweight performance instrumentation added to help validate the findings in the performance investigation report.

## What Was Added

### 1. Preview Regeneration Tracking
**File:** `src/components/editor/PreviewStep.tsx`
- Logs when preview cache hits vs misses
- Measures preview generation time
- Tracks HTML size and image count

**Output:**
```
[PreviewStep] Cache miss, regenerating preview. Cache key changed: {...}
[PreviewStep] Preview generated in 234.56ms { htmlSize: 123456, imageCount: 15 }
```

### 2. Autosave Timing
**File:** `src/contexts/ProjectContext.tsx`
- Measures autosave execution time
- Logs project size and image count
- Tracks when autosave is triggered

**Output:**
```
[ProjectContext] Autosave triggered { projectId: "...", projectSizeBytes: 123456, imageCount: 15 }
[ProjectContext] Autosave completed in 45.67ms
```

### 3. localStorage Write Timing
**File:** `src/services/storageService.ts`
- Measures JSON.stringify time
- Measures localStorage.setItem time
- Logs total project size

**Output:**
```
[storageService] localStorage write {
  projectCount: 1,
  jsonSizeBytes: 123456,
  stringifyTime: "12.34ms",
  writeTime: "5.67ms",
  totalTime: "18.01ms"
}
```

### 4. ImagesStep Computation Tracking
**File:** `src/components/editor/ImagesStep.tsx`
- Warns if `getUsedImageIds()` takes > 1ms
- Logs image and screen counts

**Output:**
```
[ImagesStep] getUsedImageIds took 2.34ms { imageCount: 20, screenCount: 5, usedCount: 12 }
```

### 5. Text Update Timing
**File:** `src/components/editor/ScreenTextsStep.tsx`
- Warns if `updateScreenField()` takes > 5ms
- Helps identify slow updates during typing

**Output:**
```
[ScreenTextsStep] updateScreenField took 8.90ms
```

## How to Use

1. **Open browser DevTools Console**
2. **Enable performance logging:**
   - All instrumentation is wrapped in `if (import.meta.env.DEV)` checks
   - Only logs in development mode
3. **Perform actions:**
   - Type in text fields
   - Upload images
   - Switch tabs
   - Attach images to screens
4. **Observe console output:**
   - Look for slow operations (> 50ms)
   - Count preview regenerations during typing
   - Measure localStorage write times

## Performance Marks

The instrumentation also adds Performance API marks that can be viewed in Chrome DevTools:

1. Open Chrome DevTools → Performance tab
2. Record a session
3. Look for marks:
   - `preview-regeneration-start` / `preview-regeneration-end`
   - `autosave-start` / `autosave-end`
4. View measurements:
   - `preview-regeneration` - Time to generate preview HTML
   - `autosave` - Total autosave time

## How to Remove

All instrumentation is wrapped in `import.meta.env.DEV` checks, so it's automatically disabled in production builds.

To completely remove:

1. **Search for "PERFORMANCE INSTRUMENTATION" comments** in:
   - `src/components/editor/PreviewStep.tsx`
   - `src/contexts/ProjectContext.tsx`
   - `src/services/storageService.ts`
   - `src/components/editor/ImagesStep.tsx`
   - `src/components/editor/ScreenTextsStep.tsx`

2. **Remove the instrumentation blocks** (they're clearly marked with comments)

3. **Or use this one-liner to find all:**
   ```bash
   grep -r "PERFORMANCE INSTRUMENTATION" src/
   ```

## Expected Findings

Based on the investigation, you should see:

1. **Preview regenerations on every keystroke:**
   - Cache key changes due to `updatedAt` timestamp
   - Each regeneration takes 100-500ms with images

2. **localStorage writes blocking main thread:**
   - Writes take 10-50ms for projects with images
   - Blocks during JSON.stringify + localStorage.setItem

3. **Frequent autosave triggers:**
   - Every keystroke triggers debounced autosave (1s delay)
   - Autosave includes localStorage write

4. **Slow getUsedImageIds with many images:**
   - Should be < 1ms, but may spike with 20+ images

## Next Steps

1. **Capture baseline measurements** using this instrumentation
2. **Implement Priority 1-2 fixes** from the investigation report
3. **Re-measure** to validate improvements
4. **Remove instrumentation** once validation is complete
