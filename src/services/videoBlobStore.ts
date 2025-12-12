const DB_NAME = 'interactiveGiftVideos';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

interface StoredVideoBlob {
  id: string; // `${projectId}:${videoId}`
  projectId: string;
  videoId: string;
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open video blob store'));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = callback(store);

        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error ?? new Error('Video blob store request failed'));
        tx.onabort = () => reject(tx.error ?? new Error('Video blob transaction aborted'));
      })
  );
}

export async function saveVideoBlob(projectId: string, videoId: string, blob: Blob): Promise<void> {
  const record: StoredVideoBlob = {
    id: `${projectId}:${videoId}`,
    projectId,
    videoId,
    blob,
  };
  await withStore<void>('readwrite', (store) => store.put(record));
}

export async function getVideoBlob(projectId: string, videoId: string): Promise<Blob | null> {
  const id = `${projectId}:${videoId}`;
  return withStore<StoredVideoBlob | undefined>('readonly', (store) => store.get(id)).then((res) =>
    res ? res.blob : null
  );
}

export async function deleteVideoBlob(projectId: string, videoId: string): Promise<void> {
  const id = `${projectId}:${videoId}`;
  await withStore<void>('readwrite', (store) => store.delete(id));
}

export async function deleteProjectVideos(projectId: string): Promise<void> {
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
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete project videos'));
    tx.onabort = () => reject(tx.error ?? new Error('Project video deletion aborted'));
  });
}

export async function hasVideoBlob(projectId: string, videoId: string): Promise<boolean> {
  const blob = await getVideoBlob(projectId, videoId);
  return !!blob;
}


