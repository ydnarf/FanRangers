import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetCollections, adminDeleteCollection } from '../../lib/api';
import type { Collection } from '../../types';

export default function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    adminGetCollections()
      .then(setCollections)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error al cargar colecciones')
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(col: Collection) {
    if (!window.confirm(`¿Eliminar "${col.title}"? Esta accion no se puede deshacer.`)) return;
    try {
      await adminDeleteCollection(col.id);
      setCollections((prev) => prev.filter((c) => c.id !== col.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Colecciones</h1>
        <Link
          to="/admin/collections/new"
          className="bg-gradient-to-r from-red-600 to-yellow-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:from-red-500 hover:to-yellow-400 transition-all duration-200"
        >
          + Nueva Coleccion
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
      ) : collections.length === 0 ? (
        <p className="text-sm text-[#a3a3a3] py-8 text-center">
          No hay colecciones todavia.{' '}
          <Link to="/admin/collections/new" className="text-red-400 hover:text-red-300">
            Crear la primera
          </Link>
        </p>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-sm" aria-label="Lista de colecciones">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium">Titulo</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden md:table-cell">Destacada</th>
                <th className="text-left px-4 py-3 text-[#a3a3a3] font-medium hidden md:table-cell">Temporadas</th>
                <th className="text-right px-4 py-3 text-[#a3a3a3] font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col, idx) => (
                <tr
                  key={col.id}
                  className={`border-b border-[#2a2a2a] last:border-0 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-[#161616]'} hover:bg-[#222]`}
                >
                  <td className="px-4 py-3 text-[#f5f5f5] font-medium">
                    {col.title}
                  </td>
                  <td className="px-4 py-3 text-[#a3a3a3] hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${col.type === 'SERIES' ? 'border-blue-500/30 text-blue-400' : 'border-purple-500/30 text-purple-400'}`}>
                      {col.type === 'SERIES' ? 'Serie' : 'Pelicula'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {col.featured ? (
                      <span className="text-yellow-400 text-xs">&#9733; Si</span>
                    ) : (
                      <span className="text-[#a3a3a3] text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#a3a3a3] hidden md:table-cell">
                    {col._count?.seasons ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/collections/${col.id}`}
                        className="text-xs px-3 py-1.5 rounded-md border border-[#2a2a2a] text-[#a3a3a3] hover:border-red-600/50 hover:text-white transition-all"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(col)}
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
