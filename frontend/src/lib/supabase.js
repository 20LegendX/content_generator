import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Enhanced debug logging
console.log('Environment Check:', {
  nodeEnv: process.env.NODE_ENV,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl,
  keyPrefix: supabaseAnonKey?.substring(0, 8), // Show more of the key prefix
  origin: window.location.origin,
  hostname: window.location.hostname
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    debug: true // Enable Supabase's internal debug logging
  }
});

// Test the connection immediately
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth Event:', event, {
    hasSession: !!session,
    sessionDetails: session ? {
      expiresAt: session.expires_at,
      provider: session?.user?.app_metadata?.provider,
      hasAccessToken: !!session.access_token,
      accessTokenPrefix: session.access_token?.substring(0, 8)
    } : null
  });
});

// Add this after creating the supabase client
if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG === 'true') {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const [url, config] = args;
    
    if (url.includes('supabase')) {
      console.log('Supabase Request:', {
        url,
        method: config?.method,
        headers: config?.headers,
        hasAuthHeader: !!config?.headers?.Authorization,
        authPrefix: config?.headers?.Authorization?.substring(0, 20)
      });
    }
    
    return originalFetch.apply(this, args);
  };
}