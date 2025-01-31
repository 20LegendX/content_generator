import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  InputAdornment,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { TEMPLATE_CONFIGS, getAvailableTemplates } from '../templates/config';
import ArticleIcon from '@mui/icons-material/Article';

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();
  const { subscription } = useSubscription();
  
  const availableTemplates = getAvailableTemplates(session?.user, subscription);
  const categories = ['All', ...new Set(Object.values(availableTemplates).map(t => t.category))];

  const filteredTemplates = Object.values(availableTemplates).filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (!selectedTemplate) {
      onSelect('article_template.html');
    }
  }, []);

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      <Tabs
        value={selectedCategory}
        onChange={(_, newValue) => setSelectedCategory(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {categories.map(category => (
          <Tab
            key={category}
            label={category}
            value={category}
            sx={{
              minWidth: 'auto',
              textTransform: 'none',
              fontWeight: selectedCategory === category ? 'bold' : 'normal'
            }}
          />
        ))}
      </Tabs>

      <RadioGroup
        value={selectedTemplate || 'article_template.html'}
        onChange={(e) => onSelect(e.target.value)}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredTemplates.map(template => (
            <FormControlLabel
              key={template.id}
              value={template.id}
              control={<Radio />}
              label={
                <Box sx={{ ml: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {template.icon}
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {template.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {template.tags.map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    ))}
                  </Box>
                </Box>
              }
              sx={{
                alignItems: 'flex-start',
                '& .MuiRadio-root': { mt: 1 },
                py: 1,
                px: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                width: '100%',
                margin: 0,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            />
          ))}
        </Box>
      </RadioGroup>
    </Box>
  );
}