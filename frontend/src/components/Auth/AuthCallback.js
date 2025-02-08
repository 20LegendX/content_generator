import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Import or define API_BASE_URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5001`
  : `${window.location.protocol}//${window.location.hostname}`;

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        console.log('Token Debug:', {
          hasAccessToken: !!access_token,
          accessTokenLength: access_token?.length,
          accessTokenPrefix: access_token?.substring(0, 20),
          hasRefreshToken: !!refresh_token,
          storage: {
            hasLocalStorage: !!window.localStorage,
            currentToken: !!window.localStorage.getItem(`sb-${API_BASE_URL.split('//')[1]}-auth-token`)
          }
        });

        if (!access_token) {
          throw new Error('No access token in URL');
        }

        // Explicitly set the session
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });

        console.log('Set Session Result:', {
          success: !!data?.session,
          error: error,
          session: data?.session ? {
            userId: data.session.user.id,
            email: data.session.user.email,
            expiresAt: data.session.expires_at
          } : null
        });

        if (error) throw error;

        // If successful, navigate home
        navigate('/');
      } catch (error) {
        console.error('Auth Error:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div>Processing authentication...</div>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        {window.location.href}
      </div>
    </div>
  );
};

export default AuthCallback;