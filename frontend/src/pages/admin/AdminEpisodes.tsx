import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminGetEpisodes, adminDeleteEpisode, adminGetCollections, adminGetSeasons, getThumbnailUrl } from '../../lib/api';
import type { Episode, Collection, Season } from '../../types';

export default function AdminEpisodes() {
  const { collectionId, seasonId } = useParams<{ collectionId: string; seasonId: string }>();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seasonId || !collectionId) return;

    Promise.all([
      adminGetEpisodes(seasonId),
      adminGetCollections().then((cols) => cols.find((c) => c.id === collectionId) ?? null),
      adminGetSeasons(collectionId).then((ss) => ss.find((s) => s.id === seasonId) ?? null),
    ])
      .then(([eps, col, sea]) => {
        setEpisodes(eps.sort((a, b) => a.number - b.number));
        setCollection(col);
        setSeason(sea);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error al cargar episodios')
      )
      .finally(() => setLoading(false));
  }, [seasonId, collectionId]);

  async function handleDelete(ep: Episode) {
    if (!window.confirm(`¿Eliminar "${ep.title}"?`)) return;
    try {
      await adminDeleteEpisode(ep.id);
      setEpisodes((prev) => prev.filter((e) => e.id !== ep.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#a3a3a3] mb-6 flex-wrap" aria-label="Ruta">
        <Link to="/admin/collections" className="hover:text-white transition-colors">Colecciones</Link>
        <span aria-hidden="true">&rsaquo;</span>
        {collection && (
          <>
            <Link to={`/admin/collections/${collectionId}`} className="hover:text-white transition-colors">
              {collection.title}
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
          </>
        )}
        <span className="text-[#f5f5f5]">
          {season ? `Temporada ${season.number}` : 'Temporada'}
        </span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#f5f5f5]">
          Episodios
          {season && <span className="text-[#a3a3a3] font-normal text-base ml-2">— T{season.number}</span>}
        </h1>
        <Link
          to={`/admin/collections/${collectionId}/seasons/${seasonId}/episodes/new`}
          className="bg-gradient-to-r from-red-600 to-yellow-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all"
        >
          + Nuevo episodio
        </Link>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-600/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => <div key={n} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />)}
        </div>
      ) : episodes.length === 0 ? (
        <p className="text-sm text-[#a3a3a3] py-8 text-center">
          Sin episodios todavia.{' '}
          <Link
            to={`/admin/collections/${collectionId}/seasons/${seasonId}/episodes/new`}
            className="text-red-400 hover:text-red-300"
          >
            Agregar el primero
          </Link>
        </p>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm" aria-label="Lista de episodios">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">#</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">Titulo</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden sm:table-cell">Miniatura</th>
                <th className="text-right px-4 py-3 text-[#a3a3a3] font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep, idx) => (
                <tr
                  key={ep.id}
                  className={`border-b border-[#2a2a2a] last:border-0 ${idx % 2 === 0 ? '' : 'bg-[#161616]'} hover:bg-[#222]`}
                >
                  <td className="px-4 py-3 text-[#f5f5f5] font-medium">{ep.number}</td>
                  <td className="px-4 py-3 text-[#f5f5f5]">{ep.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {ep.thumbnail ? (
                      <img
                        src={getThumbnailUrl(ep.thumbnail)}
                        alt={ep.title}
                        className="w-14 h-9 object-cover rounded"
                      />
                    ) : (
                      <span className="text-[#a3a3a3] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/collections/${collectionId}/seasons/${seasonId}/episodes/${ep.id}`}
                        className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#a3a3a3] hover:border-red-600/50 hover:text-white transition-all"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(ep)}
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
    </div>
  );
}
