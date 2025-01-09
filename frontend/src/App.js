import React, { useState, useMemo } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Container,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import '@fontsource/roboto';
import DownloadIcon from '@mui/icons-material/Download';
import ArticleIcon from '@mui/icons-material/Article';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://127.0.0.1:5000'
  : `http://13.60.61.227`; // Your EC2 IP

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#ff4081',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [imagePreview, setImagePreview] = useState(null); // State for image preview
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [errorMessage, setErrorMessage] = useState(null); // State for API errors
  const [generatedContent, setGeneratedContent] = useState(null); // State for generated article
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

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

    // Then update your onSubmit function:
    onSubmit: async (values) => {
      setLoading(true);
      setErrorMessage(null);
      setGeneratedContent(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to generate article. Please try again.');
        }

        const data = await response.json();
        setGeneratedContent(data);
      } catch (error) {
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
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
      const response = await fetch(`${API_BASE_URL}/api/download_article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatedContent),
      });

      if (!response.ok) {
        throw new Error('Failed to download article.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedContent.headline.replace(/\s+/g, '_')}.html`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setErrorMessage('Failed to download article. Please try again.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <ArticleIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Article Generator
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setDarkMode(!darkMode)}
            sx={{ ml: 1 }}
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          backgroundColor: '#f4f6f8',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 3,
        }}
      >
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={3}
              sx={{
                padding: 4,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              <form onSubmit={formik.handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.keys(formik.values)
                    .filter(fieldName => fieldName !== 'image_url')
                    .map((fieldName, index) => (
                    <motion.div
                      key={fieldName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <TextField
                        label={fieldName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        name={fieldName}
                        value={formik.values[fieldName]}
                        onChange={formik.handleChange}
                        error={formik.touched[fieldName] && Boolean(formik.errors[fieldName])}
                        helperText={formik.touched[fieldName] && formik.errors[fieldName]}
                        fullWidth
                        required
                        multiline={['topic', 'context', 'supporting_data'].includes(fieldName)}
                        rows={['topic', 'context', 'supporting_data'].includes(fieldName) ? 4 : 1}
                      />
                    </motion.div>
                  ))}

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
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<ArticleIcon />}
                      sx={{
                        height: 48,
                        fontWeight: 600,
                        ':hover': {
                          backgroundColor: '#005bb5',
                        },
                        boxShadow: '0 4px 12px rgba(25,118,210,0.4)',
                      }}
                    >
                      Generate Article
                    </Button>
                  )}
                </Box>
              </form>

              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Paper sx={{
                    mt: 4,
                    p: 3,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}>
                    <Typography variant="h5" gutterBottom color="primary">
                      Generated Article
                    </Typography>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      <strong>Headline:</strong> {generatedContent.headline}
                    </Typography>
                    <div
                      dangerouslySetInnerHTML={{ __html: generatedContent.article_content }}
                      style={{
                        lineHeight: '1.6',
                        fontSize: '1rem',
                        color: '#2c3e50',
                      }}
                    />
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<DownloadIcon />}
                      sx={{
                        mt: 2,
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(255,64,129,0.4)',
                      }}
                      onClick={downloadArticle}
                    >
                      Download Article
                    </Button>
                  </Paper>
                </motion.div>
              )}
            </Paper>
          </motion.div>
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{
          mt: 4,
          py: 3,
          textAlign: 'center',
          backgroundColor: '#f7f9fc',
          borderTop: '1px solid',
          borderColor: 'grey.200'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2024 AI Article Generator. All rights reserved.
        </Typography>
      </Box>
    </ThemeProvider>
  );
}

export default App;