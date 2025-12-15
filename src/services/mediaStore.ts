const DB_NAME = 'interactiveGiftMedia';
const STORE_NAME = 'media';
const DB_VERSION = 1;

export type MediaType = 'image' | 'audio' | 'video';

export interface MediaMetadata {
  id: string;
  type: MediaType;
  filename: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
  previewDataUrl?: string; // optional legacy hint for migration
}

interface MediaRecord {
  id: string; // `${projectId}:${mediaId}`
  projectId: string;
  mediaId: string;
  type: MediaType;
  metadata: MediaMetadata;
  blob: Blob;
  createdAt: string;
}

type StoreMode = IDBTransactionMode;

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('projectId_type', ['projectId', 'type'], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open media store'));
  });
}

async function withStore<T>(
  mode: StoreMode,
  callback: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = callback(store);

    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('Media store request failed'));
    tx.onabort = () => reject(tx.error ?? new Error('Media store transaction aborted'));
  });
}

function makeId(projectId: string, mediaId: string) {
  return `${projectId}:${mediaId}`;
}

export async function putMedia(params: {
  projectId: string;
  mediaId?: string;
  type: MediaType;
  blob: Blob;
  metadata: Omit<MediaMetadata, 'id' | 'type' | 'size' | 'mime' | 'createdAt'> & Partial<MediaMetadata>;
}): Promise<MediaMetadata> {
  const { projectId, type, blob } = params;
  const mediaId = params.mediaId ?? params.metadata.id ?? `media_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = params.metadata.createdAt ?? new Date().toISOString();
  const metadata: MediaMetadata = {
    id: mediaId,
    type,
    filename: params.metadata.filename ?? 'unknown',
    mime: params.metadata.mime ?? (blob.type || 'application/octet-stream'),
    size: params.metadata.size ?? blob.size,
    width: params.metadata.width,
    height: params.metadata.height,
    duration: params.metadata.duration,
    createdAt,
    previewDataUrl: params.metadata.previewDataUrl,
  };

  const record: MediaRecord = {
    id: makeId(projectId, mediaId),
    projectId,
    mediaId,
    type,
    metadata,
    blob,
    createdAt,
  };

  await withStore<void>('readwrite', (store) => store.put(record));
  return metadata;
}

export async function getMediaBlob(projectId: string, mediaId: string): Promise<Blob | null> {
  const id = makeId(projectId, mediaId);
  const record = await withStore<MediaRecord | undefined>('readonly', (store) => store.get(id));
  return record ? record.blob : null;
}

export async function getMediaMetadata(projectId: string, mediaId: string): Promise<MediaMetadata | null> {
  const id = makeId(projectId, mediaId);
  const record = await withStore<MediaRecord | undefined>('readonly', (store) => store.get(id));
  return record ? record.metadata : null;
}

export async function hasMedia(projectId: string, mediaId: string): Promise<boolean> {
  const id = makeId(projectId, mediaId);
  const exists = await withStore<MediaRecord | undefined>('readonly', (store) => store.get(id));
  return !!exists;
}

export async function deleteMedia(projectId: string, mediaId: string): Promise<void> {
  const id = makeId(projectId, mediaId);
  await withStore<void>('readwrite', (store) => store.delete(id));
}

export async function deleteAllProjectMedia(projectId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('projectId');
    const range = IDBKeyRange.only(projectId);
    const cursorRequest = index.openCursor(range);

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete project media'));
    tx.onabort = () => reject(tx.error ?? new Error('Project media deletion aborted'));
  });
}

export async function listProjectMedia(projectId: string, type?: MediaType): Promise<MediaMetadata[]> {
  const db = await openDb();
  return new Promise<MediaMetadata[]>((resolve, reject) => {
    const results: MediaMetadata[] = [];
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const source = type ? store.index('projectId_type') : store.index('projectId');
    const range = type ? IDBKeyRange.only([projectId, type]) : IDBKeyRange.only(projectId);
    const cursorRequest = source.openCursor(range);

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        const record = cursor.value as MediaRecord;
        results.push(record.metadata);
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve(results);
    tx.onerror = () => reject(tx.error ?? new Error('Failed to list project media'));
    tx.onabort = () => reject(tx.error ?? new Error('List project media aborted'));
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export function getMediaKey(projectId: string, mediaId: string): string {
  return makeId(projectId, mediaId);
}
