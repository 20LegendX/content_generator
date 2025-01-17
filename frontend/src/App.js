import React, { useState, useMemo } from 'react';
import {
  Button,
  Typography,
  Box,
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
import ArticleForm from './components/ArticleForm';
import GeneratedContentModal from './components/GeneratedContentModal';
// Update this constant
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5000`
  : `http://${window.location.hostname}`;

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

// Define the base schema
const baseSchema = Yup.object({
  publisher_name: Yup.string().required('Publisher name is required'),
  publisher_url: Yup.string()
    .url('Invalid URL')
    .required('Publisher URL is required'),
  keywords: Yup.string()
    .max(150, 'Keywords must be 150 characters or less')
    .required('Keywords are required'),
  context: Yup.string().required('Context is required'),
  supporting_data: Yup.string().required('Supporting data is required'),
  image_url: Yup.string().url('Invalid image URL').nullable(),
});

// Define base values
const baseValues = {
  template_name: 'download_template.html',
  publisher_name: '',
  publisher_url: '',
  keywords: '',
  context: '',
  supporting_data: '',
  image_url: '',
};

const getValidationSchema = (templateName) => {
  if (templateName === 'match_report_template.html' || templateName === 'ss_match_report_template.html') {
    return baseSchema.shape({
      home_team: Yup.string()
        .required('Home team is required')
        .max(50, 'Team name too long'),
      away_team: Yup.string()
        .required('Away team is required')
        .max(50, 'Team name too long'),
      home_score: Yup.number()
        .required('Home score is required')
        .min(0, 'Score cannot be negative')
        .integer('Score must be a whole number'),
      away_score: Yup.number()
        .required('Away score is required')
        .min(0, 'Score cannot be negative')
        .integer('Score must be a whole number'),
      home_scorers: Yup.string()
        .matches(
          /^$|^[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?(,\s*[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?)*$/,
          'Invalid format. Example: Rashford (23\'), Bruno (67\') or leave empty'
        )
        .test('matches-score', 'Number of scorers should match team score', function(value) {
          const { home_score } = this.parent;
          if (!value) return true; // Empty value is valid
          const scorersCount = value.split(',').length;
          return scorersCount <= home_score;
        }),
      away_scorers: Yup.string()
        .matches(
          /^$|^[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?(,\s*[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?)*$/,
          'Invalid format. Example: Salah (15\'), Núñez (88\') or leave empty'
        )
        .test('matches-score', 'Number of scorers should match team score', function(value) {
          const { away_score } = this.parent;
          if (!value) return true; // Empty value is valid
          const scorersCount = value.split(',').length;
          return scorersCount <= away_score;
        }),
      competition: Yup.string()
        .required('Competition is required')
        .max(50, 'Competition name too long'),
      match_date: Yup.string()
        .required('Match date is required'),
      venue: Yup.string()
        .required('Venue is required')
        .max(100, 'Venue name too long'),
      // Stats validation
      home_possession: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .max(100, 'Cannot exceed 100%'),
      away_possession: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .max(100, 'Cannot exceed 100%')
        .test('total-100', 'Total possession must equal 100%', function(value) {
          const { home_possession } = this.parent;
          return (home_possession + value) === 100;
        }),
      home_shots: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .integer('Must be a whole number'),
      away_shots: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .integer('Must be a whole number'),
      home_shots_on_target: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .integer('Must be a whole number')
        .max(Yup.ref('home_shots'), 'Cannot exceed total shots'),
      away_shots_on_target: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .integer('Must be a whole number')
        .max(Yup.ref('away_shots'), 'Cannot exceed total shots'),
      // Add similar validation for other stats...
      home_lineup: Yup.string()
        .matches(
          /^$|^(\(\d{1,2}\)\s[A-Za-zÀ-ÿ\s'-]+([\r\n])?)*$/,
          'Invalid format. Use: (number) Player Name'
        ),
      away_lineup: Yup.string()
        .matches(
          /^$|^(\(\d{1,2}\)\s[A-Za-zÀ-ÿ\s'-]+([\r\n])?)*$/,
          'Invalid format. Use: (number) Player Name'
        ),
      home_xg: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .max(10, 'Value too high')
        .test(
          'decimal-places',
          'Maximum 1 decimal place',
          value => !value || String(value).match(/^\d+(\.\d{0,1})?$/)
        ),
      away_xg: Yup.number()
        .required('Required')
        .min(0, 'Cannot be negative')
        .max(10, 'Value too high')
        .test(
          'decimal-places',
          'Maximum 1 decimal place',
          value => !value || String(value).match(/^\d+(\.\d{0,1})?$/)
        ),
      key_events: Yup.string().max(1000, 'Too long'),
    });
  }

  // SS Player Scout Report
  if (templateName === 'ss_player_scout_report_template.html') {
    return baseSchema.shape({
      // The baseSchema requires publisher_name, publisher_url, context, supporting_data, image_url
      player_name: Yup.string()
        .required('Player name is required')
        .max(100, 'Name is too long'),
      player_position: Yup.string()
        .required('Player position is required')
        .max(100, 'Position name too long'),
      player_age: Yup.number()
        .typeError('Age must be a number')
        .positive('Age cannot be negative')
        .integer('Age must be an integer')
        .max(50, 'Unlikely to be older than 50'),
      player_nationality: Yup.string().max(50, 'Nationality name too long'),
      favored_foot: Yup.string().max(50, 'Value too long'),
      scout_stats: Yup.string().max(2000, 'Too long'),
    });
  }

  // Default fallback
  return baseSchema;
};

const getInitialValues = (templateName) => {
  if (templateName === 'match_report_template.html' || templateName === 'ss_match_report_template.html') {
    return {
      ...baseValues,
      home_team: '',
      away_team: '',
      home_score: '0',
      away_score: '0',
      home_scorers: '',
      away_scorers: '',
      home_xg: '0.0',
      away_xg: '0.0',
      home_lineup: '',
      away_lineup: '',
      key_events: '',
      // ... other match-specific initial values
    };
  }
  if (templateName === 'ss_player_scout_report_template.html') {
    return {
      ...baseValues,
      player_name: '',
      player_position: '',
      player_age: '',
      player_nationality: '',
      favored_foot: '',
      scout_stats: ''
    };
  }

  return baseValues;
};

function App() {
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('article_template.html');

  const initialValues = useMemo(() => getInitialValues(templateName), [templateName]);

  const formik = useFormik({
    initialValues,
    validationSchema: getValidationSchema(templateName),
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      setErrorMessage(null);
      setGeneratedContent(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          throw new Error('Failed to generate article. Please try again.');
        }

        const data = await response.json();
        setGeneratedContent(data);
        setIsModalOpen(true);
      } catch (error) {
        setErrorMessage(error.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleTemplateChange = (event) => {
    const newTemplate = event.target.value;
    setTemplateName(newTemplate);
  };

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
      console.log('Downloading with content:', generatedContent);
      const response = await fetch(`${API_BASE_URL}/api/download_article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generatedContent.raw_content,
          template_name: formik.values.template_name,
          headline: generatedContent.raw_content.headline,
          article_content: generatedContent.raw_content.article_content,
          featured_image_url: formik.values.image_url,
          keywords: formik.values.keywords,
          home_team: formik.values.home_team,
          away_team: formik.values.away_team,
          home_score: formik.values.home_score,
          away_score: formik.values.away_score,
          home_scorers: formik.values.home_scorers,
          away_scorers: formik.values.away_scorers,
          competition: formik.values.competition,
          match_date: formik.values.match_date,
          venue: formik.values.venue,
          // Match Statistics
          home_possession: formik.values.home_possession,
          away_possession: formik.values.away_possession,
          home_shots: formik.values.home_shots,
          away_shots: formik.values.away_shots,
          home_shots_on_target: formik.values.home_shots_on_target,
          away_shots_on_target: formik.values.away_shots_on_target,
          home_corners: formik.values.home_corners,
          away_corners: formik.values.away_corners,
          home_fouls: formik.values.home_fouls,
          away_fouls: formik.values.away_fouls,
          home_yellow_cards: formik.values.home_yellow_cards,
          away_yellow_cards: formik.values.away_yellow_cards,
          home_red_cards: formik.values.home_red_cards,
          away_red_cards: formik.values.away_red_cards,
          home_offsides: formik.values.home_offsides,
          away_offsides: formik.values.away_offsides,
          home_lineup: formik.values.home_lineup,
          away_lineup: formik.values.away_lineup,
          key_events: formik.values.key_events,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to download article');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedContent.headline || 'article'}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading article:', error);
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
        <Container maxWidth="xl">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Column */}
                <div>
                  <ArticleForm
                    formik={formik}
                    loading={loading}
                    handleImageChange={handleImageChange}
                    imagePreview={imagePreview}
                  />
                </div>

                {/* Preview Column */}
                <div>
                  {generatedContent ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mt-8 lg:mt-0"
                    >
                      <Paper className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <Typography variant="h6" className="text-gray-800">
                            Preview
                          </Typography>
                        </div>

                        <div 
                          dangerouslySetInnerHTML={{ __html: generatedContent.preview_html }}
                          className="article-preview prose prose-sm max-w-none mb-6"
                        />

                        <div className="flex justify-end gap-4">
                          <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<DownloadIcon />}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            onClick={downloadArticle}
                          >
                            Download Article
                          </Button>
                        </div>
                      </Paper>
                    </motion.div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Generate an article to see the preview
                    </div>
                  )}
                </div>
              </div>
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

      <GeneratedContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={generatedContent}
      />
    </ThemeProvider>
  );
}

export default App;