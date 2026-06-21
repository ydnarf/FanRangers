import { useEffect, useState } from 'react';
import { adminGetUsers, adminUpdateUserRole } from '../../lib/api';
import type { AdminUser } from '../../types';

type RoleFilter = 'ALL' | 'FREE' | 'PREMIUM' | 'ADMIN';

interface RowError {
  id: string;
  message: string;
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  const styles: Record<AdminUser['role'], string> = {
    FREE: 'bg-[#2a2a2a] text-[#a3a3a3]',
    PREMIUM: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
    ADMIN: 'bg-red-500/15 text-red-400 border border-red-500/30',
  };
  const labels: Record<AdminUser['role'], string> = {
    FREE: 'Gratis',
    PREMIUM: 'Premium',
    ADMIN: 'Admin',
  };
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${styles[role]}`}
    >
      {labels[role]}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#2a2a2a]">
      {[1, 2, 3, 4].map((n) => (
        <td key={n} className="px-4 py-3">
          <div className="h-4 bg-[#2a2a2a] rounded animate-pulse" style={{ width: `${60 + n * 10}%` }} />
        </td>
      ))}
    </tr>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<RoleFilter>('ALL');

  useEffect(() => {
    setLoading(true);
    adminGetUsers()
      .then(setUsers)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
      )
      .finally(() => setLoading(false));
  }, []);

  function setRowError(id: string, message: string) {
    setRowErrors((prev) => [...prev.filter((e) => e.id !== id), { id, message }]);
  }

  function clearRowError(id: string) {
    setRowErrors((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleRoleChange(user: AdminUser, newRole: 'FREE' | 'PREMIUM') {
    clearRowError(user.id);
    setPendingIds((prev) => new Set(prev).add(user.id));

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
    );

    try {
      await adminUpdateUserRole(user.id, newRole);
    } catch (err) {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: user.role } : u))
      );
      setRowError(
        user.id,
        err instanceof Error ? err.message : 'Error al actualizar el rol'
      );
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  }

  const filteredUsers =
    filter === 'ALL' ? users : users.filter((u) => u.role === filter);

  const filterOptions: { value: RoleFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'FREE', label: 'Gratis' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-[#f5f5f5]">Usuarios</h1>
        {!loading && !error && (
          <p className="text-sm text-[#a3a3a3]">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filter tabs */}
      {!loading && !error && (
        <div className="flex gap-1 mb-4" role="tablist" aria-label="Filtrar por rol">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150 ${
                filter === opt.value
                  ? 'bg-gradient-to-r from-red-600/20 to-yellow-500/10 text-white border border-red-600/30'
                  : 'text-[#a3a3a3] hover:text-white hover:bg-[#252525]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                  Fecha registro
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#a3a3a3] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3, 4, 5].map((n) => <SkeletonRow key={n} />)
                : filteredUsers.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#a3a3a3] text-sm">
                      No hay usuarios con este filtro.
                    </td>
                  </tr>
                )
                : filteredUsers.map((user) => {
                    const isPending = pendingIds.has(user.id);
                    const rowError = rowErrors.find((e) => e.id === user.id);
                    const initials = (user.name ?? user.email).charAt(0).toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#252525]/50 transition-colors"
                      >
                        {/* Usuario */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-[#a3a3a3] flex-shrink-0"
                              aria-hidden="true"
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              {user.name && (
                                <p className="text-[#f5f5f5] font-medium truncate">{user.name}</p>
                              )}
                              <p className="text-[#a3a3a3] text-xs truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3 text-[#a3a3a3] font-mono text-xs whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {user.role === 'FREE' && (
                              <button
                                onClick={() => handleRoleChange(user, 'PREMIUM')}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Hacer Premium a ${user.email}`}
                              >
                                {isPending ? (
                                  <span
                                    className="w-3 h-3 border border-yellow-400/50 border-t-yellow-400 rounded-full animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                Hacer Premium
                              </button>
                            )}
                            {user.role === 'PREMIUM' && (
                              <button
                                onClick={() => handleRoleChange(user, 'FREE')}
                                disabled={isPending}
                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-[#2a2a2a] text-[#a3a3a3] hover:bg-[#333333] hover:text-[#f5f5f5] border border-[#3a3a3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Revocar Premium a ${user.email}`}
                              >
                                {isPending ? (
                                  <span
                                    className="w-3 h-3 border border-[#a3a3a3]/50 border-t-[#a3a3a3] rounded-full animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : null}
                                Revocar Premium
                              </button>
                            )}
                            {user.role === 'ADMIN' && (
                              <span className="text-xs text-[#a3a3a3] italic">Sin acciones</span>
                            )}
                            {rowError && (
                              <p className="text-xs text-red-400 mt-0.5" role="alert">
                                {rowError.message}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
