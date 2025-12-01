import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import SubadminDashboard from './pages/Subadmin/Dashboard';
import TeacherDashboard from './pages/Teacher/Dashboard';
import StudentDashboard from './pages/Student/Dashboard';
import PrincipleDashboard from './pages/Principle/Dashboard';
import ParentDashboard from './pages/Parent/Dashboard';

// Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App component
function AppContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Admin routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Subadmin routes */}
      <Route
        path="/subadmin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['subadmin']}>
            <SubadminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Principle routes */}
      <Route
        path="/principle/dashboard"
        element={
          <ProtectedRoute allowedRoles={['principle']}>
            <PrincipleDashboard />
          </ProtectedRoute>
        }
      />

      {/* Parent routes */}
      <Route
        path="/parent/dashboard"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user.role === 'subadmin' ? (
              <Navigate to="/subadmin/dashboard" replace />
            ) : user.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : user.role === 'student' ? (
              <Navigate to="/student/dashboard" replace />
            ) : user.role === 'principle' ? (
              <Navigate to="/principle/dashboard" replace />
            ) : user.role === 'parent' ? (
              <Navigate to="/parent/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;