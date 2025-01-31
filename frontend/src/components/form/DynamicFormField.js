import React from 'react';
import { TextField, Select, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';

const DynamicFormField = ({ field, formik }) => {
  const commonProps = {
    fullWidth: true,
    id: field.id,
    name: field.id,
    label: field.label,
    value: formik.values[field.id] || '',
    onChange: formik.handleChange,
    error: formik.touched[field.id] && Boolean(formik.errors[field.id]),
    helperText: (formik.touched[field.id] && formik.errors[field.id]) || field.helperText,
  };

  switch (field.type) {
    case 'text':
      return (
        <TextField 
          {...commonProps}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
            '& .MuiInputLabel-root': {
              backgroundColor: 'white',
              px: 0.5,
            }
          }}
        />
      );
    case 'textarea':
      return (
        <TextField 
          {...commonProps} 
          multiline 
          rows={field.rows || 4}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
            '& .MuiInputLabel-root': {
              backgroundColor: 'white',
              px: 0.5,
            }
          }}
        />
      );
    case 'number':
      return (
        <TextField 
          {...commonProps} 
          type="number"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            },
            '& .MuiInputLabel-root': {
              backgroundColor: 'white',
              px: 0.5,
            }
          }}
        />
      );
    case 'select':
      return (
        <FormControl 
          fullWidth 
          error={commonProps.error}
          sx={{ mb: 2 }}
        >
          <InputLabel 
            id={`${field.id}-label`}
            sx={{ 
              backgroundColor: 'white',
              px: 0.5,
              '&.MuiInputLabel-shrink': {
                backgroundColor: 'white',
              }
            }}
          >
            {field.label}
          </InputLabel>
          <Select
            labelId={`${field.id}-label`}
            {...commonProps}
            sx={{
              borderRadius: '8px',
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
          <FormHelperText sx={{ mx: 1 }}>
            {commonProps.helperText}
          </FormHelperText>
        </FormControl>
      );
    default:
      return null;
  }
};

export default DynamicFormField;
