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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session) throw new Error('No session established');

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

        if (userError) throw userError;

        console.log('User record created/updated successfully');

        // Check for existing subscription
        const { data: existingSub, error: checkError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (checkError && !existingSub) {
          console.log('No existing subscription found, creating new one');
          await supabase
            .from('subscriptions')
            .insert({
              user_id: session.user.id,
              plan_type: 'free',
              status: 'active',
              articles_generated: 0,
              articles_remaining: 3,
              monthly_limit: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } else {
          console.log('Existing subscription found:', existingSub);
        }

        navigate('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>Processing login...</div>
    </div>
  );
};

export default AuthCallback;