// src/auth/auth.service.ts

export type UserRole =
  | 'VENDOR'
  | 'VENDOR_MANAGER'
  | 'HIRING_MANAGER';

class AuthService {
  /**
   * Save token & role after successful login
   */
  login(token: string, role: UserRole) {
    if (!token || !role) {
      throw new Error('Invalid login data');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  }

  /**
   * Clear auth state
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  /**
   * Get JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get logged-in user role
   */
  getRole(): UserRole | null {
    const role = localStorage.getItem('role');
    return role as UserRole | null;
  }

  /**
   * Check auth state
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * ✅ ALWAYS use this for API calls
   */
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }
}

export const authService = new AuthService();
