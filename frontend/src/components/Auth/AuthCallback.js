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
        console.log('Starting auth callback, URL:', window.location.href);
        
        // IMPORTANT: First handle the OAuth response
        if (window.location.hash) {
          console.log('Found hash parameters');
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            console.log('Setting session from tokens');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (error) {
              console.error('Error setting session:', error);
              throw error;
            }
            
            if (data.session) {
              console.log('Session established from tokens');
              // Now get the fresh session
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError) throw sessionError;
              if (!session) throw new Error('No session after token exchange');

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

              if (userError) throw userError;

              // Check for subscription
              const { data: existingSub, error: checkError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (checkError) {
                // Create new subscription
                const { error: subError } = await supabase
                  .from('subscriptions')
                  .insert({
                    user_id: session.user.id,
                    plan_type: 'free',
                    status: 'active',
                    articles_generated: 0,
                    articles_remaining: 3,
                    monthly_limit: 3,
                    billing_cycle_start: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  });

                if (subError) throw subError;
              }

              navigate('/');
              return;
            }
          }
        }

        // If we get here, something went wrong
        throw new Error('No valid auth response found');
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
      <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        Please wait while we complete your sign in...
      </div>
    </div>
  );
};

export default AuthCallback;