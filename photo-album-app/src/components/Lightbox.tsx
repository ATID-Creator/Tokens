import { useState, useEffect, useCallback } from 'react';
import type { Photo } from '../types';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
}

export default function Lightbox({ photos, currentIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(currentIndex);
  const photo = photos[index];

  const goNext = useCallback(() => {
    setIndex(i => (i + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setIndex(i => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  if (!photo) return null;

  return (
    <div className="lightbox" onClick={onClose}>
      <div className="lightbox-content" onClick={e => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>×</button>
        {photos.length > 1 && (
          <>
            <button className="lightbox-nav lightbox-prev" onClick={goPrev}>‹</button>
            <button className="lightbox-nav lightbox-next" onClick={goNext}>›</button>
          </>
        )}
        <img src={photo.dataUrl} alt={photo.name} className="lightbox-image" />
        <div className="lightbox-info">
          <span>{photo.name}</span>
          <span>{index + 1} / {photos.length}</span>
        </div>
      </div>
    </div>
  );
}
