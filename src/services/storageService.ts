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
    // Always clean up stale image references, even for current schema version
    this.cleanupStaleImageReferences(project);
    this.cleanupVideoReferences(project);

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

  // Clean up stale image references - remove image IDs from screens that don't exist in project.images
  private cleanupStaleImageReferences(project: Project): void {
    if (!project.data?.images || !project.data?.screens) {
      return;
    }

    const validImageIds = new Set(project.data.images.map(img => img.id));
    let hasChanges = false;

    // Clean up image references in all screens
    for (const [, screenData] of Object.entries(project.data.screens)) {
      if (screenData.images && Array.isArray(screenData.images)) {
        const originalLength = screenData.images.length;
        screenData.images = screenData.images.filter(imageId => validImageIds.has(imageId));
        if (screenData.images.length !== originalLength) {
          hasChanges = true;
        }
      }
    }

    // If we cleaned up references, update the project (but don't save yet - let the auto-save handle it)
    if (hasChanges) {
      // The project object is already modified in place, so no need to return anything
      // The caller will save it if needed
    }
  }

  private cleanupVideoReferences(project: Project): void {
    if (!project.data) return;

    if (!project.data.videos) {
      project.data.videos = [];
    }

    const validVideoIds = new Set(project.data.videos.map(v => v.id));
    const validImageIds = new Set(project.data.images?.map(img => img.id));

    let hasChanges = false;

    project.data.screens = Object.fromEntries(
      Object.entries(project.data.screens || {}).map(([screenId, screenData]) => {
        const mediaMode = screenData.mediaMode || 'classic';
        const isVideoMode = mediaMode === 'video';
        const videoValid = screenData.videoId && validVideoIds.has(screenData.videoId);
        const nextMediaMode = isVideoMode && videoValid ? 'video' : 'classic';

        if (mediaMode !== nextMediaMode || (isVideoMode && !videoValid)) {
          hasChanges = true;
        }

        const cleanedImages =
          nextMediaMode === 'classic'
            ? screenData.images?.filter(id => validImageIds.has(id)) || []
            : [];

        return [
          screenId,
          {
            ...screenData,
            mediaMode: nextMediaMode,
            videoId: nextMediaMode === 'video' ? screenData.videoId : undefined,
            images: cleanedImages,
            audioId: nextMediaMode === 'classic' ? screenData.audioId : undefined,
            extendMusicToNext: nextMediaMode === 'classic' ? screenData.extendMusicToNext : undefined,
            galleryLayout: nextMediaMode === 'classic' ? screenData.galleryLayout : undefined,
          },
        ];
      })
    );

    if (hasChanges) {
      // updated project in place
    }
  }
}

export const storageService = new StorageServiceImpl();
