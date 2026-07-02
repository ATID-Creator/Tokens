export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: number;
  created_at: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description: string;
  category: string;
  cover_color: string;
  total_copies: number;
  available_copies: number;
  published_year: number;
  created_at: string;
}

export interface BorrowRecord {
  id: number;
  user_id: number;
  book_id: number;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  book_title?: string;
  book_author?: string;
  cover_color?: string;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}
