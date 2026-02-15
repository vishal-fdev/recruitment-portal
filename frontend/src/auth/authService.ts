// src/auth/authService.ts

export type UserRole =
  | 'VENDOR'
  | 'VENDOR_MANAGER'
  | 'VENDOR_MANAGER_HEAD'
  | 'HIRING_MANAGER';

class AuthService {
  login(token: string, role: UserRole) {
    if (!token || !role) {
      throw new Error('Invalid login data');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): UserRole | null {
    const role = localStorage.getItem('role');
    return role as UserRole | null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();
