import React, { useState } from 'react';
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
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NewspaperIcon from '@mui/icons-material/Newspaper';

// Template configuration with icons and better categorization
const TEMPLATES = {
  standard: {
    id: 'article_template.html',
    name: 'Standard Article',
    description: 'Basic article layout for general content. Perfect for news, blogs, and editorial content.',
    icon: <ArticleIcon />,
    category: 'General',
    tags: ['basic', 'article', 'blog']
  },
  matchReport: {
    id: 'match_report_template.html',
    name: 'Basic Match Report',
    description: 'Simple match coverage with core statistics. Ideal for quick post-match updates.',
    icon: <SportsSoccerIcon />,
    category: 'Sports',
    tags: ['football', 'match', 'basic']
  },
  enhancedMatch: {
    id: 'ss_match_report_template.html',
    name: 'Enhanced Match Report',
    description: 'Detailed match analysis with advanced statistics. Perfect for in-depth match coverage.',
    icon: <AssessmentIcon />,
    category: 'Sports',
    tags: ['football', 'match', 'advanced', 'stats']
  },
  scoutReport: {
    id: 'ss_player_scout_report_template.html',
    name: 'Player Scout Report',
    description: 'In-depth player analysis and statistics. Ideal for detailed player assessments.',
    icon: <NewspaperIcon />,
    category: 'Sports',
    tags: ['football', 'player', 'analysis']
  }
};

export default function TemplateSelector({ selectedTemplate, onSelect }) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...new Set(Object.values(TEMPLATES).map(t => t.category))];

  // Filter templates based on category and search query
  const filteredTemplates = Object.values(TEMPLATES).filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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
        value={selectedTemplate}
        onChange={(e) => onSelect(e.target.value)}
      >
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
      </RadioGroup>
    </Box>
  );
}