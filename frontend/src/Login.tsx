// src/Login.tsx

import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from './api/api';
import { authService } from './auth/authService';
import type { UserRole } from './auth/authService';

import loginBg from './assets/login-bg.jpg';

const normalizeRole = (role: string): UserRole => {
  switch (role) {
    case 'VENDOR':
    case 'VENDOR_MANAGER':
    case 'VENDOR_MANAGER_HEAD':
    case 'HIRING_MANAGER':
      return role;
    default:
      throw new Error('Invalid role received from backend');
  }
};

const Login = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const redirectPath = searchParams.get('redirect');
  const redirectEmail = searchParams.get('email');

  const getDefaultRoute = (role: UserRole) => {
    if (role === 'VENDOR') return '/vendor';
    if (role === 'VENDOR_MANAGER') return '/vendor-manager';
    if (role === 'VENDOR_MANAGER_HEAD') return '/vendor-manager-head';
    return '/hiring-manager';
  };

  const handleLogin = async (emailOverride?: string) => {

    const targetEmail = (emailOverride ?? email).trim();

    if (!targetEmail) {
      alert('Email is required');
      return;
    }

    try {

      setLoading(true);

      const res = await api.post('/auth/login', {
        email: targetEmail,
      });

      const token: string = res.data.access_token;

      const normalizedRole = normalizeRole(res.data.user.role);

      authService.login(token, normalizedRole);

      const destination =
        redirectPath && redirectPath.startsWith('/')
          ? redirectPath
          : getDefaultRoute(normalizedRole);

      navigate(destination, { replace: true });

    } catch (err) {

      console.error(err);
      alert('Invalid email or access not allowed');

    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  useEffect(() => {
    if (!redirectEmail || loading) return;

    setEmail(redirectEmail);
    void handleLogin(redirectEmail);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectEmail]);

  return (

    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: `url(${loginBg})` }}
    >

      {/* GLOBAL DARK OVERLAY */}

      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>


      {/* ANIMATED GREEN LINES */}

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute w-[120%] h-[2px] bg-emerald-400/40 animate-pulse top-1/4 blur-sm"></div>
        <div className="absolute w-[120%] h-[2px] bg-emerald-400/40 animate-pulse top-2/4 blur-sm"></div>
        <div className="absolute w-[120%] h-[2px] bg-emerald-400/40 animate-pulse top-3/4 blur-sm"></div>

      </div>


      {/* MAIN CONTAINER */}

      <div className="relative z-10 w-[1150px] flex items-center justify-between px-10">


        {/* LEFT SIDE BRANDING */}

        <div className="max-w-xl p-10 text-white">

          <h2 className="text-sm text-gray-200 mb-2 tracking-wide">
            Welcome to
          </h2>

          <h1 className="text-5xl font-bold mb-6 leading-tight drop-shadow-lg">
            Hewlett Packard
            <br />
            Enterprise
          </h1>

          <p className="text-base text-gray-200 leading-relaxed">
            Manage hiring workflows, vendor collaboration, and recruitment
            operations securely across the enterprise platform.
          </p>

          <div className="mt-10 text-sm text-gray-300">
            © 2026 Hewlett Packard Enterprise
          </div>

        </div>


        {/* LOGIN CARD */}

        <div className="flex justify-end">

          <div className="w-[380px] bg-black/30 backdrop-blur-xl rounded-2xl p-10 shadow-2xl border border-white/20">

            <h3 className="text-2xl font-semibold text-white mb-8 text-center">
              Sign In
            </h3>

            {/* FORM ADDED HERE */}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}

              <div>

                <label className="block text-sm text-gray-200 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

              </div>


              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 rounded-md font-medium hover:bg-emerald-700 transition disabled:opacity-60"
              >

                {loading ? 'Signing in…' : 'Sign In'}

              </button>

            </form>

          </div>

        </div>

      </div>

    </div>

  );
};

export default Login;
