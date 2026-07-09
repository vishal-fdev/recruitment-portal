// src/auth/authService.ts

export type UserRole =
  | 'VENDOR'
  | 'VENDOR_MANAGER'
  | 'VENDOR_MANAGER_HEAD'
  | 'HIRING_MANAGER'
  | 'BADGED_HIRING_MANAGER'
  | 'BADGED_RECRUITER'
  | 'PANEL';

class AuthService {
  private decodeToken(token: string): Record<string, any> | null {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalized));
    } catch {
      return null;
    }
  }

  private isExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  }
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
    const token = localStorage.getItem('token');
    if (token && this.isExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  getRole(): UserRole | null {
    const role = localStorage.getItem('role');
    return role as UserRole | null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserEmail(): string {
    const token = this.getToken();
    if (!token) return '';

    const payload = this.decodeToken(token);
    return payload?.email || payload?.username || '';
  }

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const authService = new AuthService();


