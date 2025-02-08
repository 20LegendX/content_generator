import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { Editor } from '@tinymce/tinymce-react';
import ImageInsertDialog from './ImageInsertDialog';
import LinkInsertDialog from './LinkInsertDialog';

export default function EditContentModal({
  open,
  onClose,
  content,
  onSave
}) {
  const [editedContent, setEditedContent] = useState({});
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef(null);

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

  const handleLinkDialog = (editor) => {
    const selected = editor.selection.getContent({ format: 'text' });
    if (selected) {
      setSelectedText(selected);
      setLinkDialogOpen(true);
    } else {
      editor.notificationManager.open({
        text: 'Please select some text first',
        type: 'info'
      });
    }
  };

  if (!content) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>Edit Generated Content</DialogTitle>
      <DialogContent sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: 3
      }}>
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

        <div className="editor-container" style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <label style={{ marginBottom: '8px', display: 'block' }}>Article Content</label>
          <Editor
            apiKey={process.env.REACT_APP_TINYMCE_API_KEY}
            value={editedContent.article_content || ''}
            onInit={(evt, editor) => editorRef.current = editor}
            init={{
              height: '100%',
              min_height: 500,
              menubar: true,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                'quickbars', 'styleselect'
              ],
              
              toolbar: [
                'styles | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright | customLink customImage',
                'heading | blockquote | bullist numlist | removeformat | help'
              ].join(' | '),
              
              link_target_list: [
                { title: 'None', value: '' },
                { title: 'New window', value: '_blank' }
              ],
              
              link_dialog_type: 'modal',
              link_assume_external_targets: false,
              
              custom_elements: '',
              
              valid_elements: '*[*]',
              extended_valid_elements: 'a[href|target|rel|title|class]',
              
              link_title: false,
              link_context_toolbar: true,
              default_link_target: '_blank',
              
              link_quicklink: false,
              
              quickbars_selection_toolbar: 'bold italic | h2 h3 | blockquote customlink',
              
              convert_urls: false,
              relative_urls: false,
              remove_script_host: false,
              
              style_formats: [
                { title: 'Paragraph', format: 'p' },
                { title: 'Main Heading', format: 'h1' },
                { title: 'Subheading', format: 'h2' },
                { title: 'Section Heading', format: 'h3' },
                { title: 'Small Heading', format: 'h4' },
                { title: 'Quote', format: 'blockquote' }
              ],
              
              block_formats: 'Paragraph=p; Main Heading=h1; Subheading=h2; Section Heading=h3; Small Heading=h4; Quote=blockquote',
              
              visualblocks_default_state: true,
              
              content_style: `
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  line-height: 1.6;
                  max-width: 900px;
                  margin: 0 auto;
                  padding: 1rem;
                }
                h1 {
                  font-size: 2.5em;
                  margin-bottom: 1em;
                  color: #2c3e50;
                }
                h2 {
                  font-size: 2em;
                  margin-top: 1.5em;
                  margin-bottom: 0.75em;
                  color: #34495e;
                }
                h3 {
                  font-size: 1.5em;
                  margin-top: 1.2em;
                  margin-bottom: 0.6em;
                  color: #445566;
                }
                p {
                  margin-bottom: 1em;
                }
                blockquote {
                  border-left: 4px solid #e5e7eb;
                  margin: 1.5em 0;
                  padding: 0.5em 1em;
                  background: #f8f9fa;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  display: block;
                  margin: 1.5em auto;
                }
                .img-small { max-width: 400px !important; }
                .img-medium { max-width: 800px !important; }
                .img-large { max-width: 1200px !important; }
                a {
                  color: #2563eb;
                  text-decoration: underline;
                  cursor: pointer;
                }
                a:hover {
                  color: #1d4ed8;
                }
              `,
              
              formats: {
                alignleft: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'align-left' },
                aligncenter: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'align-center' },
                alignright: { selector: 'p,h1,h2,h3,h4,h5,h6,td,th,div,ul,ol,li,table,img', classes: 'align-right' },
              },
              
              elementpath: true,
              
              autolink: true,
              
              browser_spellcheck: true,
              
              paste_as_text: false,
              
              branding: false,
              
              setup: (editor) => {
                editor.ui.registry.addButton('customLink', {
                  icon: 'link',
                  tooltip: 'Insert Link',
                  onAction: () => handleLinkDialog(editor)
                });

                editor.ui.registry.addButton('customImage', {
                  icon: 'image',
                  tooltip: 'Insert Image',
                  onAction: () => setImageDialogOpen(true)
                });

                editor.ui.registry.addMenuItem('customlink', {
                  icon: 'link',
                  text: 'Insert/Edit Link',
                  onAction: () => handleLinkDialog(editor)
                });

                editor.addShortcut('Meta+K', 'Insert link', () => handleLinkDialog(editor));
              },
              
              image_advtab: false,
              
              file_picker_callback: undefined,
              
              quickbars_insert_toolbar: false,
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
      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Update Preview
        </Button>
      </DialogActions>

      <LinkInsertDialog
        open={linkDialogOpen}
        onClose={() => {
          setLinkDialogOpen(false);
          setSelectedText('');
        }}
        selectedText={selectedText}
        onInsert={(url, text, target) => {
          if (editorRef.current) {
            const linkText = selectedText || text;
            editorRef.current.insertContent(
              `<a href="${url}" target="${target}"${target === '_blank' ? ' rel="noopener noreferrer"' : ''}>${linkText}</a>`
            );
            setLinkDialogOpen(false);
            setSelectedText('');
          }
        }}
      />

      <ImageInsertDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={(url, className) => {
          if (editorRef.current) {
            editorRef.current.insertContent(`
              <img src="${url}" 
                   class="${className}"
                   alt=""
                   style="display: block; margin: 1em auto;"
              />
            `);
            setImageDialogOpen(false);
          }
        }}
      />
    </Dialog>
  );
}