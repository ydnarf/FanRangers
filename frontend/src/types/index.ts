export interface Collection {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  heroImage: string | null;
  type: 'SERIES' | 'FILMS';
  featured: boolean;
  _count?: { seasons: number; videos: number };
  seasons?: Season[];
  videos?: Video[];
}

export interface Season {
  id: string;
  number: number;
  title: string | null;
  description: string | null;
  collection?: { id: string; title: string };
  episodes?: Episode[];
  _count?: { episodes: number };
}

export interface Episode {
  id: string;
  number: number;
  title: string;
  synopsis: string | null;
  thumbnail: string | null;
  duration: number | null;
  youtubeId: string | null;
  downloadLink: string | null;
  season?: { id: string; number: number; collection: { id: string; title: string } };
}

export interface Video {
  id: string;
  title: string;
  synopsis: string | null;
  thumbnail: string | null;
  duration: number | null;
  featured: boolean;
  youtubeId: string | null;
  downloadLink: string | null;
  collection?: { id: string; title: string; type?: string } | null;
}

export interface ContentCardItem {
  id: string;
  title: string;
  thumbnail: string | null;
  href: string;
  type?: 'series' | 'film' | 'episode';
  progress?: number;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'FREE' | 'PREMIUM' | 'ADMIN';
  createdAt?: string;
}

export interface Favorite {
  id: string;
  episode?: Episode | null;
  video?: Video | null;
}

export interface WatchProgress {
  id: string;
  currentTime: number;
  duration: number;
  updatedAt: string;
  episode?: Episode | null;
  video?: Video | null;
}

export interface AdminStats {
  collections: number;
  seasons: number;
  episodes: number;
  videos: number;
  users: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'FREE' | 'PREMIUM' | 'ADMIN';
  createdAt: string;
}
