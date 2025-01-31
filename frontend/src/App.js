import React, { useState, useMemo, useEffect } from 'react';
import {
  Button,
  Typography,
  Box,
  Paper,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
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
import EditIcon from '@mui/icons-material/Edit';
import EditContentModal from './components/EditContentModal';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Auth from './components/Auth/Auth';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { upsertUser } from './utils/db';
import LandingPage from './components/pages/LandingPage';
import AuthCallback from './components/Auth/AuthCallback';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Dashboard from './components/layout/Dashboard';
import { supabase } from './lib/supabase';  // Updated import path
import { SubscriptionProvider, useSubscription } from './contexts/SubscriptionContext';
import SubscriptionManager from './components/subscription/SubscriptionManager';
import SubscriptionSuccess from './components/subscription/SubscriptionSuccess';
import SubscriptionCancel from './components/subscription/SubscriptionCancel';
import SubscriptionStatus from './components/subscription/SubscriptionStatus';
import UpgradePrompt from './components/subscription/UpgradePrompt';
import { AuthProvider } from './contexts/AuthContext';
import { TEMPLATE_CONFIGS } from './templates/config';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Fix: Update to use the same protocol as the current page
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:5001`
  : `${window.location.protocol}//${window.location.hostname}`;  // Use current protocol

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
  article_type: Yup.string().required('Article type is required'),
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
  article_type: 'general',
  template_name: 'article_template.html',
  publisher_name: '',
  publisher_url: '',
  keywords: '',
  context: '',
  supporting_data: '',
  image_url: '',
};

const getValidationSchema = (templateName) => {
  const template = TEMPLATE_CONFIGS[templateName];
  if (!template) return null;

  const schemaFields = {};
  const processFields = (fields) => {
    fields.forEach(field => {
      if (field.group) {
        processFields(field.fields);
      } else if (field.validation) {
        schemaFields[field.id] = field.validation;
      }
    });
  };

  processFields(template.fields);
  return Yup.object(schemaFields);
};

const getInitialValues = (templateName) => {
  return TEMPLATE_CONFIGS[templateName]?.initialValues || {};
};

