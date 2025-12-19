# Editor Performance Investigation Report

**Date:** 2025-01-27  
**Investigator:** Performance Engineering Analysis  
**Product:** DoMeLove Interactive Gift Editor  
**Technology Stack:** React + TypeScript (Vite)

---

## 1. Executive Summary

### Primary Suspected Root Causes

1. **Preview regeneration on every keystroke** (HIGH CONFIDENCE)
   - Evidence: `PreviewStep.tsx:62` - cache key includes `currentProject.updatedAt`, which changes on every `updateProject` call
   - Impact: Full HTML regeneration + media URL resolution triggered by typing
   - File: `src/components/editor/PreviewStep.tsx:30-62`

2. **Synchronous localStorage writes blocking main thread** (HIGH CONFIDENCE)
   - Evidence: `ProjectContext.tsx:63-86` - autosave effect triggers on every `currentProject` change (including `updatedAt` timestamp)
   - Impact: Main thread blocked during localStorage serialization of entire projects array
   - File: `src/contexts/ProjectContext.tsx:63-86`, `src/services/storageService.ts:28-35`

3. **Unmemoized ProjectContext provider value causing cascade re-renders** (HIGH CONFIDENCE)
   - Evidence: `ProjectContext.tsx:311-327` - provider value object recreated on every render
   - Impact: All editor components re-render on every project update
   - File: `src/contexts/ProjectContext.tsx:311-327`

4. **Deep object cloning on every update** (MEDIUM CONFIDENCE)
   - Evidence: `ProjectContext.tsx:146-189` - `updateProject` creates new objects for entire project structure
   - Impact: Memory pressure and GC pauses, especially with many images
   - File: `src/contexts/ProjectContext.tsx:146-189`

### Secondary Contributors

- **No memoization in ImagesStep**: `getUsedImageIds()` and `getScreensForImage()` computed on every render (`src/components/editor/ImagesStep.tsx:107-161`)
- **Synchronous blob-to-dataURL conversion**: `mediaService.ts:107-119` uses FileReader in main thread
- **No virtualization for image grids**: All images rendered at once (`src/components/editor/ImagesStep.tsx:285-322`)
- **EditorContext recalculates steps on every project change**: `EditorContext.tsx:130-136` depends on entire project object

### Biggest "Quick Win"

**Debounce preview regeneration separately from autosave** (Effort: Low, Impact: High)
- Change `PreviewStep.tsx` cache key to exclude `updatedAt` for text-only changes
- Use `startTransition` for preview updates
- Expected: 80-90% reduction in preview regeneration during typing

### Biggest "Structural Fix"

**Memoize ProjectContext provider value and split state updates** (Effort: Medium, Impact: Very High)
- Memoize provider value object
- Split project metadata from project data in state
- Use selective updates instead of full object cloning
- Expected: 50-70% reduction in unnecessary re-renders

---

## 2. Reproduction & Observations

### Steps to Reproduce

1. Create a new project or open existing project
2. Navigate to "Content" step → "Images" tab
3. Upload 10-20 images (2-5MB each)
4. Navigate to "Screens" step → "Screen Texts" tab
5. Type in any text input field
6. Observe: Typing becomes laggy, tab switching is slow, image selection is delayed

### Thresholds

**Based on code analysis (not yet measured):**

- **Image count threshold**: Likely 10-15 images where degradation becomes noticeable
- **Total data size**: Likely 20-30MB of image data in IndexedDB
- **Typing lag**: Becomes noticeable after 5-10 images uploaded

**Hypothesis for thresholds:**
- Each image metadata adds ~200-500 bytes to project JSON
- localStorage write time scales with total project size
- Preview regeneration resolves ALL media URLs, even for unchanged images

### CPU vs Memory vs Main-Thread Symptoms

**Main-thread blocking (PRIMARY):**
- Synchronous localStorage writes (`storageService.ts:30`)
- Synchronous blob-to-dataURL conversion (`mediaService.ts:107-119`)
- Preview HTML generation in main thread (`giftRenderPipeline.ts:260-331`)

**CPU-bound:**
- Deep object cloning on every update (`ProjectContext.tsx:146-189`)
- Preview HTML string concatenation (`exportBuilder.ts:137-183`)
- Image grid rendering without virtualization (`ImagesStep.tsx:285-322`)

