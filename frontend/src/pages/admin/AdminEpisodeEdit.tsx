import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetEpisodes,
  adminCreateEpisode,
  adminUpdateEpisode,
  getThumbnailUrl,
} from '../../lib/api';
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

interface EpisodeForm {
  number: string;
  title: string;
  synopsis: string;
  thumbnail: string;
  duration: string;
  youtubeUrl: string;
  downloadLink: string;
}

export default function AdminEpisodeEdit() {
  const { collectionId, seasonId, id } = useParams<{
    collectionId: string;
    seasonId: string;
    id: string;
  }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState<EpisodeForm>({
    number: '',
    title: '',
    synopsis: '',
    thumbnail: '',
    duration: '',
    youtubeUrl: '',
    downloadLink: '',
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    adminGetEpisodes(seasonId!)
      .then((eps) => {
        const ep = eps.find((e) => e.id === id);
        if (!ep) { setError('Episodio no encontrado'); return; }
        setForm({
          number: String(ep.number),
          title: ep.title,
          synopsis: ep.synopsis ?? '',
          thumbnail: ep.thumbnail ?? '',
          duration: ep.duration != null ? String(ep.duration) : '',
          youtubeUrl: ep.youtubeId ?? '',
          downloadLink: ep.downloadLink ?? '',
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));
  }, [id, isNew, seasonId]);

  function set(field: keyof EpisodeForm, value: string) {
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
        seasonId: seasonId!,
        number: parseInt(form.number, 10),
        title: form.title,
        synopsis: form.synopsis || undefined,
        thumbnail: form.thumbnail || undefined,
        duration: form.duration ? parseInt(form.duration, 10) : undefined,
        youtubeId,
        downloadLink: form.downloadLink || null,
      };
      if (isNew) {
        await adminCreateEpisode(payload);
      } else {
        await adminUpdateEpisode(id!, payload);
      }
      navigate(`/admin/collections/${collectionId}/seasons/${seasonId}/episodes`);
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
      <nav className="flex items-center gap-2 text-sm text-[#a3a3a3] mb-6 flex-wrap" aria-label="Ruta">
        <Link to="/admin/collections" className="hover:text-white transition-colors">Colecciones</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link to={`/admin/collections/${collectionId}`} className="hover:text-white transition-colors">Coleccion</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <Link to={`/admin/collections/${collectionId}/seasons/${seasonId}/episodes`} className="hover:text-white transition-colors">
          Episodios
        </Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="text-[#f5f5f5]">{isNew ? 'Nuevo' : 'Editar'}</span>
      </nav>

      <h1 className="text-xl font-bold text-[#f5f5f5] mb-6">
        {isNew ? 'Nuevo Episodio' : 'Editar Episodio'}
      </h1>

      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-600/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ep-number" className={LABEL_CLASS}>
              Numero <span className="text-red-500">*</span>
            </label>
            <input
              id="ep-number"
              type="number"
              min={1}
              required
              value={form.number}
              onChange={(e) => set('number', e.target.value)}
              className={INPUT_CLASS}
              placeholder="1"
            />
          </div>
          <div>
            <label htmlFor="ep-duration" className={LABEL_CLASS}>Duracion (segundos)</label>
            <input
              id="ep-duration"
              type="number"
              min={0}
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              className={INPUT_CLASS}
              placeholder="1440"
            />
          </div>
        </div>

        <div>
          <label htmlFor="ep-title" className={LABEL_CLASS}>
            Titulo <span className="text-red-500">*</span>
          </label>
          <input
            id="ep-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={INPUT_CLASS}
            placeholder="Titulo del episodio"
          />
        </div>

        <div>
          <label htmlFor="ep-synopsis" className={LABEL_CLASS}>Sinopsis</label>
          <textarea
            id="ep-synopsis"
            rows={3}
            value={form.synopsis}
            onChange={(e) => set('synopsis', e.target.value)}
            className={`${INPUT_CLASS} resize-y min-h-[70px]`}
            placeholder="Descripcion breve del episodio"
          />
        </div>

        {/* YouTube URL */}
        <div>
          <label htmlFor="ep-youtube" className={LABEL_CLASS}>URL de YouTube</label>
          <input
            id="ep-youtube"
            type="text"
            value={form.youtubeUrl}
            onChange={(e) => set('youtubeUrl', e.target.value)}
            className={INPUT_CLASS}
            placeholder="https://www.youtube.com/watch?v=... o solo el ID"
          />
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
          <label htmlFor="ep-download" className={LABEL_CLASS}>Enlace de descarga (opcional)</label>
          <input
            id="ep-download"
            type="url"
            value={form.downloadLink}
            onChange={(e) => set('downloadLink', e.target.value)}
            className={INPUT_CLASS}
            placeholder="https://drive.google.com/..."
          />
        </div>

        {/* Thumbnail */}
        <div>
          <label htmlFor="ep-thumb" className={LABEL_CLASS}>Miniatura</label>
          <div className="flex items-center gap-3">
            <input
              id="ep-thumb"
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-red-600 to-yellow-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <Link
            to={`/admin/collections/${collectionId}/seasons/${seasonId}/episodes`}
            className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
