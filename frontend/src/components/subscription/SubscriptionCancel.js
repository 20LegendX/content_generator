import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CancelIcon from '@mui/icons-material/Cancel';

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        maxWidth: 600,
        mx: 'auto'
      }}
    >
      <CancelIcon
        sx={{
          fontSize: 64,
          color: 'error.main',
          mb: 2
        }}
      />

      <Typography variant="h4" gutterBottom>
        Subscription Cancelled
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        Your subscription process was cancelled. No charges were made.
      </Typography>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/subscription')}
          sx={{ mr: 2 }}
        >
          Try Again
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

export default SubscriptionCancel;