interface HeaderProps {
  currentAlbum: string | null;
  albumName: string;
  onBack: () => void;
}

export default function Header({ currentAlbum, albumName, onBack }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        {currentAlbum && (
          <button className="btn btn-back" onClick={onBack}>
            ← 戻る
          </button>
        )}
        <h1 className="header-title">
          {currentAlbum ? albumName : '📸 フォトアルバム'}
        </h1>
      </div>
    </header>
  );
}
