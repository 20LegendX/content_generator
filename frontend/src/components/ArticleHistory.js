import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Preview as PreviewIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getUserArticles, deleteArticle } from '../utils/db';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function ArticleHistory({ onPreview, onDownload }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await getUserArticles();
      setArticles(data);
    } catch (err) {
      setError('Failed to load articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        console.log('Delete confirmed for article:', articleId);
        const result = await deleteArticle(articleId);
        console.log('Delete result:', result);
        
        // Only refresh if delete was successful
        if (result) {
          await loadArticles();
          // Add visual feedback
          alert('Article deleted successfully');
        }
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete article: ' + err.message);
        // Add visual feedback
        alert('Failed to delete article. Please try again.');
      }
    }
  };

  if (loading) return <Box>Loading...</Box>;
  if (error) return <Box color="error.main">{error}</Box>;

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Generated Articles History
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Note: Maximum of 5 articles are stored in history. New articles will replace the oldest ones.
      </Typography>
      <List>
        {articles.map((article) => (
          <React.Fragment key={article.id}>
            <ListItem
              secondaryAction={
                <Box>
                  <IconButton onClick={() => onPreview(article)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDownload(article)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(article.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={article.title}
                secondary={format(new Date(article.created_at), 'PPpp')}
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
}