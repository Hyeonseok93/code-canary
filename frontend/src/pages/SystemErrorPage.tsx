import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import StatusPageLayout from '../components/common/StatusPageLayout';
import { useUIStore } from '../store/useUIStore';
import error500 from '../assets/500.png';

const SystemErrorPage = () => {
  const setSystemError = useUIStore((state) => state.setSystemError);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRetry = async () => {
    setSystemError(false);
    await queryClient.invalidateQueries();
    navigate(location.pathname, { replace: true });
  };

  return (
    <StatusPageLayout
      imageSrc={error500}
      imageAlt="Service unavailable"
      title="Service Temporarily Unavailable"
      actionLabel="Retry Connection"
      onAction={() => void handleRetry()}
      actionClassName="px-8 py-2.5 text-xs font-black uppercase tracking-wider text-red-400 border-neutral-800 hover:border-red-900/40 hover:bg-red-950/10 hover:text-red-300 transition-all"
    />
  );
};

export default SystemErrorPage;
