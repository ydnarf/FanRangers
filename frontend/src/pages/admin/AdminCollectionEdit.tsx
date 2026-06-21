import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  adminGetCollections,
  adminCreateCollection,
  adminUpdateCollection,
  adminGetSeasons,
  adminCreateSeason,
  adminDeleteSeason,
  getThumbnailUrl,
} from '../../lib/api';
import type { Collection, Season } from '../../types';
import FileUploadButton from '../../components/FileUploadButton';

const INPUT_CLASS =
  'w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#f5f5f5] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600/50 transition-colors';
const LABEL_CLASS = 'block text-sm font-medium text-[#f5f5f5] mb-1.5';

interface FormData {
  title: string;
  description: string;
  type: 'SERIES' | 'FILMS';
  featured: boolean;
  coverImage: string;
  heroImage: string;
}

interface SeasonForm {
  number: string;
  title: string;
  description: string;
}

export default function AdminCollectionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    type: 'SERIES',
    featured: false,
    coverImage: '',
    heroImage: '',
  });
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonForm, setSeasonForm] = useState<SeasonForm>({ number: '', title: '', description: '' });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingSeasonError, setAddingSeasonError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    adminGetCollections()
      .then((cols) => {
        const col = cols.find((c) => c.id === id);
        if (!col) { setError('Coleccion no encontrada'); return; }
        setForm({
          title: col.title,
          description: col.description,
          type: col.type,
          featured: col.featured,
          coverImage: col.coverImage ?? '',
          heroImage: col.heroImage ?? '',
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false));

    adminGetSeasons(id!)
      .then(setSeasons)
      .catch(() => {});
  }, [id, isNew]);

  function set(field: keyof FormData, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Partial<Collection> = {
        title: form.title,
        description: form.description,
        type: form.type,
        featured: form.featured,
        coverImage: form.coverImage || null,
        heroImage: form.heroImage || null,
      };
      if (isNew) {
        const created = await adminCreateCollection(payload);
        navigate(`/admin/collections/${created.id}`, { replace: true });
      } else {
        await adminUpdateCollection(id!, payload);
        navigate('/admin/collections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSeason(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddingSeasonError(null);
    const num = parseInt(seasonForm.number, 10);
    if (isNaN(num) || num < 1) { setAddingSeasonError('Numero de temporada invalido'); return; }
    try {
      const created = await adminCreateSeason({
        collectionId: id!,
        number: num,
        title: seasonForm.title || undefined,
        description: seasonForm.description || undefined,
      });
      setSeasons((prev) => [...prev, created].sort((a, b) => a.number - b.number));
      setSeasonForm({ number: '', title: '', description: '' });
    } catch (err) {
      setAddingSeasonError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleDeleteSeason(season: Season) {
    if (!window.confirm(`¿Eliminar Temporada ${season.number}? Se eliminaran todos sus episodios.`)) return;
    try {
      await adminDeleteSeason(season.id);
      setSeasons((prev) => prev.filter((s) => s.id !== season.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => <div key={n} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#a3a3a3] mb-6" aria-label="Ruta">
        <Link to="/admin/collections" className="hover:text-white transition-colors">Colecciones</Link>
        <span aria-hidden="true">&rsaquo;</span>
        <span className="text-[#f5f5f5]">{isNew ? 'Nueva Coleccion' : form.title || 'Editar'}</span>
      </nav>

      <h1 className="text-xl font-bold text-[#f5f5f5] mb-6">
        {isNew ? 'Nueva Coleccion' : 'Editar Coleccion'}
      </h1>

      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-600/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-4 mb-8">
        <div>
          <label htmlFor="col-title" className={LABEL_CLASS}>
            Titulo <span className="text-red-500">*</span>
          </label>
          <input
            id="col-title"
            type="text"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={INPUT_CLASS}
            placeholder="Nombre de la coleccion"
          />
        </div>

        <div>
          <label htmlFor="col-desc" className={LABEL_CLASS}>
            Descripcion <span className="text-red-500">*</span>
          </label>
          <textarea
            id="col-desc"
            required
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className={`${INPUT_CLASS} resize-y min-h-[80px]`}
            placeholder="Descripcion de la coleccion"
          />
        </div>

        <div>
          <label htmlFor="col-type" className={LABEL_CLASS}>
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            id="col-type"
            value={form.type}
            onChange={(e) => set('type', e.target.value as 'SERIES' | 'FILMS')}
            className={INPUT_CLASS}
          >
            <option value="SERIES">Serie</option>
            <option value="FILMS">Pelicula / Corto</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="col-featured"
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="w-4 h-4 rounded border-[#2a2a2a] bg-[#0d0d0d] accent-red-600"
          />
          <label htmlFor="col-featured" className="text-sm text-[#f5f5f5]">
            Coleccion destacada
          </label>
        </div>

        {/* Cover image */}
        <div>
          <label htmlFor="col-cover" className={LABEL_CLASS}>Imagen de portada</label>
          <div className="flex items-center gap-3">
            <input
              id="col-cover"
              type="text"
              value={form.coverImage}
              onChange={(e) => set('coverImage', e.target.value)}
              className={`${INPUT_CLASS} flex-1`}
              placeholder="nombre-archivo.jpg"
            />
            <FileUploadButton
              type="thumbnail"
              label="Subir imagen"
              onUploaded={(filename) => set('coverImage', filename)}
            />
          </div>
          {form.coverImage && (
            <img
              src={getThumbnailUrl(form.coverImage)}
              alt="Vista previa portada"
              className="mt-2 h-20 rounded-lg object-cover"
            />
          )}
        </div>

        {/* Hero image */}
        <div>
          <label htmlFor="col-hero" className={LABEL_CLASS}>Imagen hero</label>
          <div className="flex items-center gap-3">
            <input
              id="col-hero"
              type="text"
              value={form.heroImage}
              onChange={(e) => set('heroImage', e.target.value)}
              className={`${INPUT_CLASS} flex-1`}
              placeholder="nombre-hero.jpg"
            />
            <FileUploadButton
              type="thumbnail"
              label="Subir imagen"
              onUploaded={(filename) => set('heroImage', filename)}
            />
          </div>
          {form.heroImage && (
            <img
              src={getThumbnailUrl(form.heroImage)}
              alt="Vista previa hero"
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
            to="/admin/collections"
            className="text-sm text-[#a3a3a3] hover:text-white transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Seasons section — only when editing */}
      {!isNew && (
        <div>
          <h2 className="text-lg font-bold text-[#f5f5f5] mb-4">Temporadas</h2>

          {seasons.length === 0 ? (
            <p className="text-sm text-[#a3a3a3] mb-4">Sin temporadas todavia.</p>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden mb-6">
              <table className="w-full text-sm" aria-label="Lista de temporadas">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">#</th>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">Titulo</th>
                    <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden sm:table-cell">Episodios</th>
                    <th className="text-right px-4 py-3 text-[#a3a3a3] font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {seasons.map((season, idx) => (
                    <tr
                      key={season.id}
                      className={`border-b border-[#2a2a2a] last:border-0 ${idx % 2 === 0 ? '' : 'bg-[#161616]'} hover:bg-[#222]`}
                    >
                      <td className="px-4 py-3 text-[#f5f5f5] font-medium">T{season.number}</td>
                      <td className="px-4 py-3 text-[#a3a3a3]">{season.title ?? `Temporada ${season.number}`}</td>
                      <td className="px-4 py-3 text-[#a3a3a3] hidden sm:table-cell">
                        {season._count?.episodes ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/collections/${id}/seasons/${season.id}/episodes`}
                            className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#a3a3a3] hover:border-red-600/50 hover:text-white transition-all"
                          >
                            Ver episodios
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteSeason(season)}
                            className="text-xs px-3 py-1.5 rounded-md border border-red-600/30 text-red-400 hover:bg-red-900/30 transition-all"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add season form */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">Anadir temporada</h3>
            {addingSeasonError && (
              <p role="alert" className="text-xs text-red-400 mb-2">{addingSeasonError}</p>
            )}
            <form onSubmit={handleAddSeason} className="flex flex-wrap gap-3 items-end">
              <div className="w-20">
                <label htmlFor="season-num" className="block text-xs text-[#a3a3a3] mb-1">
                  Numero <span className="text-red-500">*</span>
                </label>
                <input
                  id="season-num"
                  type="number"
                  min={1}
                  required
                  value={seasonForm.number}
                  onChange={(e) => setSeasonForm((p) => ({ ...p, number: e.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="1"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label htmlFor="season-title" className="block text-xs text-[#a3a3a3] mb-1">Titulo</label>
                <input
                  id="season-title"
                  type="text"
                  value={seasonForm.title}
                  onChange={(e) => setSeasonForm((p) => ({ ...p, title: e.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="Titulo opcional"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label htmlFor="season-desc" className="block text-xs text-[#a3a3a3] mb-1">Descripcion</label>
                <input
                  id="season-desc"
                  type="text"
                  value={seasonForm.description}
                  onChange={(e) => setSeasonForm((p) => ({ ...p, description: e.target.value }))}
                  className={INPUT_CLASS}
                  placeholder="Descripcion opcional"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-yellow-500 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all"
              >
                Agregar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
