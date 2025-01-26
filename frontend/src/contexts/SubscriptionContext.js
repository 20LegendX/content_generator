import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext({});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const getSubscription = async () => {
    if (!session?.user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no subscription exists, create a free tier subscription
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: session.user.id,
            plan_type: 'free',
            status: 'active',
            articles_generated: 0,
            articles_remaining: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (createError) {
          console.error('Error creating free subscription:', createError);
          // Fallback to memory state if DB insert fails
          setSubscription({
            plan_type: 'free',
            articles_remaining: 3,
            articles_generated: 0,
            status: 'active'
          });
        } else {
          setSubscription(newSub[0]); // Set the newly created subscription
        }
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setSubscription({
        plan_type: 'free',
        articles_remaining: 3,
        articles_generated: 0,
        status: 'active'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add upgrade function
  const upgradeToProPlan = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: 'pro',
          status: 'active',
          articles_remaining: 50,
          monthly_limit: 50,
          billing_cycle_start: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setSubscription(data);
      return { success: true, data };
    } catch (error) {
      console.error('Error upgrading to pro:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchSubscription = async () => {
      if (mounted) {
        await getSubscription();
      }
    };

    fetchSubscription();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]); // Only re-run if user ID changes

  const value = {
    subscription,
    loading,
    refreshSubscription: getSubscription,
    upgradeToProPlan,  // Add to context value
    canGenerateArticle: () => {
      if (!subscription) return false;
      return subscription.plan_type === 'pro' || subscription.articles_remaining > 0;
    },
    isPro: subscription?.plan_type === 'pro',
    articlesRemaining: subscription?.articles_remaining || 0,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};