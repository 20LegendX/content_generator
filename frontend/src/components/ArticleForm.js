import React, { useState } from 'react';
import { TextField, Button, CircularProgress, Typography, Alert, Box } from '@mui/material';
import TemplateSelector from './TemplateSelector';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_CONFIGS } from '../templates/config';
import DynamicFormField from './form/DynamicFormField';
import ImagePositionControl from './ImagePositionControl';
import ThemeSelector from './ThemeSelector';

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
  
  // Get template config only once based on the selected template
  const templateConfig = TEMPLATE_CONFIGS[formik.values.template_name || 'article_template.html'];

  // Single render of fields
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
    <div className="max-w-3xl mx-auto">
      <Typography variant="h4" sx={{ mb: 4 }}>Create New Article</Typography>
      
      {subscription?.plan_type !== 'pro' && (
        <Box sx={{ mb: 3 }}>
          <Alert 
            severity={subscription.articles_remaining <= 1 ? "warning" : "info"}
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
            {subscription.articles_remaining > 0 ? (
              `You have ${subscription.articles_remaining} free article${subscription.articles_remaining === 1 ? '' : 's'} remaining`
            ) : (
              "You've reached your free article limit"
            )}
          </Alert>
        </Box>
      )}
      
      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <ThemeSelector
          selectedTheme={formik.values.theme}
          onThemeSelect={(theme) => formik.setFieldValue('theme', theme)}
        />
        
        <TemplateSelector
          selectedTemplate={formik.values.template_name || 'article_template.html'}
          onSelect={(templateId) => formik.setFieldValue('template_name', templateId)}
        />
        
        {/* Article Type field - always present */}
        <DynamicFormField 
          key="article_type"
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
        
        {/* Template-specific fields */}
        {templateConfig && (
          <div className="space-y-4">
            {renderFields(templateConfig.fields.filter(field => field.id !== 'article_type'))}
          </div>
        )}

        {/* Image URL Field */}
        <TextField
          fullWidth
          label="Featured Image URL"
          name="image_url"
          value={formik.values.image_url || ''}
          onChange={(e) => {
            handleImageChange(e);
            formik.handleChange(e);
          }}
          error={formik.touched.image_url && Boolean(formik.errors.image_url)}
          helperText={formik.touched.image_url && formik.errors.image_url}
        />

        {imagePreview && (
          <ImagePositionControl
            imageUrl={imagePreview}
            onPositionChange={(position) => {
              formik.setFieldValue('hero_image_position', position);
            }}
          />
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          className="mt-4"
          size="large"
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Article'}
        </Button>
      </form>
    </div>
  );
}

export default ArticleForm;