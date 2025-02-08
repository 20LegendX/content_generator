import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { themes } from '../config/themes';

const ThemeSelector = ({ selectedTheme, onThemeSelect }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Select Theme
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {themes.map((theme) => (
          <Paper
            key={theme.id}
            onClick={() => onThemeSelect(theme)}
            sx={{
              cursor: 'pointer',
              p: 2,
              width: 200,
              border: theme.id === selectedTheme?.id ? '2px solid #1976d2' : '2px solid transparent',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            {/* Theme Preview */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  height: 100,
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header */}
                <Box sx={{
                  height: '30%',
                  bgcolor: theme.colors.headerBg,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1
                }}>
                  <Box sx={{
                    width: '40%',
                    height: 8,
                    bgcolor: theme.colors.accent,
                    borderRadius: 1
                  }} />
                </Box>
                {/* Content */}
                <Box sx={{
                  flex: 1,
                  bgcolor: theme.colors.background,
                  p: 1
                }}>
                  <Box sx={{
                    width: '80%',
                    height: 6,
                    bgcolor: theme.colors.text,
                    borderRadius: 1,
                    mb: 1
                  }} />
                  <Box sx={{
                    width: '60%',
                    height: 6,
                    bgcolor: theme.colors.text,
                    opacity: 0.7,
                    borderRadius: 1
                  }} />
                </Box>
              </Box>
            </Box>
            {/* Theme Name */}
            <Typography variant="subtitle1" align="center">
              {theme.name}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default ThemeSelector;