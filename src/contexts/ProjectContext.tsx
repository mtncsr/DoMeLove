import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Project, ProjectData } from '../types/project';
import { storageService } from '../services/storageService';
import { validationService } from '../services/validationService';
import i18n, { getTextDirection } from '../i18n/config';

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

  // Load projects on mount
  useEffect(() => {
    try {
      const loaded = storageService.loadProjects();
      setProjects(loaded);
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Continue with empty array if loading fails
      setProjects([]);
    }
  }, []);

  // Auto-save current project
  useEffect(() => {
    if (currentProject) {
      const timer = setTimeout(() => {
        saveCurrentProject();
      }, 1000); // Debounce auto-save
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject]);

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
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      updatedAt: new Date().toISOString(),
    };

    setCurrentProjectState(updated);
    const updatedProjects = projects.map(p => 
      p.id === updated.id ? updated : p
    );
    setProjects(updatedProjects);
    storageService.saveProjects(updatedProjects);
  }, [currentProject, projects]);

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
    const updatedProjects = projects.map(p => 
      p.id === updated.id ? updated : p
    );
    setProjects(updatedProjects);
    storageService.saveProjects(updatedProjects);
  }, [projects]);

  const deleteProject = useCallback((projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    storageService.saveProjects(updatedProjects);
    if (currentProject?.id === projectId) {
      setCurrentProjectState(null);
    }
  }, [projects, currentProject]);

  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
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



