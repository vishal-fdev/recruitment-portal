// src/auth/withRoleGuard.tsx

import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { authService } from './authService';
import type { UserRole } from './authService';

interface Props {
  allowedRole: UserRole | UserRole[];
  children: ReactNode;
}

const WithRoleGuard = ({ allowedRole, children }: Props) => {
  const token = authService.getToken();
  const role = authService.getRole();

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = Array.isArray(allowedRole)
    ? allowedRole
    : [allowedRole];

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default WithRoleGuard;
