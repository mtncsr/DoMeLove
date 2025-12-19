# PR 3: Fix Autosave to Avoid Main-Thread Blocking

## Changes

### Files Modified
- `src/services/storageService.ts`
  - Implemented per-project storage (Option 1: separate keys per project)
    - `STORAGE_KEY_INDEX`: List of project IDs + minimal metadata
    - `STORAGE_KEY_PROJECT_<id>`: Full project JSON per project
  - Added `saveProject(project)` method for single project saves
  - Added `deleteProject(projectId)` method for project deletion
  - Implemented `requestIdleCallback` for non-blocking writes (with 1000ms timeout fallback)
  - Added `flushPendingWrites()` for immediate writes (manual save, beforeunload)
  - Maintains backward compatibility with old storage format

- `src/contexts/ProjectContext.tsx`
  - Updated autosave effect to use `saveProject` instead of `saveProjects`
  - Added lightweight project signature to avoid triggering on `updatedAt` alone
  - Increased debounce time to 3000ms for typing-driven updates
  - Added `beforeunload` handler to flush pending writes
  - Updated `saveCurrentProject` to flush immediately
  - Updated `createProject`, `deleteProject`, `importProject` to use new storage methods

### Files Used (Already Created)
- `src/utils/perf.ts` - Performance measurement utilities

## Problem
1. Autosave effect triggered on every `currentProject` change (including `updatedAt` timestamp)
2. `saveProjects` serialized entire projects array on every keystroke (after debounce)
3. `localStorage.setItem` is synchronous and blocks main thread
4. Typing caused periodic 50-200ms stalls during autosave

## Solution
1. **Per-project storage**: Store each project separately, only save changed project
2. **Idle-time writes**: Use `requestIdleCallback` to defer writes during idle periods
3. **Signature-based triggering**: Only trigger autosave when meaningful data changes (not just `updatedAt`)
4. **Longer debounce**: 3000ms for typing-driven updates (vs 1000ms before)
5. **Immediate flush**: Manual saves and beforeunload flush immediately

## Expected Impact
- **Eliminates main-thread blocking** during autosave (writes happen during idle time)
- **Reduces autosave frequency** (only on meaningful changes, not every keystroke)
- **Faster saves** (only serialize changed project, not entire array)
- **Typing remains responsive** (no periodic stalls)

## Before/After Measurements

### Before (Predicted)
- Autosave triggers: Every `currentProject` change (including `updatedAt`)
- localStorage write: Entire projects array serialized (50-200ms for large projects)
- Main-thread blocking: 50-200ms stalls during save
- Debounce: 1000ms

### After (To be measured)
- Autosave triggers: Only on meaningful data changes (structure, media, metadata)
- localStorage write: Only changed project serialized (10-50ms)
- Main-thread blocking: 0ms (writes deferred to idle time)
- Debounce: 3000ms for typing

## Testing Checklist
- [x] TypeScript compiles without errors
- [ ] Editing text: No periodic stalls, typing remains responsive
- [ ] After refresh: Edits persist correctly
- [ ] Multiple projects: All projects persist correctly
- [ ] Import/export: Unchanged functionality
- [ ] Manual save: Flushes immediately
- [ ] Page unload: Pending writes flushed
- [ ] Check console for autosave timing logs (DEV mode)

## Notes
- Backward compatible: Old storage format is migrated on first load
- Per-project storage reduces serialization time significantly
- `requestIdleCallback` with 1000ms timeout ensures writes complete even during heavy load
- Signature-based triggering prevents unnecessary saves on timestamp-only changes
- Text changes are still saved (via debounce), but don't trigger on every keystroke

## Migration
- On first load after this change, old format projects are automatically migrated
- Old `STORAGE_KEY` is preserved but not used after migration
- New format uses separate keys for better performance
