import { useAdminLogout } from './useAdminLogout';
import { useAdminSession } from './useAdminSession';

export const useAdminPageShell = () => {
  const { data: session } = useAdminSession();
  const onLogout = useAdminLogout();

  return {
    username: session?.username ?? 'operator',
    onLogout,
  };
};
