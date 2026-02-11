import { useState } from 'react';

interface CreateAlbumModalProps {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export default function CreateAlbumModal({ onClose, onCreate }: CreateAlbumModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), description.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>新しいアルバムを作成</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="album-name">アルバム名</label>
            <input
              id="album-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：夏休みの思い出"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="album-desc">説明（任意）</label>
            <textarea
              id="album-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="アルバムの説明を入力..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>キャンセル</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>作成</button>
          </div>
        </form>
      </div>
    </div>
  );
}
