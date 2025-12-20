import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { perfMark, perfMeasure, logPerf } from '../utils/perf';
import type { Project, ScreenData } from '../types/project';
import { storageService } from '../services/storageService';
import { validationService } from '../services/validationService';
import i18n, { getTextDirection } from '../i18n/config';
import { useAppSettings } from './AppSettingsContext';
import { deleteProjectVideos } from '../services/videoBlobStore';
import { deleteAllMediaForProject, revokeProjectPreviewUrls } from '../services/mediaService';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (templateId: string, name: string) => Project;
  updateProject: (project: Project | ((prev: Project) => Project), saveImmediately?: boolean) => void;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  exportProject: (project: Project) => string;
  importProject: (jsonData: unknown) => Promise<{ success: boolean; error?: string; project?: Project }>;
  saveCurrentProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [dataRevision, setDataRevision] = useState(0);
  const currentProjectRef = useRef<Project | null>(null);
  const projectsRef = useRef<Project[]>([]);
  const dataRevisionRef = useRef(0);
  const { autosaveEnabled } = useAppSettings();

  // Keep refs in sync with state
  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  // Load projects on mount
  useEffect(() => {
    let cancelled = false;
    storageService
      .loadProjects()
      .then((loaded) => {
        if (cancelled) return;
        setProjects(loaded);
        projectsRef.current = loaded;
      })
      .catch((error) => {
        console.error('Failed to load projects:', error);
        if (!cancelled) {
          setProjects([]);
          projectsRef.current = [];
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-save current project (debounced, longer delay for typing) when autosave is enabled
  // Based on currentProject.id + dataRevision to catch all changes including text edits
  useEffect(() => {
    if (currentProject && autosaveEnabled) {

      // Longer debounce for typing (3000ms) vs immediate actions
      const debounceTime = 3000;
      const timer = setTimeout(() => {
        const projectToSave = currentProjectRef.current;
        if (!projectToSave) return;

        // PERFORMANCE INSTRUMENTATION: Track autosave
        if (import.meta.env.DEV) {
          perfMark('autosave-start');
          const projectSize = JSON.stringify(projectToSave).length;
          logPerf('[ProjectContext] Autosave triggered', {
            projectId: projectToSave.id,
            projectSizeBytes: projectSize,
            imageCount: projectToSave.data.images?.length || 0,
          });
        }

        // Update projects array state (but don't save all projects)
        const updatedProjects = projectsRef.current.map(p =>
          p.id === projectToSave.id ? projectToSave : p
          );
          setProjects(updatedProjects);
          projectsRef.current = updatedProjects;

        // Save only the changed project (uses idle callback internally)
        storageService.saveProject(projectToSave);

        if (import.meta.env.DEV) {
          perfMark('autosave-end');
          perfMeasure('autosave', 'autosave-start', 'autosave-end');
          logPerf('[ProjectContext] Autosave scheduled (idle callback)');
        }
      }, debounceTime);
      return () => clearTimeout(timer);
    }
  }, [currentProject?.id, dataRevision, autosaveEnabled]);

  // Flush pending writes on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      storageService.flushPendingWrites();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Switch language when project changes
  useEffect(() => {
    if (currentProject?.language) {
      i18n.changeLanguage(currentProject.language);
      const direction = getTextDirection(currentProject.language);
      document.documentElement.dir = direction;
      document.documentElement.lang = currentProject.language;
    }
  }, [currentProject?.language]);

  const saveCurrentProject = useCallback(() => {
    const projectToSave = currentProjectRef.current;
    if (!projectToSave) return;

    const updated = {
      ...projectToSave,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProjectState(updated);
    const updatedProjects = projectsRef.current.map(p =>
      p.id === updated.id ? updated : p
    );
    setProjects(updatedProjects);
    projectsRef.current = updatedProjects;
    
    // Flush immediately for manual save (don't use idle callback)
    storageService.saveProject(updated);
    storageService.flushPendingWrites();
  }, []);

  const createProject = useCallback((templateId: string, name: string): Project => {
    const now = new Date().toISOString();
    const newProject: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      templateId,
      schemaVersion: 1,
      language: 'en',
      data: {
        screens: {},
        images: [],
        videos: [],
        audio: {
          screens: {},
        },
        overlay: {
          type: 'heart',
        },
      },
      createdAt: now,
      updatedAt: now,
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    projectsRef.current = updatedProjects;
    // Save new project immediately (new project creation)
    storageService.saveProject(newProject);
    storageService.flushPendingWrites();
    setCurrentProjectState(newProject);
    return newProject;
  }, [projects]);

  const updateProject = useCallback((projectOrUpdater: Project | ((prev: Project) => Project), saveImmediately: boolean = false) => {
    // Get the updated project - either use the provided project or call the updater function
    // Use ref to avoid dependency on currentProject (ref is always current via useEffect)
    const current = currentProjectRef.current;
    if (!current && typeof projectOrUpdater === 'function') {
      console.warn('[ProjectContext] updateProject called with function but no current project');
      return;
    }

    const updated = typeof projectOrUpdater === 'function'
      ? projectOrUpdater(current!)
      : projectOrUpdater;

    if (import.meta.env.DEV) {
    console.log('[ProjectContext] Updating project:', {
      id: updated.id,
      name: updated.name,
      saveImmediately,
        currentName: current?.name
    });
    }

    const updatedWithTimestamp = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };

    // Increment data revision on every real project update (including text changes)
    setDataRevision(prev => {
      const next = prev + 1;
      dataRevisionRef.current = next;
      return next;
    });

    // Remove flushSync - let React batch normally
    if (current?.id === updatedWithTimestamp.id) {
      currentProjectRef.current = updatedWithTimestamp;
      setCurrentProjectState(updatedWithTimestamp);
    }

    // Update projects array but don't save to storage immediately (unless forced)
    // The debounced auto-save effect will handle storage writes normally
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(p =>
        p.id === updatedWithTimestamp.id ? updatedWithTimestamp : p
      );
      projectsRef.current = updatedProjects;

      if (saveImmediately) {
        // Run side effect outside of render cycle
        if (import.meta.env.DEV) {
        console.log('[ProjectContext] Force saving immediately');
        }
        setTimeout(() => {
          storageService.saveProject(updatedWithTimestamp);
          storageService.flushPendingWrites();
          if (import.meta.env.DEV) {
          console.log('[ProjectContext] Save complete');
          }
        }, 0);
      }

      return updatedProjects;
    });
  }, []); // No dependencies - uses refs which are always current

  const deleteProject = useCallback(async (projectId: string) => {
    // Revoke all object URLs for this project
    revokeProjectPreviewUrls(projectId);

    // Delete all media blobs (images, audio, video)
    await deleteAllMediaForProject(projectId);
    await deleteProjectVideos(projectId);

    // Remove from projects array
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    projectsRef.current = updatedProjects;
    // Delete project from storage (handles index update)
    storageService.deleteProject(projectId);

    if (currentProject?.id === projectId) {
      setCurrentProjectState(null);
    }
  }, [projects, currentProject]);

  const setCurrentProject = useCallback((project: Project | null) => {
    const previousProjectId = currentProjectRef.current?.id;
    const newProjectId = project?.id;

    // Reset data revision when switching projects
    if (previousProjectId !== newProjectId) {
      setDataRevision(0);
      dataRevisionRef.current = 0;
    }

    if (project) {
      // GUARD: Only revoke previous project URLs if switching to DIFFERENT project
      // Must NOT revoke when selecting the same project again
      if (previousProjectId && previousProjectId !== newProjectId) {
        // Switching to different project - revoke previous project's URLs
        revokeProjectPreviewUrls(previousProjectId);
      }
      // If same project (previousProjectId === newProjectId), do NOT revoke
      // This prevents flicker/reloading when re-selecting the same project

      // Only clean up video mode inconsistencies - preserve images for classic mode screens
      // Image cleanup happens in storageService.migrateIfNeeded, not here
      const validVideoIds = new Set((project.data.videos || []).map(v => v.id));
      const cleanedScreens = Object.fromEntries(
        Object.entries(project.data.screens).map(([screenId, screenData]) => {
          const mediaMode = screenData.mediaMode || 'classic';
          const isVideoMode = mediaMode === 'video';
          const hasVideo = screenData.videoId && validVideoIds.has(screenData.videoId);
          const nextMediaMode: ScreenData['mediaMode'] = isVideoMode && hasVideo ? 'video' : 'classic';

          // Only clear images if switching FROM video mode TO classic mode due to invalid video
          // If already in classic mode, preserve all images
          const shouldClearImages = isVideoMode && !hasVideo;

          return [
            screenId,
            {
              ...screenData,
              mediaMode: nextMediaMode,
              videoId: nextMediaMode === 'video' ? screenData.videoId : undefined,
              // Preserve images unless we're correcting a video mode screen without a valid video
              images: shouldClearImages ? [] : (screenData.images || []),
              audioId: nextMediaMode === 'classic' ? screenData.audioId : undefined,
              extendMusicToNext: nextMediaMode === 'classic' ? screenData.extendMusicToNext : undefined,
              galleryLayout: nextMediaMode === 'classic' ? screenData.galleryLayout : undefined,
            },
          ];
        })
      ) as Record<string, ScreenData>;

      const cleanedProject = {
        ...project,
        data: {
          ...project.data,
          videos: project.data.videos || [],
          screens: cleanedScreens,
        },
      };
      setCurrentProjectState(cleanedProject);
    } else {
      // Clearing current project - revoke its URLs (project-scoped)
      if (previousProjectId) {
        revokeProjectPreviewUrls(previousProjectId);
      }
      setCurrentProjectState(null);
    }
  }, []);

  const exportProject = useCallback((project: Project): string => {
    return JSON.stringify(project, null, 2);
  }, []);

  const importProject = useCallback(async (jsonData: unknown): Promise<{ success: boolean; error?: string; project?: Project }> => {
    const result = validationService.validateImport(jsonData);
    if (!result.isValid) {
      return {
        success: false,
        error: result.errors.map(e => e.message).join(', '),
      };
    }

    if (!result.project) {
      return {
        success: false,
        error: 'Invalid project data',
      };
    }

    // Migrate if needed
    const migrated = await storageService.migrateIfNeeded(result.project);

    // Update timestamps
    const now = new Date().toISOString();
    migrated.updatedAt = now;
    if (!migrated.createdAt) {
      migrated.createdAt = now;
    }

    const updatedProjects = [...projects, migrated];
    setProjects(updatedProjects);
    projectsRef.current = updatedProjects;
    // Save imported project
    storageService.saveProject(migrated);
    storageService.flushPendingWrites();

    return {
      success: true,
      project: migrated,
    };
  }, [projects]);

  // Memoize context value to prevent cascade re-renders
  // All callbacks are already wrapped in useCallback, so they're stable
  const contextValue = useMemo(
    () => ({
      projects,
      currentProject,
      createProject,
      updateProject,
      deleteProject,
      setCurrentProject,
      exportProject,
      importProject,
      saveCurrentProject,
    }),
    [
        projects,
        currentProject,
        createProject,
        updateProject,
        deleteProject,
        setCurrentProject,
        exportProject,
        importProject,
        saveCurrentProject,
    ]
  );

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
