import React, { useState } from 'react';
import { TextField, Button, CircularProgress, Typography, Alert, Box } from '@mui/material';
import TemplateSelector from './TemplateSelector';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_CONFIGS } from '../templates/config';
import DynamicFormField from './form/DynamicFormField';
import ImagePositionControl from './ImagePositionControl';
import ThemeSelector from './ThemeSelector';
import { 
  InfoOutlined as InfoIcon,
  Article as ArticleIcon,
  Autorenew as AutorenewIcon 
} from '@mui/icons-material';

const ArticleForm = ({ 
  formik, 
  loading, 
  handleImageChange, 
  imagePreview,
  templateName,
  setTemplateName,
  hasGeneratedContent,
  setHasGeneratedContent 
}) => {
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  
  // Guard: if subscription is not available, show a loading indicator.
  if (!subscription) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get template config based on the selected template.
  const templateConfig = TEMPLATE_CONFIGS[formik.values.template_name || 'article_template.html'];

  // Render dynamic fields (handles groups and individual fields).
  const renderFields = (fields) => {
    return fields.map(field => {
      if (field.group) {
        return (
          <div key={field.group} className="space-y-4">
            <h3 className="text-lg font-medium">{field.label}</h3>
            <div className="grid grid-cols-2 gap-4">
              {renderFields(field.fields)}
            </div>
          </div>
        );
      }
      return (
        <DynamicFormField
          key={field.id}
          field={field}
          formik={formik}
        />
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-lg">
        {/* Subscription Alert - Styled as a banner */}
        {subscription.plan_type !== 'pro' && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-3 px-6 rounded-t-2xl flex justify-between items-center">
            <span className="flex items-center gap-2">
              <InfoIcon sx={{ fontSize: 20 }} />
              {subscription.articles_remaining > 0 
                ? `${subscription.articles_remaining} free articles remaining`
                : "You've reached your free article limit"}
            </span>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => navigate('/subscription')}
              sx={{ borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              Upgrade to Pro
            </Button>
          </div>
        )}

        {/* Theme Selector - Now more compact */}
        <ThemeSelector
          selectedTheme={formik.values.theme}
          onThemeSelect={(theme) => formik.setFieldValue('theme', theme)}
        />

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          {/* Template Selection - Visual Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {Object.entries(TEMPLATE_CONFIGS).map(([id, template]) => (
              <div
                key={id}
                onClick={() => formik.setFieldValue('template_name', id)}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 
                  ${formik.values.template_name === id 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-blue-50/50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <ArticleIcon sx={{ color: 'white' }} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Fields - Modern Styling */}
          <div className="grid grid-cols-2 gap-6">
            <DynamicFormField
              field={{
                id: 'article_type',
                type: 'select',
                label: 'Article Type',
                required: true,
                options: [
                  { value: 'general', label: 'General' },
                  { value: 'tech', label: 'Technology' },
                  { value: 'travel', label: 'Travel' },
                  { value: 'sports', label: 'Sports' },
                  { value: 'business', label: 'Business' }
                ]
              }}
              formik={formik}
            />

            {templateConfig && renderFields(templateConfig.fields.filter(field => field.id !== 'article_type'))}
          </div>

          {/* Image Upload Section */}
          <div className="mt-8 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 transition-colors">
            <TextField
              fullWidth
              label="Featured Image URL"
              name="image_url"
              value={formik.values.image_url || ''}
              onChange={(e) => {
                handleImageChange(e);
                formik.handleChange(e);
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
            {imagePreview && (
              <div className="mt-4">
                <ImagePositionControl
                  imageUrl={imagePreview}
                  onPositionChange={(position) => {
                    formik.setFieldValue('hero_image_position', position);
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              py: 2,
              mt: 4,
              borderRadius: '12px',
              background: 'linear-gradient(90deg, #1976d2 0%, #64b5f6 100%)',
              '&:hover': {
                background: 'linear-gradient(90deg, #1565c0 0%, #42a5f5 100%)',
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <span className="flex items-center gap-2">
                <AutorenewIcon /> Generate Article
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ArticleForm;
