import React, { useState } from 'react';
import { TextField, Button, CircularProgress, Typography, Alert, Box } from '@mui/material';
import TemplateSelector from './TemplateSelector';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_CONFIGS } from '../templates/config';
import DynamicFormField from './form/DynamicFormField';

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
        <TemplateSelector
          selectedTemplate={formik.values.template_name || 'article_template.html'}
          onSelect={(templateId) => formik.setFieldValue('template_name', templateId)}
        />
        
        {/* Only render fields once */}
        {templateConfig && (
          <div className="space-y-4">
            {renderFields(templateConfig.fields)}
          </div>
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