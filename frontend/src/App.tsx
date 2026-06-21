import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import KoFiWidget from './components/KoFiWidget';
import { SkeletonHero, SkeletonRow } from './components/SkeletonCard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#07080F] flex flex-col items-center justify-center text-center px-4">
          <span className="text-5xl mb-4" aria-hidden="true">&#9888;</span>
          <h1 className="text-xl font-semibold text-[#E8DAC0] mb-2">Algo salió mal</h1>
          <p className="text-[#8085A0] text-sm mb-4 max-w-md font-mono">
            {this.state.error.message}
          </p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="bg-[#E8430A] hover:bg-[#FF5020] text-white font-medium px-6 py-2.5 rounded transition-colors"
          >
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy-loaded public pages
const HomePage = lazy(() => import('./pages/HomePage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const SeasonPage = lazy(() => import('./pages/SeasonPage'));
const CatalogPage = lazy(() => import('./pages/CatalogPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));

// PlayerPage needs special handling because it accepts a prop
const EpisodePlayerPage = lazy(() =>
  import('./pages/PlayerPage').then((m) => ({
    default: () => <m.default type="episode" />,
  }))
);
const VideoPlayerPage = lazy(() =>
  import('./pages/PlayerPage').then((m) => ({
    default: () => <m.default type="video" />,
  }))
);

// Admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCollections = lazy(() => import('./pages/admin/AdminCollections'));
const AdminCollectionEdit = lazy(() => import('./pages/admin/AdminCollectionEdit'));
const AdminEpisodes = lazy(() => import('./pages/admin/AdminEpisodes'));
const AdminEpisodeEdit = lazy(() => import('./pages/admin/AdminEpisodeEdit'));
const AdminVideos = lazy(() => import('./pages/admin/AdminVideos'));
const AdminVideoEdit = lazy(() => import('./pages/admin/AdminVideoEdit'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));

function PageLoader() {
  return (
    <div className="min-h-screen">
      <SkeletonHero />
      <div className="py-6">
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Admin routes — no main Navbar/Footer */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Suspense fallback={<PageLoader />}>
                  <AdminLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="collections"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCollections />
                </Suspense>
              }
            />
            <Route
              path="collections/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCollectionEdit />
                </Suspense>
              }
            />
            <Route
              path="collections/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminCollectionEdit />
                </Suspense>
              }
            />
            <Route
              path="collections/:collectionId/seasons/:seasonId/episodes"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminEpisodes />
                </Suspense>
              }
            />
            <Route
              path="collections/:collectionId/seasons/:seasonId/episodes/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminEpisodeEdit />
                </Suspense>
              }
            />
            <Route
              path="collections/:collectionId/seasons/:seasonId/episodes/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminEpisodeEdit />
                </Suspense>
              }
            />
            <Route
              path="videos"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminVideos />
                </Suspense>
              }
            />
            <Route
              path="videos/new"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminVideoEdit />
                </Suspense>
              }
            />
            <Route
              path="videos/:id"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminVideoEdit />
                </Suspense>
              }
            />
            <Route
              path="users"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminUsers />
                </Suspense>
              }
            />
          </Route>

          {/* Public + user routes — with main Navbar/Footer */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col bg-[#07080F] text-[#E8DAC0]">
                <Navbar />
                <div className="flex-1">
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/catalogo" element={<CatalogPage />} />
                      <Route path="/collection/:id" element={<CollectionPage />} />
                      <Route path="/season/:id" element={<SeasonPage />} />
                      <Route path="/watch/episode/:id" element={<EpisodePlayerPage />} />
                      <Route path="/watch/video/:id" element={<VideoPlayerPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/premium" element={<PremiumPage />} />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </div>
                <Footer />
                <KoFiWidget />
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </AppErrorBoundary>
  );
}

function NotFoundPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
      <span className="text-6xl mb-6" aria-hidden="true">&#128214;</span>
      <h1 className="font-display text-4xl font-bold tracking-tight text-[#E8DAC0] mb-4">404</h1>
      <p className="text-[#8085A0] text-lg mb-8">Esta pagina no existe.</p>
      <a
        href="/"
        className="bg-[#E8430A] hover:bg-[#FF5020] text-white font-semibold px-8 py-3 rounded transition-colors duration-200"
      >
        Volver al inicio
      </a>
    </main>
  );
}
