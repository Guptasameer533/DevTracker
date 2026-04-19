import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';

/**
 * This page exists only as a client-side landing spot after the OAuth redirect.
 * The actual callback is handled server-side at /api/v1/auth/github/callback,
 * which sets the session cookie and redirects the browser to /dashboard.
 *
 * This page handles the edge case where the redirect lands here instead
 * (e.g., in dev with a different callback URL config).
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Give the server a moment to set the cookie, then navigate to dashboard
    const timer = setTimeout(() => navigate('/dashboard', { replace: true }), 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <LoadingSpinner label="Completing sign-in..." />;
}