**Memory-bound:**
- Multiple blob URL references not revoked promptly
- Large project objects kept in React state
- Preview HTML cache grows unbounded (has LRU but 50-entry limit may be too high)

---

## 3. Profiling Results

### 3.1 React Profiler Findings

**Note:** Actual profiling should be performed with React DevTools. Below are predictions based on code analysis.

#### Top Components by Render Time (Predicted)

1. **PreviewStep** (`src/components/editor/PreviewStep.tsx`)
   - Render time: High (async HTML generation)
   - Render count: Every `currentProject.updatedAt` change
   - Why: Regenerates HTML on every project update

2. **ImagesStep** (`src/components/editor/ImagesStep.tsx`)
   - Render time: Medium-High (renders all images + nested loops)
   - Render count: Every project update
   - Why: No memoization, computes `getUsedImageIds()` on every render

3. **EditorContent** (`src/pages/Editor.tsx:41`)
   - Render time: Medium (parent component)
   - Render count: Every project update
   - Why: Consumes `currentProject` from context

4. **ScreenTextsStep** (`src/components/editor/ScreenTextsStep.tsx`)
   - Render time: Low-Medium
   - Render count: Every keystroke
   - Why: Calls `updateProject` on every `onChange`

5. **ImageThumb** (`src/components/editor/ImagesStep.tsx:328-342`)
   - Render time: Low (per image)
   - Render count: N × project updates (N = number of images)
   - Why: Not memoized, re-renders when parent re-renders

#### Specific Props/State Causing Re-renders

**ProjectContext value identity:**
- Location: `src/contexts/ProjectContext.tsx:311-327`
- Issue: Provider value object recreated on every render
- Impact: All `useProject()` consumers re-render

**currentProject.updatedAt:**
- Location: `src/contexts/ProjectContext.tsx:159-162`
- Issue: Timestamp changes on every update, invalidates preview cache
- Impact: `PreviewStep` regenerates HTML unnecessarily

**Project data object identity:**
- Location: `src/contexts/ProjectContext.tsx:146-189`
- Issue: New object created via spread operator on every update
- Impact: All components receiving project data re-render

### 3.2 Chrome Performance Findings

**Note:** Actual performance traces should be captured. Below are predictions based on code analysis.

#### Long Tasks Breakdown (Predicted)

**Task 1: localStorage.write (50-200ms depending on project size)**
- Function: `storageService.saveProjects()` → `localStorage.setItem()`
- Location: `src/services/storageService.ts:28-35`
- Trigger: Autosave effect after 1s debounce (`ProjectContext.tsx:63-86`)
- Impact: Blocks main thread during JSON.stringify + localStorage write

**Task 2: Preview HTML generation (100-500ms with many images)**
- Function: `buildGiftHtml()` → `resolveMediaUrls()` → `getMediaDataUrl()`
- Location: `src/utils/giftRenderPipeline.ts:260-331`, `src/services/mediaService.ts:101-104`
- Trigger: Every `currentProject.updatedAt` change
- Impact: Resolves ALL media URLs (images, audio, videos) even if only text changed

**Task 3: Blob-to-dataURL conversion (10-50ms per image)**
- Function: `blobToDataUrl()` using FileReader
- Location: `src/services/mediaService.ts:107-119`
- Trigger: During preview generation (export mode) or when needed
- Impact: Synchronous file reading blocks main thread

**Task 4: Deep object cloning (5-20ms)**
- Function: `updateProject()` creating new project object
- Location: `src/contexts/ProjectContext.tsx:146-189`
- Trigger: Every project update (keystroke, image attach, etc.)
- Impact: Memory allocation + GC pressure

#### Layout/Paint Issues

**Forced reflow (Predicted):**
- Image grid re-rendering: `ImagesStep.tsx:285-322` renders all images in grid
- No virtualization: All DOM nodes created/updated on every render
- Impact: Layout thrashing when image list changes

**Large style recalculations:**
- Preview iframe content rewrite: `PreviewStep.tsx:65-75` writes entire HTML to iframe
- Impact: Full iframe reflow on every preview update

---

## 4. Root Cause Map (Ranked)

