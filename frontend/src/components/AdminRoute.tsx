import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticatedAdmin } from '../constants/adminRoles';
import { useAdminSession } from '../hooks/useAdminSession';
import { ROOST_HATCH } from '../constants/roostPaths';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { data, isLoading } = useAdminSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-neutral-500 text-sm font-medium">
        Verifying operator session...
      </div>
    );
  }

  if (!isAuthenticatedAdmin(data)) {
    return <Navigate to={ROOST_HATCH} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
