import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const UpgradePrompt = () => {
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  const handleUpgrade = async () => {
    console.log('handleUpgrade called');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      
      if (!session) {
        throw new Error('No active session');
      }

      const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:5001`
        : `http://${window.location.hostname}`;

      const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
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

  return (
    <Box sx={{ py: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Choose Your Plan
      </Typography>

      {subscription?.articles_remaining > 0 && (
        <Typography variant="subtitle1" align="center" sx={{ mb: 4 }}>
          You have {subscription.articles_remaining} free articles remaining this month
        </Typography>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Free Plan
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                $0
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText primary="3 Articles per month" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText primary="Basic templates" />
                </ListItem>
              </List>
              {subscription?.articles_remaining > 0 && (
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => navigate('/generate')}
                  sx={{ mt: 2 }}
                >
                  Continue with Free Plan
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card raised>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Pro Plan
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                $29/mo
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText primary="Unlimited articles" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText primary="All premium templates" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText primary="Priority support" />
                </ListItem>
              </List>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleUpgrade}
                sx={{ mt: 2 }}
              >
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UpgradePrompt;