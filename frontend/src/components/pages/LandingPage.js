import React from 'react';
import { Button, Typography, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LandingPage = ({ isAuthenticated }) => {
  const navigate = useNavigate();

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

        {/* Only show one set of buttons based on auth state */}
        {isAuthenticated ? (
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/generate')}
            >
              Start Generating Content
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={() => navigate('/login')}
            >
              Sign In to Get Started
            </Button>
          </Box>
        )}

        {/* Features section remains the same */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" gutterBottom>
            Features
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 4,
            mt: 4 
          }}>
            <FeatureCard 
              title="Match Reports"
              description="Generate detailed match reports with statistics and analysis"
            />
            <FeatureCard 
              title="Player Scouting"
              description="Create comprehensive player scouting reports"
            />
            <FeatureCard 
              title="Custom Templates"
              description="Choose from multiple templates for different content types"
            />
          </Box>
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