import React, { useEffect } from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Google as GoogleIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ArticleIcon from '@mui/icons-material/Article';

export default function Auth() {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (session) {
      // Get the intended destination from localStorage, or default to '/'
      const redirectPath = localStorage.getItem('redirectPath') || '/';
      localStorage.removeItem('redirectPath'); // Clean up
      navigate(redirectPath);
    }
  }, [session, navigate]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth component session check:', session);
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', error);
  };

  const debugUserCreation = async () => {
    try {
      // 1. Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      if (sessionError) console.error('Session error:', sessionError);

      if (!session?.user) {
        console.log('No user logged in');
        return;
      }

      // 2. Manually trigger user record creation
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          auth_provider: session.user.app_metadata?.provider || 'email',
          provider_id: session.user.app_metadata?.provider_id,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
      
      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }

      // 3. Check if user record exists
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      console.log('User record:', userData);
      if (fetchError) console.error('Error fetching user:', fetchError);

      // 4. Check subscription
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      console.log('Subscription record:', subData);
      if (subError) console.error('Error fetching subscription:', subError);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-[80vh] flex items-center justify-center px-4"
    >
      <Paper 
        elevation={3}
        className="w-full max-w-md p-8 rounded-2xl"
        sx={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <Box className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ArticleIcon 
              sx={{ 
                fontSize: 48, 
                color: 'primary.main',
                filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
              }} 
            />
          </div>
          <Typography 
            variant="h4" 
            component="h1" 
            className="mb-2 font-bold"
            sx={{ 
              background: 'linear-gradient(90deg, #1976d2, #64b5f6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Welcome to PageCrafter
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            className="mb-6"
          >
            Sign in to start creating amazing content
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleGoogleLogin}
          startIcon={<GoogleIcon />}
          sx={{
            py: 2,
            borderRadius: '12px',
            textTransform: 'none',
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #4285f4, #34a853)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.12)',
            '&:hover': {
              background: 'linear-gradient(45deg, #3367d6, #2d9144)',
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Continue with Google
        </Button>

        <Box className="mt-8 text-center">
          <Typography 
            variant="body2" 
            color="text.secondary"
            className="mb-2"
          >
            By signing in, you agree to our
          </Typography>
          <Box className="flex justify-center gap-2 text-sm">
            <a 
              href="/terms-and-conditions" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-gray-400">•</span>
            <a 
              href="/privacy-policy" 
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Privacy Policy
            </a>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}