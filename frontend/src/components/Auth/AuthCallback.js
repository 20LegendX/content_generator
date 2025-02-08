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

        // Debug the Supabase configuration
        console.log('Supabase Config Debug:', {
          hasUrl: !!supabase.supabaseUrl,
          urlValue: supabase.supabaseUrl,
          hasAnonKey: !!supabase.supabaseKey,
          keyPrefix: supabase.supabaseKey?.substring(0, 10),
          envCheck: {
            hasEnvUrl: !!process.env.REACT_APP_SUPABASE_URL,
            hasEnvKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
          }
        });

        if (!access_token) {
          throw new Error('No access token in URL');
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
          expires_in: parseInt(expires_in || '3600', 10),
          token_type: token_type || 'bearer'
        });

        if (error) {
          throw error;
        }

        const redirectPath = localStorage.getItem('redirectPath') || '/';
        localStorage.removeItem('redirectPath');
        navigate(redirectPath);
      } catch (error) {
        // Generic error for production
        console.error('Authentication error occurred');
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div>Processing authentication...</div>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        Debug Info: {process.env.NODE_ENV} - {window.location.hostname}
      </div>
    </div>
  );
};

export default AuthCallback;