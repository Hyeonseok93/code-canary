import { useNavigate } from 'react-router-dom';
import StatusPageLayout from '../components/common/StatusPageLayout';
import error404 from '../assets/404.png';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <StatusPageLayout
      imageSrc={error404}
      imageAlt="404 Error"
      title="Page Not Found"
      actionLabel="Go to Dashboard"
      onAction={() => navigate('/')}
    />
  );
};

export default NotFoundPage;
