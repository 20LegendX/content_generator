import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../lib/supabase';
import { API_BASE_URL } from '../../config';

const PlanCard = ({ title, price, features, current, onSelect }) => (
  <Card raised={current} sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" color="primary" gutterBottom>
        ${price}
      </Typography>
      <Box sx={{ mb: 2 }}>
        {features.map((feature, index) => (
          <Typography key={index} variant="body2" sx={{ mb: 1 }}>
            • {feature}
          </Typography>
        ))}
      </Box>
      {!current && (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onSelect}
        >
          Upgrade Now
        </Button>
      )}
      {current && (
        <Typography variant="subtitle1" color="primary">
          Current Plan
        </Typography>
      )}
    </CardContent>
  </Card>
);

const SubscriptionManager = () => {
  const { subscription, loading } = useSubscription();

  const handleUpgrade = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Subscription Plans
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <PlanCard
            title="Free Plan"
            price="0"
            features={[
              '3 Articles per month',
              'Basic templates',
              'Standard support'
            ]}
            current={subscription?.plan_type === 'free'}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <PlanCard
            title="Pro Plan"
            price="29"
            features={[
              'Unlimited articles',
              'All templates',
              'Priority support',
              'Advanced features'
            ]}
            current={subscription?.plan_type === 'pro'}
            onSelect={handleUpgrade}
          />
        </Grid>
      </Grid>

      {subscription && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Your Subscription Details
          </Typography>
          <Typography>
            Plan: {subscription.plan_type.toUpperCase()}
          </Typography>
          <Typography>
            Articles Remaining: {subscription.articles_remaining}
          </Typography>
          {subscription.current_period_end && (
            <Typography>
              Renewal Date: {new Date(subscription.current_period_end).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SubscriptionManager;