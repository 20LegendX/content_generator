import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';

function App() {
  const [imagePreview, setImagePreview] = useState(null); // State for image preview
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [errorMessage, setErrorMessage] = useState(null); // State for API errors
  const [generatedContent, setGeneratedContent] = useState(null); // State for generated article

  const formik = useFormik({
    initialValues: {
      publisher_name: '',
      publisher_url: '',
      topic: '',
      keywords: '',
      context: '',
      supporting_data: '',
      image_url: '',
    },
    validationSchema: Yup.object({
      publisher_name: Yup.string().required('Publisher name is required'),
      publisher_url: Yup.string()
        .url('Invalid URL')
        .required('Publisher URL is required'),
      topic: Yup.string().required('Topic is required'),
      keywords: Yup.string()
        .max(150, 'Keywords must be 150 characters or less')
        .required('SEO Keywords are required'),
      context: Yup.string().required('Context is required'),
      supporting_data: Yup.string().required('Supporting data is required'),
      image_url: Yup.string()
        .url('Invalid image URL')
        .nullable(), // Allow empty or valid URLs
    }),
    onSubmit: async (values) => {
      setLoading(true); // Show loading indicator
      setErrorMessage(null); // Clear previous errors
      setGeneratedContent(null); // Clear previous results

      try {
        const response = await fetch('http://127.0.0.1:5000/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to generate article. Please try again.');
        }

        const data = await response.json();
        setGeneratedContent(data); // Store the generated content
      } catch (error) {
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false); // Hide loading indicator
      }
    },
  });

  const handleImageChange = (e) => {
    const { value } = e.target;
    formik.setFieldValue('image_url', value);

    if (value) {
      setImagePreview(value);
    } else {
      setImagePreview(null); // Clear preview if input is empty
    }
  };

  const downloadArticle = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/download_article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedContent),
      });

      if (!response.ok) {
        throw new Error('Failed to download article.');
      }

      const blob = await response.blob(); // Convert response to a blob
      const url = window.URL.createObjectURL(blob); // Create a temporary download URL
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedContent.headline.replace(/\s+/g, '_')}.html`; // Use headline as the filename
      a.click();
      window.URL.revokeObjectURL(url); // Clean up the URL
    } catch (error) {
      setErrorMessage('Failed to download article. Please try again.');
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: '#f7f9fc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 700, width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }} align="center">
          AI Article Generator
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Publisher Name"
              name="publisher_name"
              value={formik.values.publisher_name}
              onChange={formik.handleChange}
              error={formik.touched.publisher_name && Boolean(formik.errors.publisher_name)}
              helperText={formik.touched.publisher_name && formik.errors.publisher_name}
              fullWidth
              required
            />
            <TextField
              label="Publisher URL"
              name="publisher_url"
              value={formik.values.publisher_url}
              onChange={formik.handleChange}
              error={formik.touched.publisher_url && Boolean(formik.errors.publisher_url)}
              helperText={formik.touched.publisher_url && formik.errors.publisher_url}
              fullWidth
              required
            />
            <TextField
              label="Topic"
              name="topic"
              value={formik.values.topic}
              onChange={formik.handleChange}
              error={formik.touched.topic && Boolean(formik.errors.topic)}
              helperText={formik.touched.topic && formik.errors.topic}
              fullWidth
              multiline
              rows={3}
              required
            />
            <TextField
              label="SEO Keywords"
              name="keywords"
              value={formik.values.keywords}
              onChange={formik.handleChange}
              error={formik.touched.keywords && Boolean(formik.errors.keywords)}
              helperText={
                formik.touched.keywords
                  ? formik.errors.keywords
                  : `${formik.values.keywords.length}/150 characters`
              }
              fullWidth
              required
            />
            <TextField
              label="Context"
              name="context"
              value={formik.values.context}
              onChange={formik.handleChange}
              error={formik.touched.context && Boolean(formik.errors.context)}
              helperText={formik.touched.context && formik.errors.context}
              fullWidth
              multiline
              rows={4}
              required
            />
            <TextField
              label="Supporting Data"
              name="supporting_data"
              value={formik.values.supporting_data}
              onChange={formik.handleChange}
              error={formik.touched.supporting_data && Boolean(formik.errors.supporting_data)}
              helperText={formik.touched.supporting_data && formik.errors.supporting_data}
              fullWidth
              multiline
              rows={4}
              required
            />
            <TextField
              label="Image URL"
              name="image_url"
              value={formik.values.image_url}
              onChange={handleImageChange}
              error={formik.touched.image_url && Boolean(formik.errors.image_url)}
              helperText={formik.touched.image_url && formik.errors.image_url}
              fullWidth
            />
            {imagePreview && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ marginTop: '10px' }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'cover',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  }}
                  onError={() => setImagePreview(null)}
                />
              </motion.div>
            )}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Generate Article
              </Button>
            )}
          </Box>
        </form>

        {generatedContent && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Generated Article
            </Typography>
            <Typography variant="subtitle1">
              <strong>Headline:</strong> {generatedContent.headline}
            </Typography>
            <div dangerouslySetInnerHTML={{ __html: generatedContent.article_content }} />
            <Button
              variant="contained"
              color="secondary"
              sx={{ mt: 2 }}
              onClick={downloadArticle}
            >
              Download Article
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default App;
