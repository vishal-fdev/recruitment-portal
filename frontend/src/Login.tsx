// src/Login.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/api';
import { authService } from './auth/authService';
import type { UserRole } from './auth/authService';

const normalizeRole = (role: string): UserRole => {
  switch (role) {
    case 'VENDOR':
      return 'VENDOR';
    case 'VENDOR_MANAGER':
      return 'VENDOR_MANAGER';
    case 'HIRING_MANAGER':
      return 'HIRING_MANAGER';
    default:
      throw new Error('Invalid role received from backend');
  }
};

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('VENDOR');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !role) {
      alert('Email and role are required');
      return;
    }

    try {
      setLoading(true);

      const res = await api.post('/auth/login', {
        email,
        role,
      });

      const token: string = res.data.access_token;
      const normalizedRole = normalizeRole(res.data.user.role);

      // ✅ SINGLE SOURCE OF TRUTH
      authService.login(token, normalizedRole);

      // ✅ ROLE-BASED REDIRECT (NO RELOAD)
      if (normalizedRole === 'VENDOR') {
        navigate('/vendor', { replace: true });
      } else if (normalizedRole === 'VENDOR_MANAGER') {
        navigate('/vendor-manager', { replace: true });
      } else if (normalizedRole === 'HIRING_MANAGER') {
        navigate('/hiring-manager', { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-lg font-semibold mb-4">Login</h1>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="w-full h-10 border rounded-md px-3 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              className="w-full h-10 border rounded-md px-3 mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="VENDOR">Vendor</option>
              <option value="VENDOR_MANAGER">Vendor Manager</option>
              <option value="HIRING_MANAGER">Hiring Manager</option>
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-600 text-white rounded-md h-10 font-medium disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
