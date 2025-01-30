import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppConfigProvider from './components/ConfigProvider';
import { App as AntApp } from 'antd';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AppLayout from './layouts/AppLayout';
import PlayPage from './pages/PlayPage';
import FriendsPage from './pages/FriendsPage';
import MembersPage from './pages/MembersPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
  return (
    <AppConfigProvider>
      <AntApp>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Protected routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="play" element={<PlayPage />} />
                <Route path="friends" element={<FriendsPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route index element={<Navigate to="play" replace />} />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </AntApp>
    </AppConfigProvider>
  );
};

export default App;