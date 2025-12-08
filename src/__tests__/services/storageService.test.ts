import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../../services/storageService';
import type { Project } from '../../types/project';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should load empty array when no projects exist', () => {
    const projects = storageService.loadProjects();
    expect(projects).toEqual([]);
  });

  it('should save and load projects', () => {
    const project: Project = {
      id: 'test-1',
      name: 'Test Project',
      templateId: 'romantic',
      schemaVersion: 1,
      language: 'en',
      data: {
        screens: {},
        images: [],
        audio: { screens: {} },
        overlay: { type: 'heart' },
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    storageService.saveProjects([project]);
    const loaded = storageService.loadProjects();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe('test-1');
  });

  it('should migrate project without schemaVersion', () => {
    const oldProject = {
      id: 'test-1',
      name: 'Test',
      templateId: 'romantic',
      data: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    } as any;

    const migrated = storageService.migrateIfNeeded(oldProject);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.language).toBe('en');
  });
});





