import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useProject } from '../../contexts/ProjectContext';
import type { TemplateMeta } from '../../types/template';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { useRenderCount } from '../../hooks/useRenderCount';
import { perfNow, logPerf } from '../../utils/perf';

interface ScreenTextsStepProps {
  templateMeta: TemplateMeta | null;
}

export function ScreenTextsStep({ templateMeta }: ScreenTextsStepProps) {
  const { t } = useTranslation();
  const { currentProject, updateProject } = useProject();

  // DEV: Track render counts
  useRenderCount('ScreenTextsStep');

  // Local state for screen fields (keyed by screenId:field)
  const [localFields, setLocalFields] = useState<Record<string, string>>({});
  const localFieldsRef = useRef<Record<string, string>>({});
  const debounceTimersRef = useRef<Record<string, number>>({});
  const commitCountRef = useRef(0);
  const activeProjectIdRef = useRef<string | null>(null);

  // Keep ref in sync with state for latest values
  useEffect(() => {
    localFieldsRef.current = localFields;
  }, [localFields]);

  // Track active project ID to prevent commits to wrong project
  useEffect(() => {
    activeProjectIdRef.current = currentProject?.id || null;
  }, [currentProject?.id]);

  // Commit function that updates project state
  const commitField = useCallback((screenId: string, field: string, value: string) => {
    commitCountRef.current += 1;
    const startTime = perfNow();

    // Use function form to avoid spreading entire project
    updateProject((prev) => {
      const screenData = prev.data.screens[screenId] || {};
      return {
        ...prev,
        data: {
          ...prev.data,
          screens: {
            ...prev.data.screens,
            [screenId]: {
              ...screenData,
              [field]: value,
            },
          },
        },
      };
    });

    if (import.meta.env.DEV) {
      const duration = perfNow() - startTime;
      logPerf(`[ScreenTextsStep] Committed ${screenId}:${field}`, {
        commitCount: commitCountRef.current,
        duration: `${duration.toFixed(2)}ms`,
      });
    }
  }, [updateProject]);

  // Flush all pending commits - use refs for latest values
  const flushPendingCommits = useCallback(() => {
    const currentProjectId = activeProjectIdRef.current;
    if (!currentProjectId) return;

    Object.entries(debounceTimersRef.current).forEach(([key, timer]) => {
      clearTimeout(timer);
      const [screenId, field] = key.split(':');
      // Use ref for latest value (not closure)
      const value = localFieldsRef.current[key] || '';
      
      // Check project ID guard - don't commit if project changed
      if (currentProjectId !== activeProjectIdRef.current) {
        delete debounceTimersRef.current[key];
        return;
      }

      // Only commit if value differs from current project state
      if (value !== (currentProject?.data.screens[screenId]?.[field as 'title' | 'text'] || '')) {
        commitField(screenId, field, value);
      }
      delete debounceTimersRef.current[key];
    });
  }, [currentProject, commitField]);

  // Sync local state when currentProject changes
  useEffect(() => {
    if (!currentProject || !templateMeta) return;

    // Flush pending commits before syncing (in case project changed)
    flushPendingCommits();

    const newLocalFields: Record<string, string> = {};
    for (const screen of templateMeta.screens) {
      const screenData = currentProject.data.screens[screen.screenId];
      if (screen.placeholders.includes('title')) {
        const key = `${screen.screenId}:title`;
        newLocalFields[key] = screenData?.title || '';
      }
      if (screen.placeholders.includes('text')) {
        const key = `${screen.screenId}:text`;
        newLocalFields[key] = screenData?.text || '';
      }
    }

    setLocalFields(newLocalFields);
  }, [currentProject?.id, templateMeta, flushPendingCommits]);

  // Update local state and schedule commit
  const updateScreenField = useCallback((screenId: string, field: string, value: string) => {
    const key = `${screenId}:${field}`;
    const capturedProjectId = activeProjectIdRef.current;
    
    // Update local state immediately (for responsive UI)
    setLocalFields(prev => ({
      ...prev,
      [key]: value,
    }));

    // Clear existing debounce timer
    const existingTimer = debounceTimersRef.current[key];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule commit after 300ms of no typing
    debounceTimersRef.current[key] = window.setTimeout(() => {
      // Project ID guard: don't commit if project changed
      if (capturedProjectId !== activeProjectIdRef.current) {
        delete debounceTimersRef.current[key];
        return;
      }
      
      // Use ref for latest value
      const latestValue = localFieldsRef.current[key] || value;
      commitField(screenId, field, latestValue);
      delete debounceTimersRef.current[key];
    }, 300);
  }, [commitField]);

  // Commit immediately on blur
  const handleBlur = useCallback((screenId: string, field: string) => {
    const key = `${screenId}:${field}`;
    // Use ref for latest value
    const value = localFieldsRef.current[key] || '';

    // Skip commit if unchanged
    if (value === (currentProject?.data.screens[screenId]?.[field as 'title' | 'text'] || '')) {
      // Clear any pending timer
      const existingTimer = debounceTimersRef.current[key];
      if (existingTimer) {
        clearTimeout(existingTimer);
        delete debounceTimersRef.current[key];
      }
      return;
    }

    // Clear debounce timer
    const existingTimer = debounceTimersRef.current[key];
    if (existingTimer) {
      clearTimeout(existingTimer);
      delete debounceTimersRef.current[key];
    }

    // Commit immediately
    commitField(screenId, field, value);
  }, [currentProject, commitField]);

  // Cleanup and flush on unmount
  useEffect(() => {
    return () => {
      // Flush pending commits before unmounting
      flushPendingCommits();
      // Clear any remaining timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, [flushPendingCommits]);

  // Local state for blessings
  const [localBlessings, setLocalBlessings] = useState<Array<{ sender: string; text: string }>>([]);
  const localBlessingsRef = useRef<Array<{ sender: string; text: string }>>([]);
  const blessingsDebounceTimerRef = useRef<number | null>(null);

  // Keep blessings ref in sync
  useEffect(() => {
    localBlessingsRef.current = localBlessings;
  }, [localBlessings]);

  // Sync local blessings when currentProject changes
  useEffect(() => {
    if (!currentProject || !templateMeta) return;
    
    // Flush pending blessing commits before syncing
    if (blessingsDebounceTimerRef.current !== null) {
      clearTimeout(blessingsDebounceTimerRef.current);
      const latestBlessings = localBlessingsRef.current;
      if (JSON.stringify(latestBlessings) !== JSON.stringify(currentProject.data.blessings || [])) {
        commitBlessings(latestBlessings);
      }
      blessingsDebounceTimerRef.current = null;
    }

    setLocalBlessings(currentProject.data.blessings || []);
  }, [currentProject?.id, currentProject?.data.blessings, templateMeta]);

  // Commit blessings function
  const commitBlessings = useCallback((blessings: Array<{ sender: string; text: string }>) => {
    // Use function form to avoid spreading entire project
    updateProject((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        blessings,
      },
    }));
  }, [updateProject]);

  if (!currentProject || !templateMeta) return null;

  const updateBlessing = (index: number, field: 'sender' | 'text', value: string) => {
    const capturedProjectId = activeProjectIdRef.current;
    
    setLocalBlessings(prev => {
      const updated = [...prev];
      if (!updated[index]) {
        updated[index] = { sender: '', text: '' };
      }
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear existing debounce timer
    if (blessingsDebounceTimerRef.current !== null) {
      clearTimeout(blessingsDebounceTimerRef.current);
    }

    // Schedule commit after 300ms
    blessingsDebounceTimerRef.current = window.setTimeout(() => {
      // Project ID guard
      if (capturedProjectId !== activeProjectIdRef.current) {
        blessingsDebounceTimerRef.current = null;
        return;
      }
      
      const latestBlessings = localBlessingsRef.current;
      commitBlessings(latestBlessings);
      blessingsDebounceTimerRef.current = null;
    }, 300);
  };

  const addBlessing = () => {
    setLocalBlessings(prev => [...prev, { sender: '', text: '' }]);
    // Commit immediately for add/remove actions
    const updated = [...localBlessings, { sender: '', text: '' }];
    commitBlessings(updated);
  };

  const removeBlessing = (index: number) => {
    // Fix mutation bug: copy array before splice
    const updated = [...localBlessings];
    updated.splice(index, 1);
    setLocalBlessings(updated);
    // Commit immediately for add/remove actions
    commitBlessings(updated);
  };

  // Cleanup blessings timer on unmount
  useEffect(() => {
    return () => {
      if (blessingsDebounceTimerRef.current !== null) {
        clearTimeout(blessingsDebounceTimerRef.current);
        const latestBlessings = localBlessingsRef.current;
        if (JSON.stringify(latestBlessings) !== JSON.stringify(currentProject?.data.blessings || [])) {
          commitBlessings(latestBlessings);
        }
      }
    };
  }, [currentProject, commitBlessings]);;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('editor.steps.screenTexts')}</h2>
      <div className="space-y-8">
        {templateMeta.screens.map((screen) => (
          <div key={screen.screenId} className="bg-white dark:bg-[var(--surface-2)] p-6 rounded-lg border border-gray-200 dark:border-[rgba(255,255,255,0.12)]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{screen.screenId}</h3>
            
            {screen.placeholders.includes('title') && (
              <Input
                label={t('editor.screenTexts.title')}
                value={localFields[`${screen.screenId}:title`] || ''}
                onChange={(e) => updateScreenField(screen.screenId, 'title', e.target.value)}
                onBlur={() => handleBlur(screen.screenId, 'title')}
                className="mb-4"
              />
            )}

            {screen.placeholders.includes('text') && (
              <Textarea
                label={t('editor.screenTexts.text')}
                value={localFields[`${screen.screenId}:text`] || ''}
                onChange={(e) => updateScreenField(screen.screenId, 'text', e.target.value)}
                onBlur={() => handleBlur(screen.screenId, 'text')}
                rows={4}
                className="mb-4"
              />
            )}

            {screen.type === 'blessings' && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-semibold">{t('editor.screenTexts.blessings')}</h4>
                  <Button onClick={addBlessing}>{t('editor.screenTexts.addBlessing')}</Button>
                </div>
                {localBlessings.map((blessing, index) => (
                  <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <Input
                      label={t('editor.screenTexts.sender')}
                      value={blessing.sender}
                      onChange={(e) => updateBlessing(index, 'sender', e.target.value)}
                      className="mb-2"
                    />
                    <Textarea
                      label={t('editor.screenTexts.text')}
                      value={blessing.text}
                      onChange={(e) => updateBlessing(index, 'text', e.target.value)}
                      rows={2}
                    />
                    <Button
                      variant="danger"
                      onClick={() => removeBlessing(index)}
                      className="mt-2"
                    >
                      {t('common.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
