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
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        if (!currentSession) {
          // Save the current path before redirecting
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

    // Initial check
    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isChecking) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Only render children if we have a session
  return session ? children : null;
}

export default RouteGuard;