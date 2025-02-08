import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Box,
  Typography,
  Tabs,
  Tab
} from '@mui/material';

export default function ImageInsertDialog({ open, onClose, onInsert }) {
  const [activeTab, setActiveTab] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState('medium');
  const [imagePreview, setImagePreview] = useState(null);

  const handleUrlChange = (url) => {
    setImageUrl(url);
    // Preview the image
    if (url) {
      const img = new Image();
      img.onload = () => setImagePreview(url);
      img.onerror = () => setImagePreview(null);
      img.src = url;
    }
  };

  const handleInsert = () => {
    if (!imageUrl) return;

    const sizeClass = {
      small: 'img-small',
      medium: 'img-medium',
      large: 'img-large'
    }[imageSize];

    onInsert(imageUrl, `align-center ${sizeClass}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Insert Image</DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="URL" />
          {/* Add more tabs for other image sources later */}
        </Tabs>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Image URL"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            helperText="Enter the URL of your image"
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1">Image Size</Typography>
            <RadioGroup
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              row
            >
              <FormControlLabel value="small" control={<Radio />} label="Small (400px)" />
              <FormControlLabel value="medium" control={<Radio />} label="Medium (800px)" />
              <FormControlLabel value="large" control={<Radio />} label="Large (1200px)" />
            </RadioGroup>
          </Box>

          {imagePreview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="subtitle1">Preview</Typography>
              <img
                src={imagePreview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: '300px',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleInsert}
          variant="contained"
          color="primary"
          disabled={!imagePreview}
        >
          Insert Image
        </Button>
      </DialogActions>
    </Dialog>
  );
}