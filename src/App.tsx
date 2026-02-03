import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommandProvider } from './context/CommandContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Clients from './pages/Clients';
import Academy from './pages/Academy';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Kanban from './pages/Kanban';
import Login from './pages/Login';
import Team from './pages/Team';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-spark-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-spark-orange rounded-full animate-spin shadow-neo-sm"></div>
          <p className="font-bold uppercase tracking-widest text-sm animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Role-Based Guard Component
const RoleGuard = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CommandProvider>
          <ToastProvider>
            <NotificationProvider>
              <ThemeProvider>
                <Router>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<ProtectedRoute />}>
                      <Route element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="team" element={<Team />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="projects/board" element={<Kanban />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="academy" element={<Academy />} />
                        <Route path="academy/students" element={<Academy />} />
                        <Route path="academy/courses" element={<Academy />} />
                        <Route path="notifications" element={<Notifications />} />

                        <Route element={<RoleGuard allowedRoles={['admin']} />}>
                          <Route path="finance" element={<Finance />} />
                          <Route path="settings" element={<Settings />} />
                        </Route>
                      </Route>
                    </Route>

                    {/* Catch-all: Redirect to Home (Safe Redirect) */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Router>
              </ThemeProvider>
            </NotificationProvider>
          </ToastProvider>
        </CommandProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App;
