import type { AudioFile, ImageData, Project } from '../types/project';
import { dataUrlToBlob, putMedia } from './mediaStore';

const STORAGE_KEY = 'interactiveGiftCreator_v1';
const STORAGE_KEY_INDEX = 'interactiveGiftCreator_v1_index';
const STORAGE_KEY_PROJECT_PREFIX = 'interactiveGiftCreator_v1_project_';
const CURRENT_SCHEMA_VERSION = 1;

interface ProjectIndexEntry {
  id: string;
  name: string;
  templateId: string;
  updatedAt: string;
  createdAt: string;
}

export interface StorageService {
  loadProjects: () => Promise<Project[]>;
  saveProjects: (projects: Project[]) => void;
  saveProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  migrateIfNeeded: (project: Project) => Promise<Project>;
  flushPendingWrites: () => boolean;
}

class StorageServiceImpl implements StorageService {
  private pendingWrites = new Map<string, Project>();
  private idleCallbackHandle: number | null = null;
  private idleCallbackTimeout: number | null = null;

  async loadProjects(): Promise<Project[]> {
    try {
      // Try new per-project storage first
      const indexData = localStorage.getItem(STORAGE_KEY_INDEX);
      if (indexData) {
        const index = JSON.parse(indexData) as ProjectIndexEntry[];
        const projects: Project[] = [];
        const validEntries: ProjectIndexEntry[] = [];
        
        // Self-heal: only keep entries that have corresponding project keys
        for (const entry of index) {
          const projectKey = `${STORAGE_KEY_PROJECT_PREFIX}${entry.id}`;
          const projectData = localStorage.getItem(projectKey);
          if (projectData) {
            try {
              const project = JSON.parse(projectData) as Project;
              const migrated = await this.migrateIfNeeded(project);
              projects.push(migrated);
              validEntries.push(entry);
            } catch (err) {
              console.error(`Error loading project ${entry.id}:`, err);
              // Entry exists but project is invalid - don't add to validEntries
            }
          }
          // If projectData is null, entry has no corresponding project - don't add to validEntries
        }
        
        // Self-heal: write back cleaned index if it differs
        if (validEntries.length !== index.length) {
          // Sort by updatedAt desc for stable ordering
          validEntries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          try {
            localStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(validEntries));
            if (import.meta.env.DEV) {
              console.log(`[storageService] Self-healed index: removed ${index.length - validEntries.length} invalid entries`);
            }
          } catch (err) {
            console.error('[storageService] Failed to write cleaned index:', err);
          }
        }
        
        // If we have valid projects, return them
        if (projects.length > 0) {
          return projects;
        }
        
        // If index exists but no valid projects loaded, clear index and try old storage
        if (index.length > 0) {
          try {
            localStorage.removeItem(STORAGE_KEY_INDEX);
            if (import.meta.env.DEV) {
              console.log('[storageService] Cleared broken index, falling back to old storage');
            }
          } catch (err) {
            console.error('[storageService] Failed to clear broken index:', err);
          }
        }
      }
      
      // Fallback to old storage format for backward compatibility
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const projects = JSON.parse(data) as Project[];
      const migrated = await Promise.all(projects.map((p) => this.migrateIfNeeded(p)));
      
      // Migrate to new format
      if (migrated.length > 0) {
        this.saveProjects(migrated);
      }
      
      return migrated;
    } catch (error) {
      console.error('Error loading projects from localStorage:', error);
      return [];
    }
  }

  saveProjects(projects: Project[]): void {
    // Save all projects (used for initial migration and bulk operations)
    for (const project of projects) {
      this.saveProject(project);
    }
  }

  saveProject(project: Project): void {
    // Add to pending writes queue
    this.pendingWrites.set(project.id, project);
    
    // Schedule write during idle time
    this.scheduleIdleWrite();
  }

  private scheduleIdleWrite(): void {
    // Cancel any pending idle callback
    if (this.idleCallbackHandle !== null && typeof requestIdleCallback !== 'undefined') {
      cancelIdleCallback(this.idleCallbackHandle);
      this.idleCallbackHandle = null;
    }
    if (this.idleCallbackTimeout !== null) {
      clearTimeout(this.idleCallbackTimeout);
      this.idleCallbackTimeout = null;
    }

    // Use requestIdleCallback if available, with 1000ms timeout fallback
    if (typeof requestIdleCallback !== 'undefined') {
      this.idleCallbackHandle = requestIdleCallback(
        () => {
          this.idleCallbackHandle = null;
          this.flushPendingWrites();
        },
        { timeout: 1000 }
      );
    } else {
      // Fallback to setTimeout for browsers without requestIdleCallback
      this.idleCallbackTimeout = window.setTimeout(() => {
        this.idleCallbackTimeout = null;
        this.flushPendingWrites();
      }, 0);
    }
  }

  deleteProject(projectId: string): void {
    try {
      // Remove from pending writes
      this.pendingWrites.delete(projectId);

      // Remove project storage
      const projectKey = `${STORAGE_KEY_PROJECT_PREFIX}${projectId}`;
      localStorage.removeItem(projectKey);

      // Update index
      const existingIndexData = localStorage.getItem(STORAGE_KEY_INDEX);
      if (existingIndexData) {
        const existingIndex = JSON.parse(existingIndexData) as ProjectIndexEntry[];
        const updatedIndex = existingIndex.filter(e => e.id !== projectId);
        localStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(updatedIndex));
      }
    } catch (error) {
      console.error('Error deleting project from localStorage:', error);
      throw error;
    }
  }

  flushPendingWrites(): boolean {
    if (this.pendingWrites.size === 0) return true;

    const startTime = import.meta.env.DEV ? performance.now() : 0;
    const projectsToSave = Array.from(this.pendingWrites.values());
    const successfulIds = new Set<string>();
    let hasErrors = false;

    try {
      // Update index
      const index: ProjectIndexEntry[] = projectsToSave.map(p => ({
        id: p.id,
        name: p.name,
        templateId: p.templateId,
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
      }));

      // Load existing index to merge
      let indexWriteSuccess = false;
      try {
        const existingIndexData = localStorage.getItem(STORAGE_KEY_INDEX);
        if (existingIndexData) {
          const existingIndex = JSON.parse(existingIndexData) as ProjectIndexEntry[];
          const indexMap = new Map(existingIndex.map(e => [e.id, e]));
          // Update or add entries
          for (const entry of index) {
            indexMap.set(entry.id, entry);
          }
          // Sort by updatedAt desc for stable ordering
          const sortedIndex = Array.from(indexMap.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          localStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(sortedIndex));
        } else {
          // Sort by updatedAt desc for stable ordering
          index.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          localStorage.setItem(STORAGE_KEY_INDEX, JSON.stringify(index));
        }
        indexWriteSuccess = true;
      } catch (indexError) {
        hasErrors = true;
        console.error('[storageService] Failed to write index:', indexError);
        if (import.meta.env.DEV) {
          console.error('[storageService] Index write failed, projects will not be removed from pending queue');
        }
      }

      // Save each project individually - only remove from pendingWrites on success
      let totalSize = 0;
      let stringifyTime = 0;
      let writeTime = 0;

      for (const project of projectsToSave) {
        try {
          const projectKey = `${STORAGE_KEY_PROJECT_PREFIX}${project.id}`;
          
          // Measure stringify time
          const stringifyStart = import.meta.env.DEV ? performance.now() : 0;
          const jsonString = JSON.stringify(project);
          if (import.meta.env.DEV) {
            stringifyTime += performance.now() - stringifyStart;
          }
          totalSize += jsonString.length;
          
          // Measure write time
          const writeStart = import.meta.env.DEV ? performance.now() : 0;
          localStorage.setItem(projectKey, jsonString);
          if (import.meta.env.DEV) {
            writeTime += performance.now() - writeStart;
          }
          
          // Only mark as successful if both index and project write succeeded
          if (indexWriteSuccess) {
            successfulIds.add(project.id);
          }
        } catch (projectError) {
          hasErrors = true;
          console.error(`[storageService] Failed to write project ${project.id}:`, projectError);
          if (import.meta.env.DEV) {
            console.error(`[storageService] Project ${project.id} will remain in pending queue for retry`);
          }
          // Don't add to successfulIds - will remain in pendingWrites
        }
      }

      // Only remove successfully written projects from pending queue
      for (const id of successfulIds) {
        this.pendingWrites.delete(id);
      }

      if (import.meta.env.DEV) {
        const duration = performance.now() - startTime;
        console.log('[storageService] Flushed pending writes', {
          projectCount: projectsToSave.length,
          successfulCount: successfulIds.size,
          failedCount: projectsToSave.length - successfulIds.size,
          totalSizeBytes: totalSize,
          stringifyTime: `${stringifyTime.toFixed(2)}ms`,
          writeTime: `${writeTime.toFixed(2)}ms`,
          totalTime: `${duration.toFixed(2)}ms`,
          success: !hasErrors,
        });
      }

      return !hasErrors && successfulIds.size === projectsToSave.length;
    } catch (error) {
      hasErrors = true;
      console.error('[storageService] Error flushing pending writes to localStorage:', error);
      if (import.meta.env.DEV) {
        console.error('[storageService] All projects will remain in pending queue for retry');
      }
      // Don't throw - fail soft, keep projects in pendingWrites for retry
      return false;
    }
  }

  async migrateIfNeeded(project: Project): Promise<Project> {
    await this.migrateLegacyMedia(project);
    // Always clean up stale references
    this.cleanupStaleImageReferences(project);
    this.cleanupVideoReferences(project);

    if (project.schemaVersion === CURRENT_SCHEMA_VERSION) {
      return project;
    }

    if (!project.schemaVersion) {
      project.schemaVersion = 1;
    }

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

  private async migrateLegacyMedia(project: Project): Promise<void> {
    if (!project?.data) return;
    const now = new Date().toISOString();

    // Images: move base64 data URLs into media store
    if (Array.isArray(project.data.images)) {
      const migratedImages: ImageData[] = [];
      for (const img of project.data.images) {
        const legacyData = (img as any).data as string | undefined;
        const hasLegacyData = typeof legacyData === 'string' && legacyData.startsWith('data:');
        const metadata: ImageData = {
          id: img.id,
          filename: img.filename || 'image',
          mime: (img as any).mime || (hasLegacyData ? legacyData.split(';')[0].replace('data:', '') : 'image/webp'),
          size: img.size,
          width: img.width,
          height: img.height,
          createdAt: img.createdAt || now,
        };

        if (hasLegacyData) {
          try {
            const blob = await dataUrlToBlob(legacyData);
            await putMedia({
              projectId: project.id,
              mediaId: metadata.id,
              type: 'image',
              blob,
              metadata,
            });
          } catch (err) {
            console.error('Failed to migrate image to media store', err);
          }
        }
        migratedImages.push(metadata);
      }
      project.data.images = migratedImages;
    }

    // Audio: move base64 data URLs into media store
    if (project.data.audio) {
      const migrateAudioFile = async (audio: any | undefined): Promise<AudioFile | undefined> => {
        if (!audio) return undefined;
        const legacyData = audio.data as string | undefined;
        const hasLegacy = typeof legacyData === 'string' && legacyData.startsWith('data:');
        const audioMeta: AudioFile = {
          id: audio.id,
          filename: audio.filename || 'audio',
          mime: audio.mime || (hasLegacy ? legacyData.split(';')[0].replace('data:', '') : 'audio/mpeg'),
          size: audio.size,
          duration: audio.duration,
          createdAt: audio.createdAt || now,
        };

        if (hasLegacy) {
          try {
            const blob = await dataUrlToBlob(legacyData);
            await putMedia({
              projectId: project.id,
              mediaId: audioMeta.id,
              type: 'audio',
              blob,
              metadata: audioMeta,
            });
          } catch (err) {
            console.error('Failed to migrate audio to media store', err);
          }
        }
        return audioMeta;
      };

      if (project.data.audio.global) {
        project.data.audio.global = (await migrateAudioFile(project.data.audio.global)) || project.data.audio.global;
      }

      const migratedScreens: Record<string, AudioFile> = {};
      for (const [screenId, audio] of Object.entries(project.data.audio.screens || {})) {
        const migrated = await migrateAudioFile(audio);
        if (migrated) migratedScreens[screenId] = migrated;
      }
      project.data.audio.screens = migratedScreens;

      if (Array.isArray(project.data.audio.library)) {
        project.data.audio.library = (
          await Promise.all(project.data.audio.library.map((audio) => migrateAudioFile(audio)))
        ).filter((a): a is AudioFile => !!a);
      }
    }
  }
}

export const storageService = new StorageServiceImpl();