### 4.1 Preview Regeneration on Every Keystroke (HIGH CONFIDENCE)

**Description:**
The preview cache key includes `currentProject.updatedAt`, which changes on every `updateProject` call. This causes full HTML regeneration and media URL resolution even when only text content changes.

**Evidence:**
- Code: `src/components/editor/PreviewStep.tsx:30-62`
  ```typescript
  const generateCacheKey = () => {
    return `${currentProject.id}_${currentProject.templateId}_${currentProject.updatedAt}_${firstScreenId || 'all'}`;
  };
  ```
- Code: `src/contexts/ProjectContext.tsx:159-162`
  ```typescript
  const updatedWithTimestamp = {
    ...updated,
    updatedAt: new Date().toISOString(), // Changes on EVERY update
  };
  ```

**Impact Scope:**
- ✅ Typing: Every keystroke triggers preview regeneration
- ✅ Tabs: Tab switching may trigger if project changed
- ✅ Preview: Full HTML rebuild + media resolution
- ❌ Image attach: Also triggers, but less frequent

**Confidence:** HIGH - Code evidence is clear

---

### 4.2 Synchronous localStorage Writes Blocking Main Thread (HIGH CONFIDENCE)

**Description:**
The autosave effect depends on `currentProject`, which includes the `updatedAt` timestamp. Every project update (including keystrokes) triggers a debounced localStorage write. localStorage operations are synchronous and block the main thread.

**Evidence:**
- Code: `src/contexts/ProjectContext.tsx:63-86`
  ```typescript
  useEffect(() => {
    if (currentProject && autosaveEnabled) {
      const timer = setTimeout(() => {
        // ... 
        storageService.saveProjects(updatedProjects); // Synchronous!
      }, 1000);
    }
  }, [currentProject, autosaveEnabled]); // Depends on entire project object
  ```
- Code: `src/services/storageService.ts:28-35`
  ```typescript
  saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); // Blocks main thread
  }
  ```

**Impact Scope:**
- ✅ Typing: 1s debounce, but still blocks on save
- ✅ Tabs: May trigger if autosave fires during tab switch
- ✅ Preview: Indirect (delays other operations)
- ✅ Image attach: Triggers autosave

**Confidence:** HIGH - localStorage is inherently synchronous

---

### 4.3 Unmemoized ProjectContext Provider Value (HIGH CONFIDENCE)

**Description:**
The ProjectContext provider value object is recreated on every render, causing all consumers to re-render even when values haven't changed.

**Evidence:**
- Code: `src/contexts/ProjectContext.tsx:311-327`
  ```typescript
  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        exportProject,
        importProject,
        saveCurrentProject,
      }} // New object on every render!
    >
  ```
- No `useMemo` wrapping the value object

**Impact Scope:**
- ✅ Typing: All editor components re-render
- ✅ Tabs: All editor components re-render
- ✅ Preview: All editor components re-render
- ✅ Image attach: All editor components re-render

**Confidence:** HIGH - Standard React performance issue

---

### 4.4 Deep Object Cloning on Every Update (MEDIUM CONFIDENCE)

**Description:**
The `updateProject` function creates new objects for the entire project structure using spread operators, even when only a small field changes.

**Evidence:**
- Code: `src/contexts/ProjectContext.tsx:146-189`
  ```typescript
  const updateProject = useCallback((projectOrUpdater: Project | ((prev: Project) => Project), saveImmediately: boolean = false) => {
    const updated = typeof projectOrUpdater === 'function'
      ? projectOrUpdater(currentProjectRef.current || currentProject!)
      : projectOrUpdater;
    
    const updatedWithTimestamp = {
      ...updated, // Shallow clone, but nested objects also cloned
      updatedAt: new Date().toISOString(),
    };
  ```
- Example from `ScreenTextsStep.tsx:18-32`:
  ```typescript
  updateProject({
    ...currentProject, // Clones entire project
    data: {
      ...currentProject.data, // Clones entire data object
      screens: {
        ...currentProject.data.screens, // Clones all screens
        [screenId]: {
          ...currentProject.data.screens[screenId], // Clones screen data
          [field]: value, // Only this changes
        },
      },
    },
  });
  ```

