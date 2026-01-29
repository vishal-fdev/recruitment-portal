// src/auth/useAuth.ts

import { useState } from 'react';
import { authService } from './authService';
import type { UserRole } from './authService';

export const useAuth = () => {
  const [role, setRole] = useState<UserRole | null>(
    authService.getRole()
  );

  const login = (token: string, role: UserRole) => {
    authService.login(token, role);
    setRole(role);
  };

  const logout = () => {
    authService.logout();
    setRole(null);
  };

  return {
    role,
    isAuthenticated: authService.isAuthenticated(),
    login,
    logout,
  };
};
