import type { Photo } from '../types';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
  onDelete: (id: string) => void;
}

export default function PhotoGrid({ photos, onPhotoClick, onDelete }: PhotoGridProps) {
  return (
    <div className="photo-grid">
      {photos.map((photo, index) => (
        <div key={photo.id} className="photo-card" onClick={() => onPhotoClick(index)}>
          <img src={photo.thumbnail} alt={photo.name} loading="lazy" />
          <div className="photo-overlay">
            <span className="photo-name">{photo.name}</span>
            <button
              className="btn btn-delete-photo"
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
              title="削除"
            >
              🗑
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
