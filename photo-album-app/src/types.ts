export interface Photo {
  id: string;
  albumId: string;
  name: string;
  dataUrl: string;
  thumbnail: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface Album {
  id: string;
  name: string;
  description: string;
  coverPhotoId: string | null;
  createdAt: number;
  updatedAt: number;
}
