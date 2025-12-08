import type { Project } from '../types/project';

const STORAGE_KEY = 'interactiveGiftCreator_v1';
const CURRENT_SCHEMA_VERSION = 1;

export interface StorageService {
  loadProjects: () => Project[];
  saveProjects: (projects: Project[]) => void;
  migrateIfNeeded: (project: Project) => Project;
}

class StorageServiceImpl implements StorageService {
  loadProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const projects = JSON.parse(data) as Project[];
      return projects.map(p => this.migrateIfNeeded(p));
    } catch (error) {
      console.error('Error loading projects from localStorage:', error);
      return [];
    }
  }

  saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects to localStorage:', error);
      throw error;
    }
  }

  migrateIfNeeded(project: Project): Project {
    if (project.schemaVersion === CURRENT_SCHEMA_VERSION) {
      return project;
    }

    // Migration logic for future schema versions
    // For now, just ensure schemaVersion is set
    if (!project.schemaVersion) {
      project.schemaVersion = 1;
    }

    // Ensure language is set (default to 'en')
    if (!project.language) {
      project.language = 'en';
    }

    return project;
  }
}

export const storageService = new StorageServiceImpl();






