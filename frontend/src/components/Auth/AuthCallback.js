import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CircularProgress } from '@mui/material';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Skip the exchange and just check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check in callback:', session);
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // We have a session, redirect to dashboard
          console.log('Redirecting to dashboard...');
          navigate('/dashboard');
          return;
        }

        // No session found
        throw new Error('No session established');
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(error.message);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <div style={{ color: 'red', marginBottom: '1rem' }}>Error: {error}</div>
        <div>Redirecting to home...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <CircularProgress />
      <div style={{ marginTop: '1rem' }}>Processing login...</div>
    </div>
  );
};

export default AuthCallback;