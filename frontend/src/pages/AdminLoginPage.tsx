import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../components/common/Button';
import adminApiClient from '../api/adminApiClient';
import { clearCsrfTokenCache, resolveCsrfToken } from '../api/csrf';
import { isAdminRole, isAuthenticatedAdmin } from '../constants/adminRoles';
import { EMPTY_ADMIN_SESSION } from '../constants/adminSession';
import { resolveLoginError } from '../utils/loginErrors';
import { ADMIN_SESSION_QUERY_KEY, useAdminSession } from '../hooks/useAdminSession';
import { useAdminNoIndex } from '../hooks/useAdminNoIndex';
import { ROOST_BASE } from '../constants/roostPaths';
import type { AdminProfile, AdminSession } from '../types/explorer';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isLoading: isSessionLoading } = useAdminSession();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useAdminNoIndex();

  useEffect(() => {
    void resolveCsrfToken();
  }, []);

  useEffect(() => {
    if (isAuthenticatedAdmin(session)) {
      navigate(ROOST_BASE, { replace: true });
    }
  }, [navigate, session]);

  if (isSessionLoading) {
    return null;
  }

  const clearServerSession = async () => {
    try {
      await adminApiClient.post('/api/admin/logout');
    } catch {
      // Best-effort cleanup after rejected login.
    } finally {
      clearCsrfTokenCache();
      queryClient.setQueryData(ADMIN_SESSION_QUERY_KEY, EMPTY_ADMIN_SESSION);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      return;
    }

    setIsSubmitting(true);

    try {
      await resolveCsrfToken();
      const { data } = await adminApiClient.post<AdminProfile>('/api/auth/login', { username, password });
      if (!isAdminRole(data.role)) {
        await clearServerSession();
        setError('Access denied.');
        return;
      }

      const nextSession: AdminSession = {
        authenticated: true,
        username: data.username,
        role: data.role,
      };
      queryClient.setQueryData(ADMIN_SESSION_QUERY_KEY, nextSession);
      navigate(ROOST_BASE, { replace: true });
    } catch (err) {
      setError(resolveLoginError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 sm:px-8 py-16">
      <div className="relative w-full max-w-md animate-reveal">
        <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] overflow-hidden">
          <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500"
              >
                ID
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-neutral-800/80 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-800/80 bg-black/40 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center">
                <p className="text-[11px] font-black uppercase tracking-wider text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-xs font-black uppercase tracking-[0.15em]"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entering...' : 'Enter'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
