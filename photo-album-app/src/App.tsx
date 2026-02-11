import { useState, useEffect, useCallback } from 'react';
import './App.css';
import type { Photo } from './types';
import { useAlbums, usePhotos } from './hooks';
import * as db from './db';
import Header from './components/Header';
import AlbumList from './components/AlbumList';
import PhotoGrid from './components/PhotoGrid';
import UploadZone from './components/UploadZone';
import Lightbox from './components/Lightbox';
import CreateAlbumModal from './components/CreateAlbumModal';

function App() {
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [coverPhotos, setCoverPhotos] = useState<Map<string, Photo>>(new Map());

  const { albums, loading: albumsLoading, createAlbum, removeAlbum } = useAlbums();
  const { photos, loading: photosLoading, addPhotos, removePhoto } = usePhotos(currentAlbumId);

  const currentAlbum = albums.find(a => a.id === currentAlbumId);

  // Load cover photos for albums
  const loadCoverPhotos = useCallback(async () => {
    const covers = new Map<string, Photo>();
    for (const album of albums) {
      if (album.coverPhotoId) {
        const photo = await db.getPhoto(album.coverPhotoId);
        if (photo) covers.set(album.coverPhotoId, photo);
      }
    }
    setCoverPhotos(covers);
  }, [albums]);

  useEffect(() => {
    loadCoverPhotos();
  }, [loadCoverPhotos]);

  const handleCreateAlbum = async (name: string, description: string) => {
    await createAlbum(name, description);
  };

  const handleDeleteAlbum = async (id: string) => {
    if (confirm('このアルバムを削除しますか？')) {
      await removeAlbum(id);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm('この写真を削除しますか？')) {
      await removePhoto(id);
    }
  };

  return (
    <div className="app">
      <Header
        currentAlbum={currentAlbumId}
        albumName={currentAlbum?.name ?? ''}
        onBack={() => setCurrentAlbumId(null)}
      />

      {!currentAlbumId ? (
        // Album List View
        albumsLoading ? (
          <div className="loading">読み込み中...</div>
        ) : (
          <AlbumList
            albums={albums}
            coverPhotos={coverPhotos}
            onSelect={setCurrentAlbumId}
            onCreate={() => setShowCreateModal(true)}
            onDelete={handleDeleteAlbum}
          />
        )
      ) : (
        // Photo View
        <>
          <UploadZone onUpload={addPhotos} />
          {photosLoading ? (
            <div className="loading">読み込み中...</div>
          ) : photos.length === 0 ? (
            <div className="empty-state">
              <p>まだ写真がありません。上のエリアから写真を追加してください。</p>
            </div>
          ) : (
            <PhotoGrid
              photos={photos}
              onPhotoClick={setLightboxIndex}
              onDelete={handleDeletePhoto}
            />
          )}
        </>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {showCreateModal && (
        <CreateAlbumModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAlbum}
        />
      )}
    </div>
  );
}

export default App;
