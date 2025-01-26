import React, { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshSubscription, loading } = useSubscription();
  const { session } = useAuth();

  useEffect(() => {
    const init = async () => {
      await refreshSubscription();
      if (!session) {
        navigate('/login');
      }
    };
    init();
  }, [refreshSubscription, session, navigate]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  const handleStartCreating = () => {
    if (session) {
      navigate('/generate');
    } else {
      navigate('/login');
    }
  };

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      <CheckCircleIcon
        sx={{
          fontSize: 64,
          color: 'success.main',
          mb: 2
        }}
      />

      <Typography variant="h4" gutterBottom>
        Welcome to Pro!
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Your subscription has been successfully activated. Your account has been updated with Pro features.
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleStartCreating}
          sx={{ mr: 2 }}
        >
          Start Creating
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </Box>
    </Box>
  );
};

export default SubscriptionSuccess;