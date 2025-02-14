import ArticleIcon from '@mui/icons-material/Article';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import * as Yup from 'yup';

// Add your user ID here (you can get it from Supabase dashboard)
const ADMIN_USER_ID = '12433647-22de-4af6-b457-2fedf3084770';

export const ARTICLE_TYPES = {
  GENERAL: 'general',
  TECH: 'tech',
  TRAVEL: 'travel',
  SPORTS: 'sports',
  BUSINESS: 'business'
};

export const TEMPLATE_CONFIGS = {
  'article_template.html': {
    id: 'article_template.html',
    name: 'Standard Article',
    icon: <ArticleIcon />,
    description: 'Basic article layout for general content. Perfect for news, blogs, and editorial content.',
    category: 'General',
    tags: ['basic', 'article', 'blog'],
    access: {
      type: 'all' // Available to everyone
    },
    initialValues: {
      article_type: 'general',
      publisher_name: '',
      topic: '',
      keywords: '',
      context: '',
      supporting_data: '',
      image_url: '',
    },
    fields: [
      {
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
        ],
        validation: Yup.string().required('Article type is required')
      },
      {
        id: 'publisher_name',
        type: 'text',
        label: 'Publisher Name',
        required: true,
        validation: Yup.string().required('Publisher name is required'),
        helperText: 'Name of the publishing organization - will be used in meta tags'
      },
      {
        id: 'topic',
        type: 'text',
        label: 'Topic',
        required: true,
        validation: Yup.string().required('Topic is required'),
        helperText: 'The main subject of your article - this will guide the AI in focusing the content and maintaining relevance throughout'
      },
      {
        id: 'keywords',
        type: 'text',
        label: 'Keywords',
        required: true,
        validation: Yup.string().max(150, 'Keywords must be 150 characters or less').required('Keywords are required'),
        helperText: 'Comma-separated terms that the AI will naturally incorporate into the article to improve relevance and SEO - also used in meta tags'
      },
      {
        id: 'context',
        type: 'textarea',
        label: 'Additional Context',
        rows: 4,
        required: true,
        validation: Yup.string().required('Context is required'),
        helperText: 'Background information that helps the AI understand the topic better. Include relevant history, current situation, and specific angles you want covered. The more context you provide, the less generic your article will be'
      },
      {
        id: 'supporting_data',
        type: 'textarea',
        label: 'Supporting Data',
        rows: 4,
        required: true,
        validation: Yup.string().required('Supporting data is required'),
        helperText: `Include specific facts, figures, and quotes that should appear in the article. The AI will:
• Weave these naturally into the narrative
• Use them to support key points
• Maintain factual accuracy
• Create a more authoritative article`,
        placeholder: `Example:
• Market size: $5.2B in 2023
• Growth rate: 12.3% YoY
• Key player quote: "Innovation drives our industry forward"
• Recent study: 67% of users prefer...`
      },
    ]
  },
  'ss_article_template.html': {
    id: 'ss_article_template.html',
    name: 'SS Article',
    icon: <ArticleIcon />,
    description: 'Tailored article layout for SS content. Perfect for news, blogs, and editorial content.',
    category: 'General',
    tags: ['basic', 'article', 'blog', 'ss'],
    access: {
      type: 'restricted',
      conditions: {
        userId: [ADMIN_USER_ID],
        planType: ['pro']
      }
    },
    initialValues: {
      article_type: 'general',
      publisher_name: '',
      topic: '',
      keywords: '',
      context: '',
      supporting_data: '',
      image_url: '',
    },
    fields: [
      {
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
        ],
        validation: Yup.string().required('Article type is required')
      },
      {
        id: 'publisher_name',
        type: 'text',
        label: 'Publisher Name',
        required: true,
        validation: Yup.string().required('Publisher name is required'),
        helperText: 'Name of the publishing organization - will be used in meta tags'
      },
      {
        id: 'topic',
        type: 'text',
        label: 'Topic',
        required: true,
        validation: Yup.string().required('Topic is required'),
        helperText: 'The main subject of your article - this will guide the AI in focusing the content and maintaining relevance throughout'
      },
      {
        id: 'keywords',
        type: 'text',
        label: 'Keywords',
        required: true,
        validation: Yup.string().max(150, 'Keywords must be 150 characters or less').required('Keywords are required'),
        helperText: 'Comma-separated terms that the AI will naturally incorporate into the article to improve relevance and SEO - also used in meta tags'
      },
      {
        id: 'context',
        type: 'textarea',
        label: 'Additional Context',
        rows: 4,
        required: true,
        validation: Yup.string().required('Context is required'),
        helperText: 'Background information that helps the AI understand the topic better. Include relevant history, current situation, and specific angles you want covered. The more context you provide, the less generic your article will be'
      },
      {
        id: 'supporting_data',
        type: 'textarea',
        label: 'Supporting Data',
        rows: 4,
        required: true,
        validation: Yup.string().required('Supporting data is required'),
        helperText: `Include specific facts, figures, and quotes that should appear in the article. The AI will:
• Weave these naturally into the narrative
• Use them to support key points
• Maintain factual accuracy
• Create a more authoritative article`,
        placeholder: `Example:
• Market size: $5.2B in 2023
• Growth rate: 12.3% YoY
• Key player quote: "Innovation drives our industry forward"
• Recent study: 67% of users prefer...`
      }
    ]
  },
  'match_report_template.html': {
    id: 'match_report_template.html',
    name: 'Basic Match Report',
    icon: <SportsSoccerIcon />,
    description: 'Template for creating football match reports and analysis.',
    category: 'Sports',
    tags: ['football', 'match report', 'analysis'],
    access: {
      type: 'restricted',
      conditions: {
        userId: [ADMIN_USER_ID],
        planType: ['pro']
      }
    },
    initialValues: {
      article_type: 'sports',
      publisher_name: '',
      topic: '', 
      keywords: '',
      context: '',
      supporting_data: '',
      image_url: '',
      home_team: '',
      away_team: '',
      home_score: '0',
      away_score: '0',
      home_scorers: '',
      away_scorers: '',
      competition: '',
      match_date: new Date().toISOString().split('T')[0],
      venue: '',
      home_possession: '50',
      away_possession: '50',
      home_shots: '0',
      away_shots: '0',
      home_shots_on_target: '0',
      away_shots_on_target: '0',
      home_xg: '0.0',
      away_xg: '0.0',
      home_corners: '0',
      away_corners: '0',
      home_fouls: '0',
      away_fouls: '0',
      home_yellow_cards: '0',
      away_yellow_cards: '0',
      home_red_cards: '0',
      away_red_cards: '0',
      home_offsides: '0',
      away_offsides: '0'
    },
    fields: [
      // Base fields
      {
        id: 'article_type',
        type: 'select',
        label: 'Article Type',
        required: true,
        options: [
          { value: 'sports', label: 'Sports' }
        ]
      },
      {
        id: 'topic',
        type: 'text',
        label: 'Topic',
        required: true,
        helperText: 'Main topic or focus of the match report'
      },
      {
        id: 'publisher_name',
        type: 'text',
        label: 'Publisher Name',
        required: true,
        validation: Yup.string().required('Publisher name is required')
      },
      {
        id: 'keywords',
        type: 'text',
        label: 'Keywords',
        required: true,
        validation: Yup.string().max(150, 'Keywords must be 150 characters or less').required('Keywords are required'),
        helperText: 'Comma-separated keywords'
      },
      // Match Details Group
      {
        group: 'match_details',
        label: 'Match Details',
        fields: [
          {
            id: 'competition',
            type: 'text',
            label: 'Competition',
            required: true,
            validation: Yup.string().required('Competition is required').max(50, 'Competition name too long')
          },
          {
            id: 'match_date',
            type: 'date',
            label: 'Match Date',
            required: true,
            validation: Yup.string().required('Match date is required')
          },
          {
            id: 'venue',
            type: 'text',
            label: 'Venue',
            required: true,
            validation: Yup.string().required('Venue is required').max(100, 'Venue name too long')
          }
        ]
      },
      // Teams Group
      {
        group: 'teams',
        label: 'Team Information',
        fields: [
          {
            id: 'home_team',
            type: 'text',
            label: 'Home Team',
            required: true,
            validation: Yup.string().required('Home team is required').max(50, 'Team name too long')
          },
          {
            id: 'away_team',
            type: 'text',
            label: 'Away Team',
            required: true,
            validation: Yup.string().required('Away team is required').max(50, 'Team name too long')
          }
        ]
      },
      // Score Group
      {
        group: 'score',
        label: 'Match Score',
        fields: [
          {
            id: 'home_score',
            type: 'number',
            label: 'Home Score',
            required: true,
            validation: Yup.number().required('Home score is required').min(0, 'Score cannot be negative').integer('Score must be a whole number')
          },
          {
            id: 'away_score',
            type: 'number',
            label: 'Away Score',
            required: true,
            validation: Yup.number().required('Away score is required').min(0, 'Score cannot be negative').integer('Score must be a whole number')
          },
          {
            id: 'home_scorers',
            type: 'text',
            label: 'Home Scorers',
            placeholder: 'Example: Rashford (23\'), Bruno (67\')',
            validation: Yup.string().matches(
              /^$|^[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?(,\s*[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?)*$/,
              'Invalid format. Example: Rashford (23\'), Bruno (67\') or leave empty'
            )
          },
          {
            id: 'away_scorers',
            type: 'text',
            label: 'Away Scorers',
            placeholder: 'Example: Salah (15\'), Núñez (88\')',
            validation: Yup.string().matches(
              /^$|^[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?(,\s*[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?)*$/,
              'Invalid format. Example: Salah (15\'), Núñez (88\') or leave empty'
            )
          }
        ]
      },
      // Match Stats Group
      {
        group: 'match_stats',
        label: 'Match Statistics',
        fields: [
          {
            id: 'home_possession',
            type: 'number',
            label: 'Home Possession %',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%')
          },
          {
            id: 'away_possession',
            type: 'number',
            label: 'Away Possession %',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%')
          },
          {
            id: 'home_shots',
            type: 'number',
            label: 'Home Shots',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_shots',
            type: 'number',
            label: 'Away Shots',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_shots_on_target',
            type: 'number',
            label: 'Home Shots on Target',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_shots_on_target',
            type: 'number',
            label: 'Away Shots on Target',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_xg',
            type: 'number',
            label: 'Home xG',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative')
          },
          {
            id: 'away_xg',
            type: 'number',
            label: 'Away xG',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative')
          },
          {
            id: 'home_corners',
            type: 'number',
            label: 'Home Corners',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_corners',
            type: 'number',
            label: 'Away Corners',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_fouls',
            type: 'number',
            label: 'Home Fouls',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_fouls',
            type: 'number',
            label: 'Away Fouls',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_yellow_cards',
            type: 'number',
            label: 'Home Yellow Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_yellow_cards',
            type: 'number',
            label: 'Away Yellow Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_red_cards',
            type: 'number',
            label: 'Home Red Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_red_cards',
            type: 'number',
            label: 'Away Red Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_offsides',
            type: 'number',
            label: 'Home Offsides',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_offsides',
            type: 'number',
            label: 'Away Offsides',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          }
        ]
      },
      // Additional Information
      {
        id: 'context',
        type: 'textarea',
        label: 'Additional Context',
        rows: 4,
        required: true,
        validation: Yup.string().required('Context is required'),
        helperText: 'Add any additional match context'
      },
      {
        id: 'supporting_data',
        type: 'textarea',
        label: 'Supporting Data',
        rows: 4,
        required: true,
        validation: Yup.string().required('Supporting data is required'),
        helperText: `Provide relevant context such as:
• Current league positions
• Recent form (e.g., "United: WWDLW, Liverpool: DWWLD")
• Head-to-head record
• Key player availability/injuries
• Historical context of the fixture
• Any significant milestones or records`,
        placeholder: `Example:
United sit 3rd in the table, having won their last three home games.
Liverpool arrive in 5th place, unbeaten in their last 5 away matches.
United's last 5: WWDLW
Liverpool's last 5: DWWLD
Previous meeting: Liverpool 2-1 United (Sep 2023)
Key absences: Shaw (United, injured), Van Dijk (Liverpool, suspended)`
      },
      {
        id: 'image_url',
        type: 'text',
        label: 'Featured Image URL',
        required: false,
        validation: Yup.string().url('Invalid image URL').nullable(),
        helperText: 'Enter the URL of the featured image',
        placeholder: 'https://example.com/image.jpg'
      }
    ]
  },
  'ss_match_report_template.html': {
    id: 'ss_match_report_template.html',
    name: 'Match Report',
    icon: <AssessmentIcon />,
    description: 'Template for football match reports and analysis.',
    category: 'Sports',
    tags: ['football', 'match report', 'analysis'],
    access: {
      type: 'restricted',
      conditions: {
        userId: [ADMIN_USER_ID],
        planType: ['pro']
      }
    },
    initialValues: {
      article_type: 'sports',
      publisher_name: '',
      topic: '', 
      keywords: '',
      context: '',
      supporting_data: '',
      image_url: '',
      home_team: '',
      away_team: '',
      home_score: '0',
      away_score: '0',
      home_scorers: '',
      away_scorers: '',
      competition: '',
      match_date: new Date().toISOString().split('T')[0],
      venue: '',
      home_possession: '50',
      away_possession: '50',
      home_shots: '0',
      away_shots: '0',
      home_shots_on_target: '0',
      away_shots_on_target: '0',
      home_xg: '0.0',
      away_xg: '0.0',
      home_corners: '0',
      away_corners: '0',
      home_fouls: '0',
      away_fouls: '0',
      home_yellow_cards: '0',
      away_yellow_cards: '0',
      home_red_cards: '0',
      away_red_cards: '0',
      home_offsides: '0',
      away_offsides: '0'
    },
    fields: [
      // Base fields
      {
        id: 'article_type',
        type: 'select',
        label: 'Article Type',
        required: true,
        options: [
          { value: 'sports', label: 'Sports' }
        ]
      },
      {
        id: 'topic',  // Add this field
        type: 'text',
        label: 'Topic',
        required: true,
        helperText: 'Main topic or focus of the match report'
      },
      {
        id: 'publisher_name',
        type: 'text',
        label: 'Publisher Name',
        required: true,
        validation: Yup.string().required('Publisher name is required')
      },
      {
        id: 'keywords',
        type: 'text',
        label: 'Keywords',
        required: true,
        validation: Yup.string().max(150, 'Keywords must be 150 characters or less').required('Keywords are required'),
        helperText: 'Comma-separated keywords'
      },
      // Match Details Group
      {
        group: 'match_details',
        label: 'Match Details',
        fields: [
          {
            id: 'competition',
            type: 'text',
            label: 'Competition',
            required: true,
            validation: Yup.string().required('Competition is required').max(50, 'Competition name too long')
          },
          {
            id: 'match_date',
            type: 'date',
            label: 'Match Date',
            required: true,
            validation: Yup.string().required('Match date is required')
          },
          {
            id: 'venue',
            type: 'text',
            label: 'Venue',
            required: true,
            validation: Yup.string().required('Venue is required').max(100, 'Venue name too long')
          }
        ]
      },
      // Teams Group
      {
        group: 'teams',
        label: 'Team Information',
        fields: [
          {
            id: 'home_team',
            type: 'text',
            label: 'Home Team',
            required: true,
            validation: Yup.string().required('Home team is required').max(50, 'Team name too long')
          },
          {
            id: 'away_team',
            type: 'text',
            label: 'Away Team',
            required: true,
            validation: Yup.string().required('Away team is required').max(50, 'Team name too long')
          }
        ]
      },
      // Score Group
      {
        group: 'score',
        label: 'Match Score',
        fields: [
          {
            id: 'home_score',
            type: 'number',
            label: 'Home Score',
            required: true,
            validation: Yup.number().required('Home score is required').min(0, 'Score cannot be negative').integer('Score must be a whole number')
          },
          {
            id: 'away_score',
            type: 'number',
            label: 'Away Score',
            required: true,
            validation: Yup.number().required('Away score is required').min(0, 'Score cannot be negative').integer('Score must be a whole number')
          },
          {
            id: 'home_scorers',
            type: 'text',
            label: 'Home Scorers',
            placeholder: 'Example: Rashford (23\'), Bruno (67\')',
            validation: Yup.string().matches(
              /^$|^[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?(,\s*[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?)*$/,
              'Invalid format. Example: Rashford (23\'), Bruno (67\') or leave empty'
            )
          },
          {
            id: 'away_scorers',
            type: 'text',
            label: 'Away Scorers',
            placeholder: 'Example: Salah (15\'), Núñez (88\')',
            validation: Yup.string().matches(
              /^$|^[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?(,\s*[A-Za-z\s'\-]+(?: \(\d{1,3}'\))?)*$/,
              'Invalid format. Example: Salah (15\'), Núñez (88\') or leave empty'
            )
          }
        ]
      },
      // Match Stats Group
      {
        group: 'match_stats',
        label: 'Match Statistics',
        fields: [
          {
            id: 'home_possession',
            type: 'number',
            label: 'Home Possession %',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%')
          },
          {
            id: 'away_possession',
            type: 'number',
            label: 'Away Possession %',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').max(100, 'Cannot exceed 100%')
          },
          {
            id: 'home_shots',
            type: 'number',
            label: 'Home Shots',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_shots',
            type: 'number',
            label: 'Away Shots',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_shots_on_target',
            type: 'number',
            label: 'Home Shots on Target',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_shots_on_target',
            type: 'number',
            label: 'Away Shots on Target',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_xg',
            type: 'number',
            label: 'Home xG',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative')
          },
          {
            id: 'away_xg',
            type: 'number',
            label: 'Away xG',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative')
          },
          {
            id: 'home_corners',
            type: 'number',
            label: 'Home Corners',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_corners',
            type: 'number',
            label: 'Away Corners',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_fouls',
            type: 'number',
            label: 'Home Fouls',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_fouls',
            type: 'number',
            label: 'Away Fouls',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_yellow_cards',
            type: 'number',
            label: 'Home Yellow Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_yellow_cards',
            type: 'number',
            label: 'Away Yellow Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_red_cards',
            type: 'number',
            label: 'Home Red Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_red_cards',
            type: 'number',
            label: 'Away Red Cards',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'home_offsides',
            type: 'number',
            label: 'Home Offsides',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          },
          {
            id: 'away_offsides',
            type: 'number',
            label: 'Away Offsides',
            required: true,
            validation: Yup.number().required('Required').min(0, 'Cannot be negative').integer('Must be a whole number')
          }
        ]
      },
      // Additional Information
      {
        id: 'context',
        type: 'textarea',
        label: 'Additional Context',
        rows: 4,
        required: true,
        validation: Yup.string().required('Context is required'),
        helperText: 'Add any additional match context'
      },
      {
        id: 'supporting_data',
        type: 'textarea',
        label: 'Supporting Data',
        rows: 4,
        required: true,
        validation: Yup.string().required('Supporting data is required'),
        helperText: `Provide relevant context such as:
• Current league positions
• Recent form (e.g., "United: WWDLW, Liverpool: DWWLD")
• Head-to-head record
• Key player availability/injuries
• Historical context of the fixture
• Any significant milestones or records`,
        placeholder: `Example:
United sit 3rd in the table, having won their last three home games.
Liverpool arrive in 5th place, unbeaten in their last 5 away matches.
United's last 5: WWDLW
Liverpool's last 5: DWWLD
Previous meeting: Liverpool 2-1 United (Sep 2023)
Key absences: Shaw (United, injured), Van Dijk (Liverpool, suspended)`
      },
      {
        id: 'image_url',
        type: 'text',
        label: 'Featured Image URL',
        required: false,
        validation: Yup.string().url('Invalid image URL').nullable(),
        helperText: 'Enter the URL of the featured image',
        placeholder: 'https://example.com/image.jpg'
      }
    ]
  },
  'ss_player_scout_report_template.html': {
    id: 'ss_player_scout_report_template.html',
    name: 'Player Scout Report',
    icon: <NewspaperIcon />,
    description: 'In-depth player analysis and statistics. Ideal for detailed player assessments.',
    category: 'Sports',
    tags: ['football', 'player', 'analysis', 'scouting'],
    access: {
      type: 'restricted',
      conditions: {
        userId: [ADMIN_USER_ID],
        planType: ['pro']
      }
    },
    initialValues: {
      publisher_name: '',
      keywords: '',
      player_name: '',
      player_position: '',
      team: '',
      age: '',
      nationality: '',
      height: '',
      weight: '',
      preferred_foot: '',
      context: '',
      supporting_data: '',
      image_url: '',
    },
    fields: [
      // Base fields
      {
        id: 'publisher_name',
        type: 'text',
        label: 'Publisher Name',
        required: true,
        validation: Yup.string().required('Publisher name is required')
      },
      {
        id: 'keywords',
        type: 'text',
        label: 'Keywords',
        required: true,
        validation: Yup.string().max(150, 'Keywords must be 150 characters or less').required('Keywords are required'),
        helperText: 'Comma-separated keywords'
      },
      // Player Details Group
      {
        group: 'player_details',
        label: 'Player Details',
        fields: [
          {
            id: 'player_name',
            type: 'text',
            label: 'Player Name',
            required: true,
            validation: Yup.string().required('Player name is required')
          },
          {
            id: 'player_position',
            type: 'text',
            label: 'Position',
            required: true,
            validation: Yup.string().required('Position is required')
          },
          {
            id: 'team',
            type: 'text',
            label: 'Current Team',
            required: true,
            validation: Yup.string().required('Team is required')
          },
          {
            id: 'age',
            type: 'number',
            label: 'Age',
            required: true,
            validation: Yup.number().required('Age is required').min(15, 'Age must be at least 15').max(45, 'Age must be under 45')
          },
          {
            id: 'nationality',
            type: 'text',
            label: 'Nationality',
            required: true,
            validation: Yup.string().required('Nationality is required')
          },
          {
            id: 'height',
            type: 'text',
            label: 'Height',
            placeholder: '1.85m',
            required: true,
            validation: Yup.string().required('Height is required')
          },
          {
            id: 'weight',
            type: 'text',
            label: 'Weight',
            placeholder: '75kg',
            required: true,
            validation: Yup.string().required('Weight is required')
          },
          {
            id: 'preferred_foot',
            type: 'text',
            label: 'Preferred Foot',
            required: true,
            validation: Yup.string().required('Preferred foot is required')
          }
        ]
      },
      // Analysis fields
      {
        id: 'context',
        type: 'textarea',
        label: 'Analysis Context',
        rows: 4,
        required: true,
        validation: Yup.string().required('Context is required'),
        helperText: 'Add match/scouting context and overall assessment'
      },
      {
        id: 'supporting_data',
        type: 'textarea',
        label: 'Supporting Data',
        rows: 4,
        required: true,
        validation: Yup.string().required('Supporting data is required'),
        helperText: `Provide relevant data such as:
• Key statistics from recent matches
• Season performance data
• Strengths and weaknesses
• Playing style analysis
• Development areas
• Comparison with similar players`,
        placeholder: `Example:
2023/24 Season Stats:
• 25 appearances (22 starts)
• 8 goals, 12 assists
• 87% pass completion rate
• 2.3 key passes per game
• 3.1 successful dribbles per game

Key Strengths:
• Excellent ball control and dribbling
• Strong passing range
• High work rate
• Tactical versatility

Areas for Development:
• Aerial duels
• Right foot finishing
• Defensive positioning`
      },
      {
        id: 'image_url',
        type: 'text',
        label: 'Featured Image URL',
        required: false,
        validation: Yup.string().url('Invalid image URL').nullable(),
        helperText: 'Enter the URL of the featured image',
        placeholder: 'https://example.com/image.jpg'
      }
    ]
  }
};

// Helper function to check template access
const getAvailableTemplates = (user, subscription) => {
  return Object.entries(TEMPLATE_CONFIGS).reduce((acc, [key, template]) => {
    // Check access conditions
    const { access } = template;
    
    // If type is 'all', template is public
    if (access.type === 'all') {
      acc[key] = template;
      return acc;
    }
    
    // Check restricted access
    if (access.type === 'restricted') {
      const { conditions } = access;
      
      // Check user ID if specified
      if (conditions.userId && !conditions.userId.includes(user?.id)) {
        return acc;
      }
      
      // Check plan type if specified
      if (conditions.planType && !conditions.planType.includes(subscription?.plan_type)) {
        return acc;
      }
      
      acc[key] = template;
    }
    
    return acc;
  }, {});
};

export { getAvailableTemplates };