function AppContent() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Modify to only store generated content, not form values
  const [previousContent, setPreviousContent] = useState(null);
  
  // Add the missing state variables
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  
  const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);
  const { 
    subscription, 
    canGenerateArticle, 
    decrementArticleCount,
    refreshSubscription
  } = useSubscription();

  // Set default template name
  const DEFAULT_TEMPLATE = 'article_template.html';
  const [templateName, setTemplateName] = useState(DEFAULT_TEMPLATE);

  // Initialize formik with the default template
  const formik = useFormik({
    initialValues: {
      ...baseValues,
      ...getInitialValues(templateName)
    },
    validationSchema: getValidationSchema(templateName),
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (hasGeneratedContent) {
        setShowRegenerateConfirm(true);
        return;
      }
      await generateContent(values);
    }
  });

  // Reset form when navigating back
  const handleBackToForm = () => {
    setPreviousContent(generatedContent);
    setGeneratedContent(null);
    formik.resetForm();
    setTemplateName(DEFAULT_TEMPLATE);
  };

  // Restore only the generated content
  const handleRestoreContent = () => {
    if (previousContent) {
      setGeneratedContent(previousContent);
    }
  };

  // Reset everything when navigating away
  useEffect(() => {
    return () => {
      setGeneratedContent(null);
      setPreviousContent(null);
      formik.resetForm();
      setTemplateName(DEFAULT_TEMPLATE);
    };
  }, []);

  const handleTemplateChange = (event) => {
    const newTemplate = event.target.value;
    setTemplateName(newTemplate);
    
    // Reset form with new template's initial values
    formik.resetForm({
      values: {
        ...baseValues,
        ...getInitialValues(newTemplate),
        template_name: newTemplate
      }
    });
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

  const handleContentEdit = async (updatedContent) => {
    try {
      console.log("Debug - Making template render request with:", {
        template_name: formik.values.template_name,
        content: updatedContent
      });

      const response = await fetch(`${API_BASE_URL}/api/render-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          template_name: formik.values.template_name || 'article_template.html', // Add default
          content: updatedContent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Debug - API Error:", errorData);
        throw new Error(errorData.error || 'Failed to update preview');
      }

      const data = await response.json();
      console.log("Debug - Received preview response:", data);
      
      setGeneratedContent({
        ...generatedContent,
        raw_content: updatedContent,
        preview_html: data.preview_html
      });
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating preview:', error);
      alert('Failed to update preview. Please try again.');
    }
  };

  const generateContent = async (values) => {
    setLoading(true);
    setErrorMessage(null);
    
    if (!canGenerateArticle()) {
      setErrorMessage('You have reached your article limit. Please upgrade to Pro to continue.');
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session); // Debug log
      
      if (!session) {
        throw new Error('No active session');
      }

      console.log("Making API request with token:", session.access_token.substring(0, 10) + "..."); // Debug log first 10 chars

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'user-id': session.user.id
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData); // Debug log
        throw new Error(errorData.error || 'Failed to generate article');
      }

      const data = await response.json();
      setGeneratedContent(data);
      setHasGeneratedContent(true);
      
      // Decrement the article count for both free and pro users
      await decrementArticleCount();
      
      // Refresh subscription to update article count
      await refreshSubscription();
    } catch (error) {
      setErrorMessage(error.message);
      console.error('Generate content error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setShowRegenerateConfirm(false);
    await generateContent(formik.values);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = async (user) => {
    try {
      const userData = {
        id: user.id,
        email: user.email,
        provider: user.app_metadata.provider || 'email',
      };
      await upsertUser(userData);
    } catch (error) {
      console.error('Error handling user:', error);
      // You might want to show an error message to the user
    }
  };

  // Show error if session check fails
  if (authError) {
    return (
      <ThemeProvider theme={theme}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <div style={{ color: 'red', marginBottom: '1rem' }}>Error checking auth: {authError}</div>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </ThemeProvider>
    );
  }

  // Only show loading during initial auth check
  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
          <CircularProgress />
          <div style={{ marginTop: '1rem' }}>Checking authentication...</div>
        </div>
      </ThemeProvider>
    );
  }

  // Pass the default template to ArticleForm
  const renderArticleForm = () => {
    return (
      <>
        {previousContent && (
          <Box sx={{ mb: 4 }}>
            <Alert 
              severity="info"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRestoreContent}
                >
                  View Generated Content
                </Button>
              }
            >
              You have a previously generated article. Would you like to view it?
            </Alert>
          </Box>
        )}
        <ArticleForm
          formik={formik}
          loading={loading}
          handleImageChange={handleImageChange}
          imagePreview={imagePreview}
          templateName={templateName}
          setTemplateName={setTemplateName}
          hasGeneratedContent={hasGeneratedContent}
          setHasGeneratedContent={setHasGeneratedContent}
          defaultTemplate={DEFAULT_TEMPLATE}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#fef6e4] dark:bg-gray-900">
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <div 
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => navigate('/')}
              >
                <ArticleIcon 
                  className="h-6 w-6 text-blue-600 dark:text-blue-500" 
                />
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent text-xl font-bold">
                  PageCrafter AI
                </span>
              </div>
            </div>

            {/* Navigation and Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {session ? (
                <>
                  <button
                    onClick={() => {
                      if (subscription?.plan_type !== 'pro' && subscription?.articles_remaining === 0) {
                        navigate('/subscription');
                      } else {
                        navigate('/generate');
                      }
                    }}
                    className="hidden sm:flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 
                             hover:bg-blue-700 rounded-lg transition-colors duration-200"
                  >
                    <ArticleIcon className="w-4 h-4 mr-2" />
                    Generate Content
                  </button>

                  <div className="hidden sm:block">
                    <SubscriptionStatus />
                  </div>

                  {/* Profile Dropdown - You might want to add this later */}
                  <Button
                    onClick={() => {
                      supabase.auth.signOut();
                      navigate('/');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                             hover:text-gray-900 dark:hover:text-white rounded-lg 
                             hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 
                           hover:bg-blue-700 rounded-lg transition-colors duration-200"
                >
                  Sign In
                </button>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white 
                         rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Brightness7Icon className="h-5 w-5" />
                ) : (
                  <Brightness4Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route 
              path="/generate"
              element={
                !session ? (
                  <Navigate to="/login" replace />
                ) : subscription?.plan_type !== 'pro' && 
                    subscription?.articles_remaining === 0 && 
                    !generatedContent ? (
                  <UpgradePrompt />
                ) : (
                  <>
                    {!generatedContent ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {renderArticleForm()}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Box sx={{ mb: 3 }}>
                          {subscription?.plan_type !== 'pro' && 
                           subscription?.articles_remaining === 0 && (
                            <Alert 
                              severity="warning" 
                              sx={{ mb: 2 }}
                              action={
                                <Button
                                  color="inherit"
                                  size="small"
                                  onClick={() => navigate('/subscription')}
                                >
                                  Upgrade to Pro
                                </Button>
                              }
                            >
                              This was your last free article. Upgrade to Pro to generate more articles.
                            </Alert>
                          )}
                          <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handleBackToForm}
                            sx={{ mb: 2 }}
                          >
                            Back to Form
                          </Button>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5">Preview</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                                onClick={() => setEditModalOpen(true)}
                              >
                                Edit Content
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<DownloadIcon />}
                                onClick={downloadArticle}
                              >
                                Download Article
                              </Button>
                            </Box>
                          </Box>
                          <div 
                            dangerouslySetInnerHTML={{ __html: generatedContent.preview_html }}
                            style={{ 
                              width: '100%',
                              maxWidth: '100%',
                              margin: '0 auto',
                              backgroundColor: 'transparent !important',
                            }}
                            className="preview-content"
                          />
                        </Box>
                      </motion.div>
                    )}
                  </>
                )
              }
            />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route 
              path="/subscription" 
              element={
                <ProtectedRoute>
                  <SubscriptionManager />
                </ProtectedRoute>
              } 
            />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <EditContentModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        content={generatedContent}
        onSave={handleContentEdit}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SubscriptionProvider>
          <AppContent />
        </SubscriptionProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;