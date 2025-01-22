import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';

export default function EditContentModal({
  open,
  onClose,
  content,
  onSave
}) {
  const [editedContent, setEditedContent] = useState({});

  useEffect(() => {
    if (content?.raw_content) {
      // Initialize with the raw content
      setEditedContent({
        headline: content.raw_content.headline || '',
        article_content: content.raw_content.article_content || '',
        meta_description: content.raw_content.meta_description || '',
        summary: content.raw_content.summary || '' // For scout reports
      });
    }
  }, [content, open]);

  const handleSave = () => {
    // Preserve other content fields and only update the edited ones
    const updatedContent = {
      ...content.raw_content,
      ...editedContent
    };
    onSave(updatedContent);
    onClose();
  };

  if (!content) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Generated Content</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          rows={2}
          margin="normal"
          label="Headline"
          value={editedContent.headline || ''}
          onChange={(e) => setEditedContent(prev => ({
            ...prev,
            headline: e.target.value
          }))}
        />
        
        {editedContent.summary && (
          <TextField
            fullWidth
            multiline
            rows={3}
            margin="normal"
            label="Summary"
            value={editedContent.summary || ''}
            onChange={(e) => setEditedContent(prev => ({
              ...prev,
              summary: e.target.value
            }))}
          />
        )}

        <TextField
          fullWidth
          multiline
          rows={8}
          margin="normal"
          label="Article Content"
          value={editedContent.article_content || ''}
          onChange={(e) => setEditedContent(prev => ({
            ...prev,
            article_content: e.target.value
          }))}
        />

        <TextField
          fullWidth
          multiline
          rows={2}
          margin="normal"
          label="Meta Description"
          value={editedContent.meta_description || ''}
          onChange={(e) => setEditedContent(prev => ({
            ...prev,
            meta_description: e.target.value
          }))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Update Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
}