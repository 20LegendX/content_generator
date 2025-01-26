import React from 'react';
import { Button, Chip, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';

const SubscriptionStatus = () => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  if (!subscription) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 2 }}>
      <Chip
        label={subscription.plan_type === 'pro' ? 'PRO' : `FREE (${subscription.articles_remaining} left)`}
        color={subscription.plan_type === 'pro' ? 'primary' : 'default'}
        variant="outlined"
      />
      {subscription.plan_type === 'free' && (
        <Button
          color="inherit"
          variant="outlined"
          size="small"
          onClick={() => navigate('/subscription')}
        >
          Upgrade
        </Button>
      )}
    </Box>
  );
};

export default SubscriptionStatus;