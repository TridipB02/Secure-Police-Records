import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AntecedentDashboard from './pages/AntecedentDashboard';
import LicensingDashboard from './pages/LicensingDashboard';
import AuditDashboard from './pages/AuditDashboard';
import AdminDashboard from './pages/AdminDashboard';
import VerifyCertificate from './pages/VerifyCertificate';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="shell">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/verify/:certId" element={<VerifyCertificate />} />

              <Route path="/citizen" element={
                <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              } />

              <Route path="/officer" element={
                <ProtectedRoute allowedRoles={['POLICE_OFFICER', 'ADMIN']}>
                  <OfficerDashboard />
                </ProtectedRoute>
              } />

              <Route path="/antecedent" element={
                <ProtectedRoute allowedRoles={['ANTECEDENT_OFFICER', 'ADMIN']}>
                  <AntecedentDashboard />
                </ProtectedRoute>
              } />

              <Route path="/licensing" element={
                <ProtectedRoute allowedRoles={['LICENSING_AUTHORITY', 'ADMIN']}>
                  <LicensingDashboard />
                </ProtectedRoute>
              } />

              <Route path="/audit" element={
                <ProtectedRoute allowedRoles={['AUDIT_OFFICER', 'ADMIN']}>
                  <AuditDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
