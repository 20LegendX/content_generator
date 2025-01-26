import React, { useEffect } from 'react';
import { Button, Typography, Box, Container, Grid, Card, CardContent, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { supabase } from '../../lib/supabase';

const LandingPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { subscription } = useSubscription();

  const isAuthenticated = Boolean(subscription);

  const renderFreePlanButton = () => {
    if (!isAuthenticated) {
      return (
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Get Started
        </Button>
      );
    }

    // If user has a subscription, show appropriate button
    if (subscription?.plan_type === 'pro') {
      return (
        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
          Current Plan
        </Typography>
      );
    }

    return (
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth
        onClick={() => navigate('/generate')}
        sx={{ mt: 2 }}
      >
        Start Generating
      </Button>
    );
  };

  const renderProPlanButton = () => {
    if (!isAuthenticated) {
      return (
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth
          onClick={() => navigate('/login')}
          sx={{ mt: 2 }}
        >
          Get Started
        </Button>
      );
    }

    if (subscription?.plan_type === 'pro') {
      return (
        <Typography variant="body2" color="primary" sx={{ mt: 2 }}>
          Current Plan
        </Typography>
      );
    }

    return (
      <Button 
        variant="contained" 
        color="primary" 
        fullWidth
        onClick={handleUpgrade}
        sx={{ mt: 2 }}
      >
        Upgrade to Pro
      </Button>
    );
  };

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

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        textAlign: 'center', 
        py: 8 
      }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Content Generator
        </Typography>
        
        <Typography variant="h5" color="text.secondary" paragraph>
          Generate professional articles, match reports, and scout reports
        </Typography>

        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" gutterBottom>
            Choose Your Plan
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Free Plan
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    £0
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckIcon /></ListItemIcon>
                      <ListItemText primary="5 Articles Total" secondary="One-time limit" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon /></ListItemIcon>
                      <ListItemText primary="Basic Templates" />
                    </ListItem>
                  </List>
                  {renderFreePlanButton()}
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
                    £29/mo
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckIcon /></ListItemIcon>
                      <ListItemText primary="50 Articles per Month" secondary="Resets monthly" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon /></ListItemIcon>
                      <ListItemText primary="All Premium Templates" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckIcon /></ListItemIcon>
                      <ListItemText primary="Priority Support" />
                    </ListItem>
                  </List>
                  {renderProPlanButton()}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

const FeatureCard = ({ title, description }) => (
  <Box sx={{ 
    p: 3, 
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    textAlign: 'left'
  }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

export default LandingPage;