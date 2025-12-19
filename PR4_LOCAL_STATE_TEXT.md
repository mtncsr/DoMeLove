# PR 4: Stop Committing to Global Project State on Every Keystroke

## Changes

### Files Modified
- `src/components/editor/ScreenTextsStep.tsx`
  - Added local state (`localFields`) for all text input fields
  - Local state syncs with `currentProject` when project/screen changes
  - `onChange` updates local state immediately (responsive UI)
  - Commits to global state are debounced (300ms) after user stops typing
  - Commits also happen immediately on `onBlur` (when user leaves field)
  - Pending commits are flushed when:
    - Component unmounts
    - Project changes (switching projects)
    - User switches tabs/screens
  - Uses `updateProject` with function form to avoid spreading entire project
  - Added DEV performance tracking for commit frequency and timing

### Files Used (Already Created)
- `src/utils/perf.ts` - Performance measurement utilities

## Problem
- `onChange` called `updateProject` on every keystroke
- This triggered:
  - Global project state update (causing re-renders)
  - Preview cache invalidation
  - Autosave trigger (after debounce)
- Typing 20 characters = 20 global state updates = 20 re-renders

## Solution
1. **Local state**: Each field keeps its value in component local state
2. **Immediate UI updates**: Local state updates instantly (no lag)
3. **Debounced commits**: Global state updated 300ms after user stops typing
4. **Blur commits**: Immediate commit when user leaves field
5. **Flush on navigation**: Pending commits flushed when switching projects/tabs

## Expected Impact
- **95%+ reduction** in global state commits during typing
- **Typing is instant** even with 20+ images
- **No data loss**: All changes committed (debounced or on blur)
- **Reduced re-renders**: Only ScreenTextsStep re-renders during typing, not entire app

## Before/After Measurements

### Before (Predicted)
- Commits per 20 chars: 20 commits
- Global re-renders: 20+ (cascade through context)
- Typing latency: 5-20ms per keystroke (state update overhead)
- Preview invalidations: 20 (one per keystroke)

### After (To be measured)
- Commits per 20 chars: 1-2 commits (batched via debounce)
- Global re-renders: 1-2 (only on commit)
- Typing latency: < 1ms (local state only)
- Preview invalidations: 1-2 (only on commit)

## Testing Checklist
- [x] TypeScript compiles without errors
- [ ] Typing is instant even with 20 images
- [ ] Switching screens/tabs: Latest typed text is preserved
- [ ] Refresh page: Typed text persists correctly
- [ ] Preview catches up correctly (may be delayed, that's ok)
- [ ] Blur commits immediately
- [ ] Debounce works (typing quickly = fewer commits)
- [ ] Check console for commit count logs (DEV mode)

## Notes
- Blessings editing still uses immediate commits (less frequent, acceptable)
- Local state is synced when project/screen changes to avoid stale data
- Flush mechanism ensures no data loss when navigating away
- 300ms debounce balances responsiveness vs commit frequency
- Function form of `updateProject` avoids unnecessary object spreading

## Future Improvements
- Could apply same pattern to GiftDetailsStep if it has text inputs
- Could reduce debounce time if needed (currently 300ms)
- Could add visual indicator for "unsaved changes" if desired
