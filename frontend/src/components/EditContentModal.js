import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';

export default function EditContentModal({
  open,
  onClose,
  content,
  onSave
}) {
  const [editedContent, setEditedContent] = useState({});

  useEffect(() => {
    if (content?.raw_content) {
      setEditedContent({
        headline: content.raw_content.headline || '',
        article_content: content.raw_content.article_content || '',
        meta_description: content.raw_content.meta_description || '',
        summary: content.raw_content.summary || '',
        ...content.raw_content // Preserve other fields
      });
    }
  }, [content, open]);

  const handleSave = () => {
    const updatedContent = {
      ...content.raw_content,
      ...editedContent
    };
    onSave(updatedContent);
    onClose();
  };

  if (!content) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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

        <div className="editor-container" style={{ marginTop: '16px', marginBottom: '16px' }}>
          <label style={{ marginBottom: '8px', display: 'block' }}>Article Content</label>
          <Editor
            apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
            value={editedContent.article_content || ''}
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | formatselect | ' +
                'bold italic backcolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              entity_encoding: 'raw',
              verify_html: false
            }}
            onEditorChange={(content) => setEditedContent(prev => ({
              ...prev,
              article_content: content
            }))}
          />
        </div>

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
          helperText={`${editedContent.meta_description?.length || 0}/160 characters`}
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