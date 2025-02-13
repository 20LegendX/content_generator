import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { upsertUser } from '../../utils/db';

// Import or define API_BASE_URL
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5001`
  : `${window.location.protocol}//${window.location.hostname}`;

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.error('No session found');
          throw new Error('No session found');
        }

        // Get user data
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User error:', userError);
          throw userError;
        }

        // Update users table
        if (user) {
          try {
            const userData = {
              id: user.id,
              email: user.email,
              provider: user.app_metadata?.provider || 'email',
              provider_id: user.identities?.[0]?.id || user.id
            };

            console.log('Attempting to upsert user with data:', userData);
            const data = await upsertUser(userData);
            console.log('Successfully upserted user:', data);
          } catch (error) {
            console.error('Error upserting user:', error);
            // Continue with navigation even if upsert fails
          }
        }

        // Navigate after successful auth
        const redirectPath = localStorage.getItem('redirectPath') || '/';
        localStorage.removeItem('redirectPath');
        navigate(redirectPath);
      } catch (error) {
        console.error('Authentication error:', error);
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