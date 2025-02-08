import React from 'react';
import { Box, Typography, TextField } from '@mui/material';

export default function ThemeEditor({ theme, onThemeChange }) {
  const handleColorChange = (colorType, event) => {
    onThemeChange({
      ...theme,
      [colorType]: event.target.value
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Theme Customization</Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography>Primary Color</Typography>
        <TextField
          type="color"
          value={theme.primary_color}
          onChange={(e) => handleColorChange('primary_color', e)}
          fullWidth
          sx={{ mb: 2 }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography>Background Color</Typography>
        <TextField
          type="color"
          value={theme.background_color}
          onChange={(e) => handleColorChange('background_color', e)}
          fullWidth
          sx={{ mb: 2 }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography>Text Color</Typography>
        <TextField
          type="color"
          value={theme.text_color}
          onChange={(e) => handleColorChange('text_color', e)}
          fullWidth
          sx={{ mb: 2 }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography>Accent Color</Typography>
        <TextField
          type="color"
          value={theme.accent_color}
          onChange={(e) => handleColorChange('accent_color', e)}
          fullWidth
          sx={{ mb: 2 }}
        />
      </Box>
    </Box>
  );
}