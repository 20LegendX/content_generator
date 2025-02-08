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
        // Get the session from the URL and check hash params
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check in callback:', session);

        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          console.log('Creating records for user:', session.user.id);

          // Create user record
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
            console.error('Error creating user record:', userError);
            throw userError;
          }

          console.log('User record created/updated successfully');

          // Check for existing subscription with detailed logging
          const { data: existingSub, error: checkError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (checkError) {
            console.log('No existing subscription found, creating new one');

            // Create new subscription with correct defaults for free tier
            const { data: newSub, error: subError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: session.user.id,
                plan_type: 'free',
                status: 'active',
                articles_generated: 0,
                articles_remaining: 3,
                monthly_limit: 3,  // Set correct limit for free tier
                billing_cycle_start: null,  // No billing cycle for free tier
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single();

            if (subError) {
              console.error('Subscription creation failed:', subError);
              throw subError;
            }

            console.log('New subscription created:', newSub);
          } else {
            console.log('Existing subscription found:', existingSub);
          }

          // Add additional session handling for production
          if (!session.access_token) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
            }
          }

          navigate('/');
          return;
        }

        throw new Error('No session established');
      } catch (error) {
        console.error('Auth callback error:', error);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <div>Processing login...</div>
    </div>
  );
};

export default AuthCallback;