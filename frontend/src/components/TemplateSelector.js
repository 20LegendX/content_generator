import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  InputAdornment,
  TextField,
  useTheme,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { TEMPLATE_CONFIGS, getAvailableTemplates } from '../templates/config';

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();
  const { subscription } = useSubscription();
  
  // Get available templates based on user and subscription
  const availableTemplates = getAvailableTemplates(session?.user, subscription);

  const categories = ['All', ...new Set(Object.values(availableTemplates).map(t => t.category))];

  // Filter templates based on category and search query
  const filteredTemplates = Object.values(availableTemplates).filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Ensure the default template is selected when component mounts
  useEffect(() => {
    if (!selectedTemplate) {
      onSelect('article_template.html');
    }
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Search Bar */}
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

      {/* Category Tabs */}
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

      {/* Template Cards */}
      <RadioGroup
        value={selectedTemplate || 'article_template.html'}
        onChange={(e) => onSelect(e.target.value)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              value="article_template.html"
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="subtitle1">Standard Article</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Basic article layout for general content. Perfect for news, blogs, and editorial content.
                  </Typography>
                </Box>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: selectedTemplate === template.id ?
                      `2px solid ${theme.palette.primary.main}` :
                      '2px solid transparent',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3
                    },
                    position: 'relative'
                  }}
                  onClick={() => onSelect(template.id)}
                >
                  <FormControlLabel
                    value={template.id}
                    control={
                      <Radio 
                        sx={{ 
                          position: 'absolute',
                          right: 8,
                          top: 8,
                          opacity: selectedTemplate === template.id ? 1 : 0
                        }}
                      />
                    }
                    label=""
                  />
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      {template.icon}
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {template.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </RadioGroup>
    </Box>
  );
}