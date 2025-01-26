import React, { useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { supabase } from '../../lib/supabase';

export default function Auth() {
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Auth component session check:', session);
    });
  }, []);

  const handleGoogleLogin = async () => {
    console.log('Login button clicked');
    try {
      console.log('Starting OAuth sign in...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'http://127.0.0.1:5001/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      console.log('OAuth response:', data, error);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error:', error);
      alert(error.message);
    }
  };

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('Session error:', error);
  };

  const debugUserCreation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log('Current user:', session.user);
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      console.log('User record:', userData);
      
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      console.log('Subscription record:', subData);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
          onClick={() => {
            console.log('Button clicked'); // Debug log
            handleGoogleLogin();
          }}
        >
          Sign In with Google
        </Button>
        
        {/* Debug button */}
        <Button 
          onClick={checkSession}
          variant="outlined"
          color="secondary"
        >
          Check Session
        </Button>

        <Button onClick={debugUserCreation}>
          Debug User Creation
        </Button>
      </Box>
    </Container>
  );
}