**Impact Scope:**
- ✅ Typing: Memory allocation + GC pressure
- ⚠️ Tabs: Less impact
- ⚠️ Preview: Indirect (memory pressure)
- ⚠️ Image attach: Memory allocation

**Confidence:** MEDIUM - Code shows cloning, but need profiling to confirm GC impact

---

### 4.5 No Memoization in ImagesStep (MEDIUM CONFIDENCE)

**Description:**
The `ImagesStep` component computes `getUsedImageIds()` and `getScreensForImage()` on every render without memoization. These functions iterate over all screens and images.

**Evidence:**
- Code: `src/components/editor/ImagesStep.tsx:107-161`
  ```typescript
  const getUsedImageIds = (): Set<string> => {
    // Iterates over all screens and images - no memoization
    const usedIds = new Set<string>();
    // ... nested loops
  };
  
  const usedImageIds = getUsedImageIds(); // Called on every render
  ```
- `ImageThumb` component not memoized (`ImagesStep.tsx:328-342`)

**Impact Scope:**
- ⚠️ Typing: Recomputes on every project update
- ⚠️ Tabs: Recomputes when switching to Images tab
- ❌ Preview: No direct impact
- ✅ Image attach: Recomputes when images change

**Confidence:** MEDIUM - Code shows computation, but need profiling to confirm cost

---

### 4.6 Synchronous Blob-to-DataURL Conversion (MEDIUM CONFIDENCE)

**Description:**
The `blobToDataUrl` function uses FileReader synchronously (via Promise, but still blocks main thread during read).

**Evidence:**
- Code: `src/services/mediaService.ts:107-119`
  ```typescript
  export async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob); // Synchronous file read
    });
  }
  ```

**Impact Scope:**
- ❌ Typing: Only during preview generation
- ❌ Tabs: Only during preview generation
- ✅ Preview: Blocks during media resolution (export mode)
- ⚠️ Image attach: May trigger during preview update

**Confidence:** MEDIUM - FileReader is async but still blocks during read operation

---

### 4.7 No Virtualization for Image Grids (LOW CONFIDENCE)

**Description:**
The `ImagesStep` component renders all images in a grid without virtualization. With 20+ images, this creates many DOM nodes.

**Evidence:**
- Code: `src/components/editor/ImagesStep.tsx:285-322`
  ```typescript
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {currentProject.data.images.map((image) => {
      // Renders all images at once
    })}
  </div>
  ```

**Impact Scope:**
- ⚠️ Typing: Layout recalculation if images re-render
- ⚠️ Tabs: Initial render when switching to Images tab
- ❌ Preview: No direct impact
- ✅ Image attach: More DOM nodes as images added

**Confidence:** LOW - Need to measure DOM node count and layout time

---

## 5. Recommended Fixes (Prioritized)

### 5.1 Fix Preview Cache Key to Exclude updatedAt for Text-Only Changes (PRIORITY 1)

**What to change:**
- Modify `PreviewStep.tsx:30-62` to generate cache key based on actual content changes, not `updatedAt`
- Use a content hash or selective dependency tracking
- Alternatively, use `startTransition` to defer preview updates

**Expected benefit:**
- 80-90% reduction in preview regeneration during typing
- Typing becomes responsive again

**Risk:** LOW
- Preview may be slightly stale during rapid typing (acceptable tradeoff)
- Can add manual "Refresh Preview" button if needed

**Effort estimate:** 2-4 hours
- Modify cache key generation
- Add content-based change detection
- Test with various update scenarios

**Validation plan:**
- Measure preview regeneration count before/after
- Measure typing latency (time to first character display)
- Verify preview still updates when images/media change

**Code locations:**
- `src/components/editor/PreviewStep.tsx:30-62`
- Consider using `useDeferredValue` for `currentProject` in preview

---

### 5.2 Memoize ProjectContext Provider Value (PRIORITY 2)

**What to change:**
- Wrap provider value in `useMemo` in `ProjectContext.tsx:311-327`
- Ensure all callback functions are wrapped in `useCallback` (already done for most)

**Expected benefit:**
- 50-70% reduction in unnecessary re-renders
- All editor components only re-render when their specific data changes

**Risk:** LOW
- Standard React optimization pattern
- Need to verify all callbacks are stable

