# PR 2: Decouple Preview Updates from Keystrokes

## Changes

### Files Modified
- `src/components/editor/PreviewStep.tsx`
  - Removed `updatedAt` from cache key (was causing regeneration on every keystroke)
  - Created stable cache key based on preview-relevant data only:
    - Project ID, template ID, screen structure
    - Media IDs (images, audio, videos) used in screens
    - Screen texts (hashed to keep key size reasonable)
  - Added `useDeferredValue` to decouple from rapid state changes
  - Added 250ms debounce for preview regeneration
  - Wrapped preview generation in `startTransition` to mark as non-urgent
  - Added DEV performance tracking using perf utilities

### Files Used (Already Created)
- `src/utils/perf.ts` - Performance measurement utilities

## Problem
Preview cache key included `currentProject.updatedAt`, which changes on every `updateProject` call. This caused full HTML regeneration and media URL resolution on every keystroke, making typing laggy.

## Solution
1. **Stable cache key**: Based on actual preview-relevant data, not timestamps
2. **Deferred value**: Use `useDeferredValue` to decouple from rapid keystrokes
3. **Debouncing**: 250ms debounce prevents regeneration during rapid typing
4. **Non-urgent scheduling**: `startTransition` marks preview work as low priority

## Expected Impact
- **80-90% reduction** in preview regenerations during typing
- Typing remains responsive (no blocking on preview generation)
- Preview still updates correctly after user stops typing
- Export unaffected (uses immediate `currentProject`)

## Before/After Measurements

### Before (Predicted)
- Preview regenerates: On every keystroke (every `updatedAt` change)
- Typing latency: 100-500ms stalls during preview generation
- Cache hits: ~0% during typing
- Preview updates: Immediate but blocks typing

### After (To be measured)
- Preview regenerates: Only when preview-relevant data changes (text, media, structure)
- Typing latency: < 10ms (no blocking)
- Cache hits: High during rapid typing
- Preview updates: Delayed by 250ms + generation time, but non-blocking

## Testing Checklist
- [x] TypeScript compiles without errors
- [ ] Type 20 chars quickly: input remains responsive
- [ ] Preview updates after short delay and shows correct content
- [ ] Upload images: preview updates to show them
- [ ] Change text: preview updates after debounce
- [ ] Export uses immediate currentProject (not deferred) and is correct
- [ ] Check console for cache hit/miss logs (DEV mode)
- [ ] Check performance marks for regeneration timing

## Notes
- Export is unaffected: `ExportStep` uses `currentProject` directly from context
- Preview may be slightly stale during rapid typing (acceptable tradeoff)
- Debounce time (250ms) can be adjusted if needed
- Cache key includes hashed screen texts to detect text changes without including full strings
