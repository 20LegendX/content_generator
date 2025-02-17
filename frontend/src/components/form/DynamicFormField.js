import React from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText, Box, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const DynamicFormField = ({ field, formik }) => {
  const commonProps = {
    fullWidth: true,
    id: field.id,
    name: field.id,
    label: field.label,
    value: formik.values[field.id] || '',
    onChange: formik.handleChange,
    error: formik.touched[field.id] && Boolean(formik.errors[field.id]),
    placeholder: field.placeholder,
  };

  // Separate error message from helper text
  const errorMessage = formik.touched[field.id] && formik.errors[field.id];
  const helperText = field.helperText;

  const commonSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.02)',
      },
      '&.Mui-focused': {
        backgroundColor: 'rgba(25, 118, 210, 0.05)',
      }
    },
    '& .MuiInputLabel-root': {
      backgroundColor: 'transparent',
      '&.Mui-focused': {
        color: '#1976d2'
      }
    }
  };

  // Helper text component with improved styling
  const HelperTextComponent = ({ text }) => (
    <Box sx={{ mt: 1, display: 'flex', alignItems: 'start', gap: 1 }}>
      <HelpOutlineIcon sx={{ fontSize: 16, color: 'text.secondary', mt: 0.3 }} />
      <Typography 
        variant="caption" 
        color="text.secondary"
        sx={{ 
          display: 'block',
          lineHeight: 1.4,
          whiteSpace: 'pre-line' // This preserves line breaks in helper text
        }}
      >
        {text}
      </Typography>
    </Box>
  );

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Box>
            <TextField 
              {...commonProps}
              error={Boolean(errorMessage)}
              helperText={errorMessage}
              sx={commonSx}
            />
            {helperText && <HelperTextComponent text={helperText} />}
          </Box>
        );

      case 'textarea':
        return (
          <Box>
            <TextField 
              {...commonProps}
              multiline 
              rows={field.rows || 4}
              error={Boolean(errorMessage)}
              helperText={errorMessage}
              sx={commonSx}
            />
            {helperText && <HelperTextComponent text={helperText} />}
          </Box>
        );

      case 'select':
        return (
          <Box>
            <FormControl 
              fullWidth 
              error={Boolean(errorMessage)}
            >
              <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
              <Select
                labelId={`${field.id}-label`}
                {...commonProps}
                sx={{
                  borderRadius: '12px',
                  '& .MuiSelect-select': {
                    py: 1.5,
                  }
                }}
              >
                {field.options.map(option => (
                  <MenuItem 
                    key={option.value} 
                    value={option.value}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      }
                    }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errorMessage && (
                <FormHelperText error>{errorMessage}</FormHelperText>
              )}
            </FormControl>
            {helperText && <HelperTextComponent text={helperText} />}
          </Box>
        );

      case 'number':
        return (
          <Box>
            <TextField 
              {...commonProps} 
              type="number"
              inputProps={{
                min: 0,  // Prevent negative values
                step: field.id.includes('xg') ? '0.1' : '1', // Allow decimals for xG
              }}
              // Handle the zero value properly
              value={formik.values[field.id] === 0 ? '0' : formik.values[field.id] || ''}
              error={Boolean(errorMessage)}
              helperText={errorMessage}
              sx={commonSx}
            />
            {helperText && <HelperTextComponent text={helperText} />}
          </Box>
        );
      case 'date':
        return (
          <Box>
            <TextField 
              {...commonProps}
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
              error={Boolean(errorMessage)}
              helperText={errorMessage}
              sx={commonSx}
            />
            {helperText && <HelperTextComponent text={helperText} />}
          </Box>
        );
      default:
        return null;
    }
  };

  return renderField();
};

export default DynamicFormField;