**Effort estimate:** 1-2 hours
- Add `useMemo` for provider value
- Verify callback stability
- Test re-render behavior

**Validation plan:**
- Use React DevTools Profiler to count re-renders before/after
- Verify components only re-render when their props/state actually change

**Code locations:**
- `src/contexts/ProjectContext.tsx:311-327`

---

### 5.3 Move localStorage Writes to Web Worker or Defer with requestIdleCallback (PRIORITY 3)

**What to change:**
- Use `requestIdleCallback` to defer localStorage writes
- Or move to Web Worker (more complex)
- Keep debounce, but execute write during idle time

**Expected benefit:**
- Eliminates main-thread blocking during saves
- Typing remains responsive even during autosave

**Risk:** MEDIUM
- Need to handle browser compatibility (polyfill for requestIdleCallback)
- Need to ensure writes complete before page unload

**Effort estimate:** 4-6 hours
- Implement idle callback wrapper
- Add page unload handler to flush pending writes
- Test with large projects

**Validation plan:**
- Measure main-thread blocking time during saves
- Verify saves complete reliably
- Test with very large projects (50+ images)

**Code locations:**
- `src/contexts/ProjectContext.tsx:63-86`
- `src/services/storageService.ts:28-35`

---

### 5.4 Memoize Computed Values in ImagesStep (PRIORITY 4)

**What to change:**
- Wrap `getUsedImageIds()` result in `useMemo` in `ImagesStep.tsx:107-136`
- Wrap `getScreensForImage()` in `useCallback` and memoize results
- Memoize `ImageThumb` component with `React.memo`

**Expected benefit:**
- 30-50% reduction in ImagesStep render time
- Image thumbnails don't re-render unnecessarily

**Risk:** LOW
- Standard React optimization

**Effort estimate:** 2-3 hours
- Add memoization hooks
- Wrap ImageThumb in React.memo
- Test re-render behavior

**Validation plan:**
- Measure ImagesStep render time before/after
- Count ImageThumb re-renders with React Profiler

**Code locations:**
- `src/components/editor/ImagesStep.tsx:107-161, 328-342`

---

### 5.5 Use Selective Updates Instead of Deep Cloning (PRIORITY 5)

**What to change:**
- Implement a reducer pattern or immutable update utility (e.g., Immer)
- Only clone changed paths in project object
- Use structural sharing for unchanged branches

**Expected benefit:**
- 40-60% reduction in memory allocation
- Faster updates (less cloning)
- Reduced GC pressure

**Risk:** MEDIUM
- Requires careful testing to ensure immutability maintained
- May need to refactor multiple update sites

**Effort estimate:** 8-12 hours
- Evaluate Immer or similar library
- Refactor `updateProject` and all call sites
- Comprehensive testing

**Validation plan:**
- Measure memory allocation before/after
- Measure update function execution time
- Verify no bugs introduced (immutability maintained)

**Code locations:**
- `src/contexts/ProjectContext.tsx:146-189`
- All `updateProject` call sites (10+ files)

---

### 5.6 Add Virtualization to Image Grids (PRIORITY 6)

**What to change:**
- Install `react-window` or `react-virtual`
- Wrap image grid in virtualized list component
- Only render visible images + buffer

**Expected benefit:**
- Faster initial render with 20+ images
- Reduced DOM nodes
- Better scroll performance

**Risk:** LOW
- Well-established library
- May need to adjust grid layout logic

**Effort estimate:** 4-6 hours
- Install and configure virtualization library
- Adapt grid layout to virtualized component
- Test with various image counts

**Validation plan:**
- Measure initial render time with 50+ images
- Count DOM nodes before/after
- Test scroll performance

**Code locations:**
- `src/components/editor/ImagesStep.tsx:285-322`

---

### 5.7 Move Blob-to-DataURL to Web Worker (PRIORITY 7)

**What to change:**
- Create Web Worker for blob conversion
- Post blob to worker, receive data URL
- Use for export mode (preview can use blob URLs)

**Expected benefit:**
- Eliminates main-thread blocking during export
- Export becomes non-blocking

**Risk:** MEDIUM
- Web Worker setup and message passing
- Need to handle large blobs (may need chunking)

