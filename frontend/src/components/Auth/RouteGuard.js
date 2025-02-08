import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CircularProgress, Box } from '@mui/material';

export function RouteGuard({ children }) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        console.log('Route Guard Check:', {
          hasSession: !!currentSession,
          error: error,
          path: window.location.pathname,
          storage: {
            hasLocalStorage: !!window.localStorage,
            hasToken: !!window.localStorage.getItem(`sb-${supabase.supabaseUrl.split('//')[1]}-auth-token`)
          }
        });

        if (error) throw error;
        
        setSession(currentSession);

        if (!currentSession) {
          localStorage.setItem('redirectPath', window.location.pathname);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login', { replace: true });
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth State Change in RouteGuard:', {
        hasSession: !!session,
        event: _event
      });
      
      setSession(session);
      if (!session) {
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isChecking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return session ? children : null;
}

export default RouteGuard;