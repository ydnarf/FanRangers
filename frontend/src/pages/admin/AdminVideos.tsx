import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetVideos, adminDeleteVideo, getThumbnailUrl } from '../../lib/api';
import type { Video } from '../../types';

export default function AdminVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    adminGetVideos()
      .then(setVideos)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error al cargar videos')
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(video: Video) {
    if (!window.confirm(`¿Eliminar "${video.title}"? Esta accion no se puede deshacer.`)) return;
    try {
      await adminDeleteVideo(video.id);
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Videos</h1>
        <Link
          to="/admin/videos/new"
          className="bg-gradient-to-r from-red-600 to-yellow-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all"
        >
          + Nuevo Video
        </Link>
      </div>

      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-600/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-12 bg-[#1a1a1a] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p className="text-sm text-[#a3a3a3] py-8 text-center">
          No hay videos todavia.{' '}
          <Link to="/admin/videos/new" className="text-red-400 hover:text-red-300">
            Subir el primero
          </Link>
        </p>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm" aria-label="Lista de videos">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden sm:table-cell">Miniatura</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">Titulo</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden md:table-cell">Coleccion</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden md:table-cell">Destacado</th>
                <th className="text-right px-4 py-3 text-[#a3a3a3] font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video, idx) => (
                <tr
                  key={video.id}
                  className={`border-b border-[#2a2a2a] last:border-0 ${idx % 2 === 0 ? '' : 'bg-[#161616]'} hover:bg-[#222]`}
                >
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {video.thumbnail ? (
                      <img
                        src={getThumbnailUrl(video.thumbnail)}
                        alt={video.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-[#2a2a2a] rounded flex items-center justify-center">
                        <span className="text-[#a3a3a3] text-xs">—</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#f5f5f5] font-medium">{video.title}</td>
                  <td className="px-4 py-3 text-[#a3a3a3] hidden md:table-cell text-xs">
                    {video.collection?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {video.featured ? (
                      <span className="text-yellow-400 text-xs">&#9733; Si</span>
                    ) : (
                      <span className="text-[#a3a3a3] text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/videos/${video.id}`}
                        className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#a3a3a3] hover:border-red-600/50 hover:text-white transition-all"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(video)}
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
