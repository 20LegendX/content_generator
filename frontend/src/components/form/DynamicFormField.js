import React from 'react';
import { TextField } from '@mui/material';

const DynamicFormField = ({ field, formik }) => {
  const commonProps = {
    fullWidth: true,
    id: field.id,
    name: field.id,
    label: field.label,
    value: formik.values[field.id],
    onChange: formik.handleChange,
    error: formik.touched[field.id] && Boolean(formik.errors[field.id]),
    helperText: formik.touched[field.id] && formik.errors[field.id],
  };

  switch (field.type) {
    case 'text':
      return <TextField {...commonProps} />;
    case 'textarea':
      return <TextField {...commonProps} multiline rows={field.rows || 4} />;
    case 'number':
      return <TextField {...commonProps} type="number" />;
    default:
      return null;
  }
};

export default DynamicFormField;