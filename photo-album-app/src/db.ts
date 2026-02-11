import type { Photo, Album } from './types';

const DB_NAME = 'PhotoAlbumDB';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('albums')) {
        db.createObjectStore('albums', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('photos')) {
        const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
        photoStore.createIndex('albumId', 'albumId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction<T>(storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const req = callback(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

// Album operations
export async function getAllAlbums(): Promise<Album[]> {
  return transaction<Album[]>('albums', 'readonly', store => store.getAll());
}

export async function getAlbum(id: string): Promise<Album | undefined> {
  return transaction<Album | undefined>('albums', 'readonly', store => store.get(id));
}

export async function saveAlbum(album: Album): Promise<void> {
  await transaction('albums', 'readwrite', store => store.put(album));
}

export async function deleteAlbum(id: string): Promise<void> {
  // Delete all photos in the album first
  const photos = await getPhotosByAlbum(id);
  for (const photo of photos) {
    await deletePhoto(photo.id);
  }
  await transaction('albums', 'readwrite', store => store.delete(id));
}

// Photo operations
export async function getPhotosByAlbum(albumId: string): Promise<Photo[]> {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const index = store.index('albumId');
      const req = index.getAll(albumId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  return transaction<Photo | undefined>('photos', 'readonly', store => store.get(id));
}

export async function savePhoto(photo: Photo): Promise<void> {
  await transaction('photos', 'readwrite', store => store.put(photo));
}

export async function deletePhoto(id: string): Promise<void> {
  await transaction('photos', 'readwrite', store => store.delete(id));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
