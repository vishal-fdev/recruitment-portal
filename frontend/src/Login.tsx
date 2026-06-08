import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Form,
  FormField,
  Grommet,
  Heading,
  Image,
  Paragraph,
  Text,
  TextInput,
} from 'grommet';
import api from './api/api';
import { authService } from './auth/authService';
import type { UserRole } from './auth/authService';
import loginBg from './assets/login-bg.jpg';
import appTheme from './theme/hpeTheme';

const normalizeRole = (role: string): UserRole => {
  switch (role) {
    case 'VENDOR':
    case 'VENDOR_MANAGER':
    case 'VENDOR_MANAGER_HEAD':
    case 'HIRING_MANAGER':
    case 'PANEL':
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
    if (role === 'PANEL') return '/panel';
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

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    void handleLogin();
  };

  useEffect(() => {
    if (!redirectEmail || loading) return;

    setEmail(redirectEmail);
    void handleLogin(redirectEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectEmail]);

  return (
    <Grommet theme={appTheme} full>
      <Box
        fill
        align="center"
        justify="center"
        pad="large"
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
        }}
      >
        <Image
          src={loginBg}
          alt="HPE recruitment portal background"
          fit="cover"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />

        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.40)',
            backdropFilter: 'blur(6px)',
          }}
        />

        {[25, 50, 75].map((top) => (
          <Box
            key={top}
            style={{
              position: 'absolute',
              top: `${top}%`,
              left: '-10%',
              width: '120%',
              height: 2,
              background: 'rgba(52, 211, 153, 0.40)',
              filter: 'blur(2px)',
            }}
          />
        ))}

        <Box
          direction="row"
          justify="between"
          align="center"
          width={{ max: '1150px' }}
          fill="horizontal"
          pad={{ horizontal: '40px' }}
          gap="large"
          wrap
          responsive
          style={{ position: 'relative', zIndex: 1 }}
        >
          <Box pad="40px" width={{ max: '560px' }} gap="medium">
            <Text size="small" color="#E5E7EB" style={{ letterSpacing: '0.08em' }}>
              Welcome to
            </Text>

            <Heading
              level={1}
              margin="none"
              size="56px"
              color="white"
              style={{ lineHeight: 1.05 }}
            >
              Hewlett Packard
              <br />
              Enterprise
            </Heading>

            <Paragraph margin="none" size="medium" color="#E5E7EB">
              Manage hiring workflows, vendor collaboration, and recruitment
              operations securely across the enterprise platform.
            </Paragraph>

            <Text margin={{ top: '24px' }} size="small" color="#D1D5DB">
              © 2026 Hewlett Packard Enterprise
            </Text>
          </Box>

          <Box
            width="380px"
            round="24px"
            pad="40px"
            gap="large"
            background="rgba(0, 0, 0, 0.30)"
            border={{ color: 'rgba(255, 255, 255, 0.20)' }}
            style={{
              backdropFilter: 'blur(20px)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            }}
          >
            <Heading level={3} margin="none" textAlign="center" color="white">
              Sign In
            </Heading>

            <Form onSubmit={handleSubmit}>
              <Box gap="24px">
                <FormField
                  htmlFor="login-email"
                  label={<Text size="small" color="#E5E7EB">Email</Text>}
                >
                  <TextInput
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                    style={{
                      borderRadius: 8,
                      background: '#FFFFFF',
                      fontSize: 14,
                    }}
                  />
                </FormField>

                <Button
                  type="submit"
                  disabled={loading}
                  label={loading ? 'Signing in…' : 'Sign In'}
                  primary
                  color="#059669"
                  style={{
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontWeight: 500,
                  }}
                />
              </Box>
            </Form>
          </Box>
        </Box>
      </Box>
    </Grommet>
  );
};

export default Login;
