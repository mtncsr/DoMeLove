import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Project, ScreenData } from '../types/project';
import { storageService } from '../services/storageService';
import { validationService } from '../services/validationService';
import i18n, { getTextDirection } from '../i18n/config';
import { useAppSettings } from './AppSettingsContext';
import { deleteProjectVideos } from '../services/videoBlobStore';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  createProject: (templateId: string, name: string) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  setCurrentProject: (project: Project | null) => void;
  exportProject: (project: Project) => string;
  importProject: (jsonData: unknown) => { success: boolean; error?: string; project?: Project };
  saveCurrentProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const currentProjectRef = useRef<Project | null>(null);
  const projectsRef = useRef<Project[]>([]);
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
    try {
      const loaded = storageService.loadProjects();
      setProjects(loaded);
      projectsRef.current = loaded;
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Continue with empty array if loading fails
      setProjects([]);
      projectsRef.current = [];
    }
  }, []);

  // Auto-save current project (debounced) when autosave is enabled
  useEffect(() => {
    if (currentProject && autosaveEnabled) {
      const timer = setTimeout(() => {
        const projectToSave = currentProjectRef.current;
        const projectsToUpdate = projectsRef.current;
        
        if (projectToSave) {
          const updated = {
            ...projectToSave,
            updatedAt: new Date().toISOString(),
          };
          
          const updatedProjects = projectsToUpdate.map(p => 
            p.id === updated.id ? updated : p
          );
          
          setProjects(updatedProjects);
          projectsRef.current = updatedProjects;
          storageService.saveProjects(updatedProjects);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentProject, autosaveEnabled]);

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
    storageService.saveProjects(updatedProjects);
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
    storageService.saveProjects(updatedProjects);
    setCurrentProjectState(newProject);
    return newProject;
  }, [projects]);

  const updateProject = useCallback((project: Project) => {
    const updated = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProjectState(updated);
    // Update projects array but don't save to storage immediately
    // The debounced auto-save effect will handle storage writes
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(p => 
        p.id === updated.id ? updated : p
      );
      projectsRef.current = updatedProjects;
      return updatedProjects;
    });
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    storageService.saveProjects(updatedProjects);
    deleteProjectVideos(projectId).catch((err) => {
      console.error('Failed to delete project videos from IndexedDB:', err);
    });
    if (currentProject?.id === projectId) {
      setCurrentProjectState(null);
    }
  }, [projects, currentProject]);

  const setCurrentProject = useCallback((project: Project | null) => {
    if (project) {
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
      setCurrentProjectState(null);
    }
  }, []);

  const exportProject = useCallback((project: Project): string => {
    return JSON.stringify(project, null, 2);
  }, []);

  const importProject = useCallback((jsonData: unknown): { success: boolean; error?: string; project?: Project } => {
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
    const migrated = storageService.migrateIfNeeded(result.project);
    
    // Update timestamps
    const now = new Date().toISOString();
    migrated.updatedAt = now;
    if (!migrated.createdAt) {
      migrated.createdAt = now;
    }

    const updatedProjects = [...projects, migrated];
    setProjects(updatedProjects);
    storageService.saveProjects(updatedProjects);

    return {
      success: true,
      project: migrated,
    };
  }, [projects]);

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
      }}
    >
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
