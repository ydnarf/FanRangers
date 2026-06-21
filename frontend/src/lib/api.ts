import type { Collection, Season, Episode, Video, Favorite, WatchProgress, AdminStats, User, AdminUser } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `API error ${response.status}`);
  }
  // 204 No Content
  if (response.status === 204) return undefined as unknown as T;
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

export function getCollections(): Promise<Collection[]> {
  return apiFetch<Collection[]>('/api/collections');
}

export function getCollection(id: string): Promise<Collection> {
  return apiFetch<Collection>(`/api/collections/${id}`);
}

export function getSeason(id: string): Promise<Season> {
  return apiFetch<Season>(`/api/seasons/${id}`);
}

export function getEpisode(id: string): Promise<Episode> {
  return apiFetch<Episode>(`/api/episodes/${id}`);
}

export function getVideos(): Promise<Video[]> {
  return apiFetch<Video[]>('/api/videos');
}

export function getVideo(id: string): Promise<Video> {
  return apiFetch<Video>(`/api/videos/${id}`);
}

export function getThumbnailUrl(thumbnail: string): string {
  if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
    return thumbnail;
  }
  return `${API_URL}/thumbnails/${thumbnail}`;
}

export function getEpisodeDownloadUrl(id: string): string {
  return `${API_URL}/api/download/episode/${id}`;
}

export function getVideoDownloadUrl(id: string): string {
  return `${API_URL}/api/download/video/${id}`;
}

// ---------------------------------------------------------------------------
// Auth — token lives in an HttpOnly cookie set by the backend
// ---------------------------------------------------------------------------

export function login(email: string, password: string): Promise<{ user: User }> {
  return authFetch<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string, name?: string): Promise<{ user: User }> {
  return authFetch<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export function logout(): Promise<void> {
  return authFetch<void>('/api/auth/logout', { method: 'POST' });
}

export function getMe(): Promise<User> {
  return authFetch<User>('/api/auth/me');
}

// ---------------------------------------------------------------------------
// User — requires authenticated session (HttpOnly cookie)
// ---------------------------------------------------------------------------

export function getFavorites(): Promise<Favorite[]> {
  return authFetch<Favorite[]>('/api/user/favorites');
}

export function addFavorite(body: { episodeId?: string; videoId?: string }): Promise<Favorite> {
  return authFetch<Favorite>('/api/user/favorites', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function removeFavorite(id: string): Promise<void> {
  return authFetch<void>(`/api/user/favorites/${id}`, { method: 'DELETE' });
}

export function getProgress(): Promise<WatchProgress[]> {
  return authFetch<WatchProgress[]>('/api/user/progress');
}

export function getItemProgress(
  type: 'episode' | 'video',
  id: string
): Promise<{ currentTime: number; duration: number } | null> {
  return authFetch<{ currentTime: number; duration: number } | null>(
    `/api/user/progress/${type}/${id}`
  );
}

export function saveProgress(body: {
  episodeId?: string;
  videoId?: string;
  currentTime: number;
  duration: number;
}): Promise<WatchProgress> {
  return authFetch<WatchProgress>('/api/user/progress', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Admin — requires authenticated session (HttpOnly cookie) + ADMIN role
// ---------------------------------------------------------------------------

export function getAdminStats(): Promise<AdminStats> {
  return authFetch<AdminStats>('/api/admin/stats');
}

// Collections

export function adminGetCollections(): Promise<Collection[]> {
  return authFetch<Collection[]>('/api/admin/collections');
}

export function adminCreateCollection(data: Partial<Collection>): Promise<Collection> {
  return authFetch<Collection>('/api/admin/collections', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function adminUpdateCollection(id: string, data: Partial<Collection>): Promise<Collection> {
  return authFetch<Collection>(`/api/admin/collections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function adminDeleteCollection(id: string): Promise<void> {
  return authFetch<void>(`/api/admin/collections/${id}`, { method: 'DELETE' });
}

// Seasons

export function adminGetSeasons(collectionId: string): Promise<Season[]> {
  return authFetch<Season[]>(`/api/admin/seasons?collectionId=${encodeURIComponent(collectionId)}`);
}

export function adminCreateSeason(data: {
  collectionId: string;
  number: number;
  title?: string;
  description?: string;
}): Promise<Season> {
  return authFetch<Season>('/api/admin/seasons', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function adminUpdateSeason(id: string, data: Partial<Season>): Promise<Season> {
  return authFetch<Season>(`/api/admin/seasons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function adminDeleteSeason(id: string): Promise<void> {
  return authFetch<void>(`/api/admin/seasons/${id}`, { method: 'DELETE' });
}

// Episodes

export function adminGetEpisodes(seasonId: string): Promise<Episode[]> {
  return authFetch<Episode[]>(`/api/admin/episodes?seasonId=${encodeURIComponent(seasonId)}`);
}

export function adminCreateEpisode(data: {
  seasonId: string;
  number: number;
  title: string;
  synopsis?: string;
  thumbnail?: string;
  duration?: number;
  youtubeId?: string;
  downloadLink?: string;
}): Promise<Episode> {
  return authFetch<Episode>('/api/admin/episodes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function adminUpdateEpisode(
  id: string,
  data: Partial<Episode & { seasonId: string; youtubeId?: string; downloadLink?: string }>
): Promise<Episode> {
  return authFetch<Episode>(`/api/admin/episodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function adminDeleteEpisode(id: string): Promise<void> {
  return authFetch<void>(`/api/admin/episodes/${id}`, { method: 'DELETE' });
}

// Videos

export function adminGetVideos(): Promise<Video[]> {
  return authFetch<Video[]>('/api/admin/videos');
}

export function adminCreateVideo(data: {
  title: string;
  synopsis?: string;
  thumbnail?: string;
  duration?: number;
  featured?: boolean;
  collectionId?: string;
  youtubeId?: string;
  downloadLink?: string;
}): Promise<Video> {
  return authFetch<Video>('/api/admin/videos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function adminUpdateVideo(
  id: string,
  data: Partial<Video & { youtubeId?: string; downloadLink?: string; collectionId?: string }>
): Promise<Video> {
  return authFetch<Video>(`/api/admin/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function adminDeleteVideo(id: string): Promise<void> {
  return authFetch<void>(`/api/admin/videos/${id}`, { method: 'DELETE' });
}

// Users

export async function adminGetUsers(): Promise<AdminUser[]> {
  const data = await authFetch<{ users: AdminUser[] }>('/api/admin/users');
  return data.users;
}

export function adminUpdateUserRole(id: string, role: 'FREE' | 'PREMIUM'): Promise<{ id: string; role: string }> {
  return authFetch<{ id: string; role: string }>(`/api/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
}

// File upload

export async function uploadFile(type: 'thumbnail', file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`${API_URL}/api/admin/upload/${type}`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? 'Upload failed');
  }
  const { filename } = await response.json() as { filename: string };
  return filename;
}
