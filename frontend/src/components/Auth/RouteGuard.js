import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export function RouteGuard({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (loading) return;

        if (!session) {
          localStorage.setItem('redirectPath', location.pathname);
          navigate('/login', { replace: true });
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login', { replace: true });
      }
    };

    checkAuth();
  }, [session, loading, navigate, location]);

  if (loading || isChecking) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return session ? children : null;
}

export default RouteGuard;