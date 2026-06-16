import { BrowserRouter as Router, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotFoundPage from './pages/NotFoundPage';
import SystemErrorPage from './pages/SystemErrorPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminRoute from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import RouteLoadingFallback from './components/common/RouteLoadingFallback';
import { ROOST_BASE, ROOST_FORAGE, ROOST_HATCH } from './constants/roostPaths';
import { useUIStore } from './store/useUIStore';
import { isValidVulnerabilityId } from './utils/vulnerabilityId';

const HomePage = lazy(() => import('./pages/HomePage'));
const ExplorerPage = lazy(() => import('./pages/ExplorerPage'));
const ExplorerDetailPage = lazy(() => import('./pages/ExplorerDetailPage'));
const AdminHomePage = lazy(() => import('./pages/AdminHomePage'));
const AdminJobMonitorPage = lazy(() => import('./pages/AdminJobMonitorPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function VulnerabilityRouteGuard() {
  const { vulnId } = useParams<{ vulnId: string }>();

  if (!vulnId || !isValidVulnerabilityId(vulnId)) {
    return <NotFoundPage />;
  }

  return <ExplorerDetailPage />;
}

function withSystemErrorGuard<P extends object>(Page: ComponentType<P>) {
  return function GuardedPage(props: P) {
    const isSystemError = useUIStore((state) => state.isSystemError);
    if (isSystemError) return <SystemErrorPage />;
    return <Page {...props} />;
  };
}

const PublicHomePage = withSystemErrorGuard(HomePage);
const PublicExplorerPage = withSystemErrorGuard(ExplorerPage);
const PublicExplorerDetailPage = withSystemErrorGuard(VulnerabilityRouteGuard);

function AppContent() {
  const location = useLocation();
  const isSystemError = useUIStore((state) => state.isSystemError);
  const setSystemError = useUIStore((state) => state.setSystemError);

  useEffect(() => {
    setSystemError(false);
  }, [location.pathname, setSystemError]);

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path={ROOST_HATCH} element={<AdminLoginPage />} />
        <Route
          path={ROOST_FORAGE}
          element={
            <AdminRoute>{isSystemError ? <SystemErrorPage /> : <AdminJobMonitorPage />}</AdminRoute>
          }
        />
        <Route
          path={ROOST_BASE}
          element={
            <AdminRoute>{isSystemError ? <SystemErrorPage /> : <AdminHomePage />}</AdminRoute>
          }
        />
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/explorer" element={<PublicExplorerPage />} />
        <Route path="/explorer/:vulnId" element={<PublicExplorerDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
