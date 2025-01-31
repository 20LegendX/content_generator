import React from 'react';
import { Button, Chip, Box, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../lib/supabase';

const SubscriptionStatus = () => {
  const navigate = useNavigate();
  const { subscription, isPro, articlesRemaining } = useSubscription();

  const handleUpgrade = async () => {
    console.log('handleUpgrade called');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      if (url) {
        console.log('Redirecting to Stripe:', url);
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  if (!subscription) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
      {isPro ? (
        <Chip
          label="PRO"
          color="primary"
          variant="outlined"
        />
      ) : (
        <Tooltip title="Articles remaining this month" arrow>
          <Chip
            label={`FREE (${articlesRemaining} left)`}
            color="default"
            variant="outlined"
          />
        </Tooltip>
      )}
      {!isPro && (
        <Button
          color="inherit"
          variant="outlined"
          size="small"
          onClick={handleUpgrade}
        >
          Upgrade to Pro
        </Button>
      )}
    </Box>
  );
};

export default SubscriptionStatus;