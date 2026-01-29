import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  allowedRole: 'VENDOR' | 'VENDOR_MANAGER' | 'HIRING_MANAGER';
  children: ReactNode;
}

const WithRoleGuard = ({ allowedRole, children }: Props) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // 🔒 No token → login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 🔒 Role mismatch → login
  if (role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Authorized
  return <>{children}</>;
};

export default WithRoleGuard;
