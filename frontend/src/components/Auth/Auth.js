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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      if (error) {
        console.error('SignIn error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
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
      </Box>
    </Container>
  );
}