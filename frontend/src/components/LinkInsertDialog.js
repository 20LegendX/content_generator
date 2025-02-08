import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

export default function LinkInsertDialog({ open, onClose, onInsert, selectedText }) {
  const [linkData, setLinkData] = useState({
    url: '',
    text: '',
    target: '_self'
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setLinkData({
        url: '',
        text: selectedText || '', // Initialize with selected text
        target: '_self'
      });
    }
  }, [open, selectedText]);

  const handleInsert = () => {
    onInsert(linkData.url, selectedText || linkData.text, linkData.target);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Insert Link</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {selectedText && (
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Adding link to: "{selectedText}"
          </Typography>
        )}
        <TextField
          fullWidth
          label="URL"
          value={linkData.url}
          onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
          margin="normal"
          placeholder="https://"
          autoFocus
        />
        {!selectedText && (
          <TextField
            fullWidth
            label="Text to display"
            value={linkData.text}
            onChange={(e) => setLinkData(prev => ({ ...prev, text: e.target.value }))}
            margin="normal"
            required
          />
        )}
        <FormControl fullWidth margin="normal">
          <InputLabel>Open link in</InputLabel>
          <Select
            value={linkData.target}
            onChange={(e) => setLinkData(prev => ({ ...prev, target: e.target.value }))}
            label="Open link in"
          >
            <MenuItem value="_self">Same window</MenuItem>
            <MenuItem value="_blank">New window</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleInsert}
          variant="contained" 
          disabled={!linkData.url || (!selectedText && !linkData.text)}
        >
          Insert Link
        </Button>
      </DialogActions>
    </Dialog>
  );
}