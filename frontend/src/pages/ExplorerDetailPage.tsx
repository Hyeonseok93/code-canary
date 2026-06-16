import { useParams } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useVulnerabilityDetail } from '../hooks/useVulnerabilityDetail';
import VulnerabilityDetailBody from '../components/explorer/VulnerabilityDetailBody';
import NotFoundPage from './NotFoundPage';
import { getAxiosStatus } from '../api/errors';
import { getSeverityTheme } from '../utils/severity';

const ExplorerDetailPage = () => {
  const { vulnId } = useParams<{ vulnId: string }>();
  const { data, isLoading, isError, error } = useVulnerabilityDetail(vulnId);
  const httpStatus = getAxiosStatus(error);
  const severityTheme = data ? getSeverityTheme(data.baseScore) : null;

  if (!isLoading && isError && (httpStatus === 404 || httpStatus === 400)) {
    return <NotFoundPage />;
  }

  return (
    <MainLayout>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-24 space-y-12 relative z-10">
        <VulnerabilityDetailBody
          vulnId={vulnId}
          data={data}
          isLoading={isLoading}
          isError={isError}
          httpStatus={httpStatus}
          severityTheme={severityTheme}
        />
      </div>
    </MainLayout>
  );
};

export default ExplorerDetailPage;