**Effort estimate:** 6-8 hours
- Create Web Worker file
- Implement message passing protocol
- Handle blob transfer (may need chunking for large files)
- Test with various file sizes

**Validation plan:**
- Measure export time and main-thread blocking
- Test with large images (10MB+)
- Verify export quality unchanged

**Code locations:**
- `src/services/mediaService.ts:107-119`
- Create new worker file

---

## 6. Appendix

### 6.1 Relevant Files/Components List

**Core State Management:**
- `src/contexts/ProjectContext.tsx` - Project state provider (CRITICAL)
- `src/contexts/EditorContext.tsx` - Editor step state
- `src/services/storageService.ts` - localStorage persistence

**Preview Generation:**
- `src/components/editor/PreviewStep.tsx` - Preview component (CRITICAL)
- `src/utils/giftRenderPipeline.ts` - HTML generation pipeline
- `src/utils/exportBuilder.ts` - HTML builder functions

**Image Handling:**
- `src/components/editor/ImagesStep.tsx` - Image upload/management (CRITICAL)
- `src/services/mediaService.ts` - Media operations
- `src/utils/mediaPreviewCache.ts` - Blob URL cache
- `src/hooks/useMediaPreviewUrl.ts` - Preview URL hook

**Text Input:**
- `src/components/editor/ScreenTextsStep.tsx` - Text editing

**Editor Structure:**
- `src/pages/Editor.tsx` - Main editor page
- `src/components/editor/*` - All editor step components

### 6.2 Instrumentation Added

**None yet.** Recommended instrumentation:

1. **Performance marks for key operations:**
   ```typescript
   // In ProjectContext.tsx updateProject
   performance.mark('updateProject-start');
   // ... update logic
   performance.mark('updateProject-end');
   performance.measure('updateProject', 'updateProject-start', 'updateProject-end');
   ```

2. **Render count logging:**
   ```typescript
   // In components, add useEffect to log renders
   useEffect(() => {
     console.log(`[${componentName}] rendered`);
   });
   ```

3. **localStorage write timing:**
   ```typescript
   // In storageService.ts
   const start = performance.now();
   localStorage.setItem(...);
   console.log(`localStorage write took ${performance.now() - start}ms`);
   ```

**How to remove:**
- Search for `performance.mark`, `performance.measure`, and render logging
- Remove or wrap in `if (import.meta.env.DEV)` conditionals

### 6.3 Profiler Summary Placeholders

**React Profiler (to be captured):**
- Recording: "Typing in text box before images"
- Recording: "Typing in text box after 15 images"
- Recording: "Switching tabs before images"
- Recording: "Switching tabs after 15 images"
- Recording: "Attach image to screen before images"
- Recording: "Attach image to screen after 15 images"

**Chrome Performance (to be captured):**
- Trace: "Typing lag with images" (10s recording)
- Identify long tasks > 50ms
- Measure layout/paint times

### 6.4 Measurement Checklist

**Before implementing fixes:**
- [ ] Capture React Profiler recordings (all scenarios above)
- [ ] Capture Chrome Performance traces
- [ ] Measure typing latency (time to first character)
- [ ] Count re-renders for key components
- [ ] Measure localStorage write time with large projects
- [ ] Count DOM nodes in ImagesStep with 20 images
- [ ] Measure preview generation time

**After implementing fixes:**
- [ ] Re-capture all measurements
- [ ] Compare before/after metrics
- [ ] Verify no regressions in functionality

---

## 7. Next Steps

1. **Immediate (This Week):**
   - Implement Priority 1 fix (Preview cache key)
   - Implement Priority 2 fix (Memoize provider value)
   - Add instrumentation for baseline measurements

2. **Short-term (Next 2 Weeks):**
   - Implement Priority 3 fix (Defer localStorage)
   - Implement Priority 4 fix (Memoize ImagesStep)
   - Capture profiling data before/after

3. **Medium-term (Next Month):**
   - Implement Priority 5 fix (Selective updates)
   - Implement Priority 6 fix (Virtualization)
   - Comprehensive performance testing

4. **Long-term (Future):**
   - Consider Priority 7 fix (Web Worker for blob conversion)
   - Evaluate state management library (Zustand, Jotai) for better performance
   - Consider code splitting for editor components

---

**Report End**
