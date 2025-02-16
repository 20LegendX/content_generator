import React from 'react';
import { Box, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { themes } from '../config/themes';

const ThemeSelector = ({ selectedTheme, onThemeSelect }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      mb: 4,
      borderRadius: '12px',
      p: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)',
    }}>
      {themes.map((theme) => (
        <Tooltip key={theme.id} title={theme.name} arrow>
          <Box
            onClick={() => onThemeSelect(theme)}
            sx={{
              cursor: 'pointer',
              width: 40,
              height: 40,
              borderRadius: '50%',
              position: 'relative',
              background: `linear-gradient(135deg, ${theme.colors.background} 50%, ${theme.colors.accent} 50%)`,
              border: theme.id === selectedTheme?.id ? '2px solid #1976d2' : '2px solid transparent',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {theme.id === selectedTheme?.id && (
              <CheckCircleIcon sx={{ 
                color: '#fff',
                fontSize: 20,
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
              }} />
            )}
          </Box>
        </Tooltip>
      ))}
    </Box>
  );
};

export default ThemeSelector;