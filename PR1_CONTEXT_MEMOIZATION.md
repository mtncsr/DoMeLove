# PR 1: Fix Context Cascade Re-renders by Memoizing ProjectContext Provider Value

## Changes

### Files Modified
- `src/contexts/ProjectContext.tsx`
  - Added `useMemo` import
  - Wrapped provider `value` object in `useMemo` to prevent recreation on every render
  - Optimized `updateProject` callback to remove `currentProject` dependency (uses ref instead)
  - All other callbacks already stable via `useCallback`

- `src/pages/Editor.tsx`
  - Added `useRenderCount` hook for DEV render tracking

- `src/components/editor/PreviewStep.tsx`
  - Added `useRenderCount` hook for DEV render tracking

- `src/components/editor/ScreenTextsStep.tsx`
  - Added `useRenderCount` hook for DEV render tracking

### Files Created
- `src/utils/perf.ts` - Performance measurement utilities (DEV only)
- `src/hooks/useRenderCount.ts` - Render count tracking hook (DEV only)

## Problem
The `ProjectContext.Provider` value object was recreated on every render, causing all consumers to re-render even when values hadn't changed. This created a cascade of unnecessary re-renders throughout the editor.

## Solution
- Memoized the provider value object using `useMemo` with stable dependencies
- Optimized `updateProject` to use refs instead of state dependency
- Added DEV-only render count tracking to measure improvement

## Expected Impact
- **50-70% reduction** in unnecessary re-renders
- Components only re-render when their specific data changes
- Typing should feel more responsive

## Before/After Measurements

### Before (Predicted)
- EditorContent: Renders on every `currentProject` change
- PreviewStep: Renders on every `currentProject` change  
- ScreenTextsStep: Renders on every `currentProject` change
- All editor components: Cascade re-render on every keystroke

### After (To be measured)
- EditorContent: Should only render when step/templateMeta changes
- PreviewStep: Should only render when preview-relevant data changes
- ScreenTextsStep: Should only render when screen data changes
- Reduced cascade: Components isolate their re-renders

## Testing Checklist
- [x] TypeScript compiles without errors
- [ ] Create project works
- [ ] Upload images works
- [ ] Edit text works
- [ ] Attach image to screen works
- [ ] Preview updates correctly
- [ ] Export works
- [ ] Refresh page restores project
- [ ] Check console for render count logs (DEV mode)

## Notes
- All instrumentation is DEV-only and will not affect production builds
- Render counts are throttled to avoid console flooding
- `updateProject` optimization uses refs to avoid dependency on frequently-changing `currentProject` state
