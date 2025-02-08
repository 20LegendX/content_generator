import React, { useState, useMemo, useEffect } from 'react';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import Footer from './components/layout/Footer';
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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TEMPLATE_CONFIGS } from './templates/config';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RouteGuard from './components/Auth/RouteGuard';
import { themes } from './config/themes';  // Import the themes we defined earlier

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
  keywords: '',
  context: '',
  supporting_data: '',
  image_url: '',
  theme: themes && themes.length > 0 ? themes[0] : null, // Add null check
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
  const { session } = useAuth();
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  
  // Modify to only store generated content, not form values
  const [previousContent, setPreviousContent] = useState(null);
  
  // Add the missing state variables
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(true);
  
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

  // Add debug logging for session changes
  useEffect(() => {
    console.log('Session changed:', session);
    
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Current Supabase session:', currentSession);
      
      if (!session && currentSession) {
        console.log('Session mismatch - refreshing auth state');
        // Force a refresh of the auth state
        const { data: { user } } = await supabase.auth.refreshSession();
        if (user) {
          console.log('Session refreshed successfully');
        }
      }
    };

    checkSession();
  }, [session]);

  // Update the initialization effect
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('Init check - current session:', currentSession);
        
        if (currentSession) {
          console.log('Found valid session during init');
          const savedContent = localStorage.getItem('currentGeneratedContent');
          if (savedContent) {
            setGeneratedContent(JSON.parse(savedContent));
            setHasGeneratedContent(true);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError(error.message);
      } finally {
        setIsInitializing(false);
        setAuthLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Save content to localStorage whenever it changes
  useEffect(() => {
    if (generatedContent) {
      localStorage.setItem('currentGeneratedContent', JSON.stringify(generatedContent));
    }
  }, [generatedContent]);

  // Reset form when navigating back
  const handleBackToForm = () => {
    localStorage.removeItem('currentGeneratedContent');
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
      const downloadData = {
        ...generatedContent.raw_content,
        template_name: formik.values.template_name,
        hero_image_position: formik.values.hero_image_position,
        theme: formik.values.theme
      };

      // Add match stats only for match report template
      if (formik.values.template_name === 'ss_match_report_template.html') {
        downloadData.match_stats = {
          possession: {
            home: formik.values.home_possession || 50,
            away: formik.values.away_possession || 50
          },
          shots: {
            home: formik.values.home_shots || 0,
            away: formik.values.away_shots || 0
          },
          shots_on_target: {
            home: formik.values.home_shots_on_target || 0,
            away: formik.values.away_shots_on_target || 0
          },
          corners: {
            home: formik.values.home_corners || 0,
            away: formik.values.away_corners || 0
          },
          fouls: {
            home: formik.values.home_fouls || 0,
            away: formik.values.away_fouls || 0
          },
          yellow_cards: {
            home: formik.values.home_yellow_cards || 0,
            away: formik.values.away_yellow_cards || 0
          },
          red_cards: {
            home: formik.values.home_red_cards || 0,
            away: formik.values.away_red_cards || 0
          },
          offsides: {
            home: formik.values.home_offsides || 0,
            away: formik.values.away_offsides || 0
          },
          xg: {
            home: parseFloat(formik.values.home_xg || 0.0),
            away: parseFloat(formik.values.away_xg || 0.0)
          }
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/download_article`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(downloadData),
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
          template_name: formik.values.template_name,
          content: {
            ...updatedContent,
            theme: formik.values.theme
          },
          theme: formik.values.theme
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
      console.log("Current session:", session); // Debug log
      
      if (!session) {
        throw new Error('No active session');
      }

      console.log("Making API request with token:", session.access_token.substring(0, 10) + "..."); // Debug log first 10 chars

      // Base content object
      const contentData = {
        ...values,
        template_name: values.template_name || 'article_template.html',
        hero_image_position: values.hero_image_position,
        theme: values.theme
      };

      // Add match stats only for match report template
      if (values.template_name === 'ss_match_report_template.html') {
        contentData.match_stats = {
          possession: {
            home: values.home_possession || 50,
            away: values.away_possession || 50
          },
          shots: {
            home: values.home_shots || 0,
            away: values.away_shots || 0
          },
          shots_on_target: {
            home: values.home_shots_on_target || 0,
            away: values.away_shots_on_target || 0
          },
          corners: {
            home: values.home_corners || 0,
            away: values.away_corners || 0
          },
          fouls: {
            home: values.home_fouls || 0,
            away: values.away_fouls || 0
          },
          yellow_cards: {
            home: values.home_yellow_cards || 0,
            away: values.away_yellow_cards || 0
          },
          red_cards: {
            home: values.home_red_cards || 0,
            away: values.away_red_cards || 0
          },
          offsides: {
            home: values.home_offsides || 0,
            away: values.away_offsides || 0
          },
          xg: {
            home: parseFloat(values.home_xg || 0.0),
            away: parseFloat(values.away_xg || 0.0)
          }
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'user-id': session.user.id
        },
        body: JSON.stringify(contentData),
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

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <ThemeProvider theme={theme}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
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

  // Update the sign out handler
  const handleSignOut = async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out successful');
      // Clear any local storage items
      localStorage.removeItem('currentGeneratedContent');
      
      // Force a navigation to clear the state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
                    onClick={handleSignOut}
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
        <div>
          <div className="preview-container">
            <div className="rounded-lg shadow-sm">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route 
                  path="/generate"
                  element={
                    <RouteGuard>
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
                              }}
                            />
                          </Box>
                        </motion.div>
                      )}
                    </RouteGuard>
                  }
                />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
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