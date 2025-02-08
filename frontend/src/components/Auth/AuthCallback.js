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
        // Log the full URL and hash
        console.log('Auth Callback URL:', {
          full: window.location.href,
          hash: window.location.hash,
          hashParams: new URLSearchParams(window.location.hash.substring(1))
        });

        // Get the session immediately after redirect
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Initial Session Check:', {
          hasSession: !!session,
          error: error,
          sessionData: session ? {
            userId: session.user.id,
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
            accessToken: session.access_token?.substring(0, 10) + '...'
          } : null
        });

        if (error) {
          console.error('Session Error:', error);
          throw error;
        }

        let currentSession = session;

        if (!currentSession) {
          // If no session, try to set it from the URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          console.log('Hash Params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenType: hashParams.get('token_type'),
            expiresIn: hashParams.get('expires_in')
          });

          if (accessToken) {
            // Set the session manually
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            console.log('Set Session Result:', {
              success: !!data.session,
              error: setSessionError
            });

            if (setSessionError) throw setSessionError;
            currentSession = data.session;
          } else {
            throw new Error('No access token in URL');
          }
        }

        if (!currentSession) throw new Error('Failed to establish session');

        console.log('Creating records for user:', currentSession.user.id);

        // Create/update user record
        const { error: userError } = await supabase
          .from('users')
          .upsert({
            id: currentSession.user.id,
            email: currentSession.user.email,
            auth_provider: currentSession.user.app_metadata?.provider || 'email',
            provider_id: currentSession.user.app_metadata?.provider_id,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (userError) {
          console.error('User record error:', userError);
          throw userError;
        }

        console.log('User record created/updated successfully');

        // Check for existing subscription
        const { data: existingSub, error: checkError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .single();

        if (checkError && !existingSub) {
          console.log('Creating new subscription for user');
          const { error: subError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: currentSession.user.id,
              plan_type: 'free',
              status: 'active',
              articles_generated: 0,
              articles_remaining: 3,
              monthly_limit: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (subError) {
            console.error('Subscription creation error:', subError);
            throw subError;
          }
        } else {
          console.log('Existing subscription found:', existingSub);
        }

        // If we get here, everything was successful
        navigate('/');
      } catch (error) {
        console.error('Auth Callback Error:', {
          message: error.message,
          stack: error.stack,
          type: error.constructor.name
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div>Processing authentication...</div>
      <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
        {window.location.href}
      </div>
    </div>
  );
};

export default AuthCallback;