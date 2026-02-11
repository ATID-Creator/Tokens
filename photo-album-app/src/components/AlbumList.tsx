import type { Album, Photo } from '../types';

interface AlbumListProps {
  albums: Album[];
  coverPhotos: Map<string, Photo>;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

export default function AlbumList({ albums, coverPhotos, onSelect, onCreate, onDelete }: AlbumListProps) {
  return (
    <div className="album-list">
      <div className="album-card album-card-new" onClick={onCreate}>
        <div className="album-card-cover album-card-cover-empty">
          <span className="album-card-plus">+</span>
        </div>
        <div className="album-card-info">
          <h3>新しいアルバム</h3>
        </div>
      </div>
      {albums.map(album => {
        const cover = album.coverPhotoId ? coverPhotos.get(album.coverPhotoId) : null;
        return (
          <div key={album.id} className="album-card" onClick={() => onSelect(album.id)}>
            <div className="album-card-cover">
              {cover ? (
                <img src={cover.thumbnail} alt={album.name} />
              ) : (
                <div className="album-card-cover-empty">
                  <span>📷</span>
                </div>
              )}
            </div>
            <div className="album-card-info">
              <h3>{album.name}</h3>
              <p>{album.description}</p>
            </div>
            <button
              className="btn btn-delete-album"
              onClick={(e) => { e.stopPropagation(); onDelete(album.id); }}
              title="削除"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
