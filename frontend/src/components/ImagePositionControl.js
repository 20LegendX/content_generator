import React, { useState } from 'react';
import { Box, Typography, Slider } from '@mui/material';

export default function ImagePositionControl({ imageUrl, onPositionChange }) {
  const [position, setPosition] = useState(50); // 0 = top, 50 = center, 100 = bottom

  const handleChange = (event, newValue) => {
    setPosition(newValue);
    const percentage = newValue + '%';
    onPositionChange(`center ${percentage}`);
  };

  return (
    <Box sx={{ mt: 2, width: '100%' }}>
      <Typography gutterBottom>Image Position</Typography>
      <Box sx={{
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 1,
        border: '1px solid #ccc'
      }}>
        <Box sx={{
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${position}%`,
          transition: 'background-position 0.3s'
        }} />
      </Box>
      <Slider
        value={position}
        onChange={handleChange}
        min={0}
        max={100}
        sx={{ mt: 2 }}
        marks={[
          { value: 0, label: 'Top' },
          { value: 50, label: 'Center' },
          { value: 100, label: 'Bottom' },
        ]}
      />
    </Box>
  );
}