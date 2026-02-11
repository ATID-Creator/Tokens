import { useState, useEffect, useCallback } from 'react';
import type { Album, Photo } from './types';
import * as db from './db';

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await db.getAllAlbums();
    data.sort((a, b) => b.updatedAt - a.updatedAt);
    setAlbums(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const createAlbum = useCallback(async (name: string, description: string) => {
    const album: Album = {
      id: db.generateId(),
      name,
      description,
      coverPhotoId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.saveAlbum(album);
    await refresh();
    return album;
  }, [refresh]);

  const removeAlbum = useCallback(async (id: string) => {
    await db.deleteAlbum(id);
    await refresh();
  }, [refresh]);

  return { albums, loading, createAlbum, removeAlbum, refresh };
}

export function usePhotos(albumId: string | null) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!albumId) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await db.getPhotosByAlbum(albumId);
    data.sort((a, b) => b.createdAt - a.createdAt);
    setPhotos(data);
    setLoading(false);
  }, [albumId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addPhotos = useCallback(async (files: File[]) => {
    if (!albumId) return;
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      const { width, height } = await getImageDimensions(dataUrl);
      const thumbnail = await createThumbnail(dataUrl, 300);
      const photo: Photo = {
        id: db.generateId(),
        albumId,
        name: file.name,
        dataUrl,
        thumbnail,
        width,
        height,
        createdAt: Date.now(),
      };
      await db.savePhoto(photo);
    }
    // Update album cover if it doesn't have one
    const album = await db.getAlbum(albumId);
    if (album && !album.coverPhotoId) {
      const photos = await db.getPhotosByAlbum(albumId);
      if (photos.length > 0) {
        album.coverPhotoId = photos[0].id;
        album.updatedAt = Date.now();
        await db.saveAlbum(album);
      }
    }
    await refresh();
  }, [albumId, refresh]);

  const removePhoto = useCallback(async (photoId: string) => {
    await db.deletePhoto(photoId);
    await refresh();
  }, [refresh]);

  return { photos, loading, addPhotos, removePhoto, refresh };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.src = dataUrl;
  });
}

function createThumbnail(dataUrl: string, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) { height *= maxSize / width; width = maxSize; }
      } else {
        if (height > maxSize) { width *= maxSize / height; height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}
