import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetVideos,
  adminCreateVideo,
  adminUpdateVideo,
  adminGetCollections,
  getThumbnailUrl,
} from '../../lib/api';
import type { Collection } from '../../types';
import FileUploadButton from '../../components/FileUploadButton';
import {
  extractYouTubeId,
  youtubeEmbedUrl,
  YOUTUBE_IFRAME_ALLOW,
  YOUTUBE_IFRAME_REFERRER_POLICY,
} from '../../lib/youtube';

const INPUT_CLASS =
  'w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600/50 transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-[#f5f5f5] mb-1.5';

interface VideoForm {
  title: string;
  synopsis: string;
  thumbnail: string;
  duration: string;
  featured: boolean;
  collectionId: string;
  youtubeUrl: string;
  downloadLink: string;
}

export default function AdminVideoEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState<VideoForm>({
    title: '',
    synopsis: '',
    thumbnail: '',
    duration: '',
    featured: false,
    collectionId: '',
    youtubeUrl: '',
    downloadLink: '',
  });
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetCollections().then(setCollections).catch(() => {});

    if (isNew) { setLoading(false); return; }

    adminGetVideos()
      .then((vids) => {
        const video = vids.find((v) => v.id === id);
        if (!video) { setError('Video no encontrado'); return; }
        setForm({
          title: video.title,
          synopsis: video.synopsis ?? '',
          thumbnail: video.thumbnail ?? '',
          duration: video.duration != null ? String(video.duration) : '',
          featured: video.featured,
          collectionId: video.collection?.id ?? '',
          youtubeUrl: video.youtubeId ?? '',
          downloadLink: video.downloadLink ?? '',
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set(field: keyof VideoForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const extractedYouTubeId = extractYouTubeId(form.youtubeUrl);

  function handleAutoFillThumbnail() {
    if (!extractedYouTubeId) return;
    set('thumbnail', `https://img.youtube.com/vi/${extractedYouTubeId}/maxresdefault.jpg`);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const youtubeId = extractYouTubeId(form.youtubeUrl) ?? undefined;
      const payload = {
        title: form.title,
        synopsis: form.synopsis || undefined,
        thumbnail: form.thumbnail || undefined,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
        featured: form.featured,
        collectionId: form.collectionId || null,
        youtubeId,
        downloadLink: form.downloadLink || null,
      };
      if (isNew) {
        await adminCreateVideo(payload);
      } else {
        await adminUpdateVideo(id!, payload);
      }
      navigate('/admin/videos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl">
        {[1, 2, 3, 4].map((n) => <div key={n} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#a3a3a3] mb-6" aria-label="Ruta">
        <Link to="/admin/videos" className="hover:text-white transition-colors">Videos</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="text-[#f5f5f5]">{isNew ? 'Nuevo Video' : 'Editar Video'}</span>
      </nav>

      <h1 className="text-xl font-bold text-[#f5f5f5] mb-6">
        {isNew ? 'Nuevo Video' : 'Editar Video'}
      </h1>

      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-600/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4 mb-8">
        <div>
          <label htmlFor="vid-title" className={LABEL_CLASS}>
            Titulo <span className="text-red-500">*</span>
          </label>
          <input
            id="vid-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={INPUT_CLASS}
            placeholder="Titulo del video"
          />
        </div>

        <div>
          <label htmlFor="vid-synopsis" className={LABEL_CLASS}>Sinopsis</label>
          <textarea
            id="vid-synopsis"
            rows={3}
            value={form.synopsis}
            onChange={(e) => set('synopsis', e.target.value)}
            className={`${INPUT_CLASS} resize-y min-h-[70px]`}
            placeholder="Descripcion breve"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="vid-featured"
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0d0d0d] accent-red-600"
          />
          <label htmlFor="vid-featured" className="text-sm text-[#f5f5f5]">Video destacado</label>
        </div>

        {/* Collection */}
        <div>
          <label htmlFor="vid-collection" className={LABEL_CLASS}>Coleccion (opcional)</label>
          <select
            id="vid-collection"
            value={form.collectionId}
            onChange={(e) => set('collectionId', e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">— Sin coleccion —</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>{col.title}</option>
            ))}
          </select>
        </div>

        {/* YouTube URL */}
        <div>
          <label htmlFor="vid-youtube" className={LABEL_CLASS}>URL de YouTube</label>
          <input
            id="vid-youtube"
            type="text"
            value={form.youtubeUrl}
            onChange={(e) => set('youtubeUrl', e.target.value)}
            className={INPUT_CLASS}
            placeholder="https://www.youtube.com/watch?v=... o solo el ID"
          />
          {form.youtubeUrl && !extractedYouTubeId && (
            <p className="mt-1.5 text-xs text-yellow-400">
              No se reconoce un ID de YouTube valido. El video se guardara sin reproductor.
            </p>
          )}
          {extractedYouTubeId && (
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={handleAutoFillThumbnail}
                className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#a3a3a3] hover:border-red-600/50 hover:text-white transition-all"
              >
                Usar miniatura de YouTube
              </button>
              <iframe
                width="100%"
                className="aspect-video rounded-lg mt-2"
                src={youtubeEmbedUrl(extractedYouTubeId)}
                title="Preview"
                allow={YOUTUBE_IFRAME_ALLOW}
                referrerPolicy={YOUTUBE_IFRAME_REFERRER_POLICY}
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Download link */}
        <div>
          <label htmlFor="vid-download" className={LABEL_CLASS}>Enlace de descarga (opcional)</label>
          <input
            id="vid-download"
            type="url"
            value={form.downloadLink}
            onChange={(e) => set('downloadLink', e.target.value)}
            className={INPUT_CLASS}
            placeholder="https://drive.google.com/..."
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label htmlFor="vid-thumb" className={LABEL_CLASS}>Miniatura</label>
          <div className="flex items-center gap-3">
            <input
              id="vid-thumb"
              type="text"
              value={form.thumbnail}
              onChange={(e) => set('thumbnail', e.target.value)}
              className={`${INPUT_CLASS} flex-1`}
              placeholder="nombre-imagen.jpg o URL completa"
            />
            <FileUploadButton
              type="thumbnail"
              label="Subir imagen"
              onUploaded={(filename) => set('thumbnail', filename)}
            />
          </div>
          {form.thumbnail && (
            <img
              src={getThumbnailUrl(form.thumbnail)}
              alt="Vista previa"
              className="mt-2 h-20 rounded-lg object-cover"
            />
          )}
        </div>

        <div>
          <label htmlFor="vid-duration" className={LABEL_CLASS}>Duracion (segundos)</label>
          <input
            id="vid-duration"
            type="number"
            min={0}
            value={form.duration}
            onChange={(e) => set('duration', e.target.value)}
            className={INPUT_CLASS}
            placeholder="5400"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-red-600 to-yellow-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <Link
            to="/admin/videos"
            className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
