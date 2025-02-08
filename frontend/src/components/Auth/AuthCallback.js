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
        const expires_in = hashParams.get('expires_in');
        const token_type = hashParams.get('token_type');

        console.log('Auth Callback Debug:', {
          hasAccessToken: !!access_token,
          tokenType: token_type,
          expiresIn: expires_in,
          hasRefreshToken: !!refresh_token,
          fullHash: window.location.hash,
          storage: {
            hasLocalStorage: !!window.localStorage,
            // Use the correct Supabase URL for storage key
            currentToken: !!window.localStorage.getItem(`sb-${supabase.supabaseUrl.split('//')[1]}-auth-token`)
          }
        });

        if (!access_token) {
          throw new Error('No access token in URL');
        }

        // Set the session with full token details
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
          expires_in: parseInt(expires_in || '3600', 10),
          token_type: token_type || 'bearer'
        });

        if (error) {
          console.error('Set Session Error:', {
            message: error.message,
            name: error.name,
            status: error.status,
            stack: error.stack
          });
          throw error;
        }

        // Get the redirect path or default to '/'
        const redirectPath = localStorage.getItem('redirectPath') || '/';
        localStorage.removeItem('redirectPath'); // Clean up
        
        navigate(redirectPath);
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