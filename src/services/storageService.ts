import type { AudioFile, ImageData, Project } from '../types/project';
import { dataUrlToBlob, putMedia } from './mediaStore';

const STORAGE_KEY = 'interactiveGiftCreator_v1';
const CURRENT_SCHEMA_VERSION = 1;

export interface StorageService {
  loadProjects: () => Promise<Project[]>;
  saveProjects: (projects: Project[]) => void;
  migrateIfNeeded: (project: Project) => Promise<Project>;
}

class StorageServiceImpl implements StorageService {
  async loadProjects(): Promise<Project[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const projects = JSON.parse(data) as Project[];
      const migrated = await Promise.all(projects.map((p) => this.migrateIfNeeded(p)));
      return migrated;
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
