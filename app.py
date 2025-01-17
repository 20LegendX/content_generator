from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from openai import OpenAI
import json
import io
import requests
from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Access your API key
api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__, static_folder="frontend/build")
# Update your CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",  # React development server
            "http://127.0.0.1:3000",  # Alternative React development URL
            "http://127.0.0.1:5000",  # Flask development
            "http://13.60.61.227",  # Your EC2 IP
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept", "Authorization"],
        "supports_credentials": True
    }
})


# Serve React static files
# Catch-all route for React app LAST
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


# Initialize OpenAI client
client = OpenAI(api_key=api_key)


def validate_template_vars(template_vars, template_name):
    """Validate template variables based on template type"""
    required_fields = {
        'match_report_template.html': ['headline', 'article_content', 'match_stats'],
        'ss_match_report_template.html': ['headline', 'article_content', 'match_stats', 'meta_description', 'keywords'],
        'ss_player_scout_report_template.html': [
            'headline', 'article_content',
            'player_name', 'player_position', 'player_age',
            'player_nationality', 'favored_foot',
        ]
    }

    if template_name not in required_fields:
        return False, f"Unknown template: {template_name}"

    missing_fields = [field for field in required_fields[template_name]
                      if field not in template_vars or not template_vars[field]]

    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"

    return True, None


@app.route('/api/generate', methods=['POST', 'OPTIONS'])
def generate_api():
    # Add CORS headers for OPTIONS requests
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', request.origin or '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200

    try:
        # Parse JSON data from React
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided in the request.'}), 400

        # Update template validation to include both options
        template_name = data.get('template_name')
        if template_name not in [
            'match_report_template.html',
            'ss_match_report_template.html',
            'download_template.html',
            'article_template.html',
            'ss_player_scout_report_template.html'
        ]:
            template_name = 'article_template.html'  # default fallback

        print("Template selected:", template_name)
        print("Received data:", data)  # Debug log

        # Validate required fields
        required_fields = ['topic', 'keywords', 'context', 'supporting_data']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

        # Generate the GPT prompt
        try:
            prompt = create_prompt(data)
        except Exception as prompt_error:
            print(f"Error creating prompt: {str(prompt_error)}")
            return jsonify({'error': 'Failed to create prompt.'}), 500

        print("Generated prompt:", prompt)  # Debug log

        # Run GPT to generate the article content
        gpt_response = run_gpt4(prompt, template_name)
        print("GPT response received")  # Debug log
        print(gpt_response)
        # Format the GPT response into HTML-ready content
        formatted_content = format_article_content(gpt_response, template_name)
        if not formatted_content:
            return jsonify({'error': 'Failed to format article content'}), 500

        print("Formatted content:", formatted_content)  # Debug log

        # Template-specific validation
        if template_name == 'ss_player_scout_report_template':
            required_defaults = {
                'headline': 'Player Scout Report',
                'summary': 'No summary provided.',
                'article_content': '<p>No content available.</p>',
                'meta_description': 'A comprehensive scout report on the player.',
                'keywords': ['Football', 'Scout Report'],
                'featured_image_url': '/static/images/default-featured-image.jpg',
                'featured_image_alt': 'Default featured image',
                'publish_date': datetime.now().strftime('%Y-%m-%d'),
                'player_name': 'Unknown Player',
                'player_position': 'Unknown Position',
                'player_age': 'Unknown Age',
                'player_nationality': 'Unknown Nationality',
                'favored_foot': 'Unknown',
                'scout_stats': 'No stats available.'
            }

            for key, default_value in required_defaults.items():
                formatted_content.setdefault(key, default_value)

        if template_name in ['match_report_template.html', 'ss_match_report_template.html']:
            # Validate the fields for these templates only
            is_valid, error_message = validate_template_vars(formatted_content, template_name)
            if not is_valid:
                return jsonify({'error': error_message}), 400

        # Add match_stats if they're not present
        if template_name == 'match_report_template.html':
            if 'match_stats' not in formatted_content:
                formatted_content['match_stats'] = {
                    'possession': {
                        'home': data.get('home_possession', 50),
                        'away': data.get('away_possession', 50)
                    },
                    'shots': {
                        'home': data.get('home_shots', 0),
                        'away': data.get('away_shots', 0)
                    },
                    'shots_on_target': {
                        'home': data.get('home_shots_on_target', 0),
                        'away': data.get('away_shots_on_target', 0)
                    },
                    'corners': {
                        'home': data.get('home_corners', 0),
                        'away': data.get('away_corners', 0)
                    },
                    'fouls': {
                        'home': data.get('home_fouls', 0),
                        'away': data.get('away_fouls', 0)
                    },
                    'yellow_cards': {
                        'home': data.get('home_yellow_cards', 0),
                        'away': data.get('away_yellow_cards', 0)
                    },
                    'red_cards': {
                        'home': data.get('home_red_cards', 0),
                        'away': data.get('away_red_cards', 0)
                    },
                    'offsides': {
                        'home': data.get('home_offsides', 0),
                        'away': data.get('away_offsides', 0)
                    }
                }

        try:
            # Render the template with the generated content
            preview_html = render_template(
                template_name,
                **formatted_content  # Spread all formatted content as template variables
            )
        except Exception as template_error:
            print(f"Template rendering error: {str(template_error)}")
            return jsonify({'error': f'Template rendering failed: {str(template_error)}'}), 500

        return jsonify({
            'preview_html': preview_html,
            'raw_content': formatted_content,
            'template_used': template_name  # Add this for debugging
        })
    except Exception as e:
        print("Error in generate_api:", str(e))  # Debug log
        return jsonify({'error': str(e)}), 500


@app.route('/')
def index():
    """Render the simple input form"""
    return render_template('input_form.html')


def validate_image_url(url):
    """Validate image URL with support for S3 and other cloud storage"""
    try:
        # If it's an S3 URL, consider it valid
        if 'amazonaws.com' in url:
            return True

        # For other URLs, do a light validation
        response = requests.head(url, timeout=5)
        content_type = response.headers.get('content-type', '')
        return 'image' in content_type.lower()
    except:
        # If validation fails, still return True if URL looks valid
        return url.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))


def create_prompt(user_input):
    """Generate a refined dynamic prompt for the match report"""
    template_name = user_input.get('template_name', '')

    if template_name == 'article_template.html':
        # Standard article prompt for article_template
        prompt = f"""Write a structured article about {user_input['topic']}.

        ### Required Structure:
        1. **Title**: A concise, engaging title for the article.
        2. **Headline**: A one-sentence summary of the article.
        3. **Meta Information**:
           - Meta Description: A brief SEO-friendly description (up to 150 characters)
           - Keywords: Use these terms: {user_input.get('keywords', '')}
           - Article Category: The primary category for this content
           - Featured Image Alt Text: A descriptive text for the featured image

        4. **Article Content**: Create a well-structured article with appropriate sections.
        Each section should be properly formatted with HTML paragraph tags (<p>).

        Use the following context and data for reference:
        Context:
        {user_input.get('context', 'No context provided.')}

        Supporting Data:
        {user_input.get('supporting_data', 'No supporting data provided.')}

        ### Writing Style:
        - Use professional UK English
        - Maintain a sophisticated, analytical tone
        - Balance narrative flow with data insights
        - Incorporate the provided supporting data naturally within the content
        """

    elif user_input.get('template_name') == 'ss_player_scout_report_template.html':
        # Create the SCOUTING prompt
        scout_stats = user_input.get('scout_stats')
        if isinstance(scout_stats, str):
            try:
                scout_stats = json.loads(scout_stats)
            except json.JSONDecodeError:
                scout_stats = {}
        user_input['scout_stats'] = scout_stats

        prompt = f"""
        Write a professional scout report about {user_input.get('player_name', 'Unknown Player')}.

        ### Provided Data:
        - Position: {user_input.get('player_position', '')}
        - Age: {user_input.get('player_age', '')}
        - Nationality: {user_input.get('player_nationality', '')}
        - Favoured Foot: {user_input.get('favored_foot', '')}
        - Stats: {json.dumps(scout_stats, indent=2)}

        ### Additional Context:
        {user_input.get('context', '')}

        Supporting Data:
        {user_input.get('supporting_data', '')}

        ### Requirements:
        - Write the scout report as a cohesive narrative rather than multiple separate sections.
        - Combine related points into flowing, well-structured paragraphs.
        - Avoid excessive section breaks unless there is a major topic shift.
        - Ensure that stats and context are naturally woven into the narrative.
        - Produce a single, engaging piece of writing that reads naturally and is enjoyable for readers.
        - Create an engaging headline and meta description for SEO, plus a short summary.
        """


    elif 'match_report_template' in template_name:
        # Existing match report template logic
        prompt = f"""
        Write a professional match report for {user_input['home_team']} vs {user_input['away_team']} using ONLY the provided information.

        ### Data Provided
        **Score**: {user_input['home_team']} {user_input['home_score']} - {user_input['away_score']} {user_input['away_team']}
        **Competition**: {user_input['competition']}
        **Venue**: {user_input['venue']}
        **Date**: {user_input['match_date']}

        **Goals**:
        - {user_input['home_team']}: {user_input.get('home_scorers', 'None')}
        - {user_input['away_team']}: {user_input.get('away_scorers', 'None')}

        **Key Events (if provided)**:
        {user_input.get('key_events', 'No explicit key events mentioned.')}

        **Supporting Data**:
        {user_input.get('supporting_data', 'None')}

        **Match Context**:  
        {user_input.get('context', 'No additional context provided.')}

        **Match Statistics**:  
        - Expected Goals (xG): {user_input['home_team']} {user_input.get('home_xg', 0)} vs {user_input.get('away_xg', 0)} {user_input['away_team']}
        - Possession: {user_input.get('home_possession')}% vs {user_input.get('away_possession')}%
        - Shots: {user_input.get('home_shots')} ({user_input.get('home_shots_on_target')} on target) vs {user_input.get('away_shots')} ({user_input.get('away_shots_on_target')} on target)
        - Cards: {user_input['home_team']} {user_input.get('home_yellow_cards', 0)}Y/{user_input.get('home_red_cards', 0)}R vs {user_input['away_team']} {user_input.get('away_yellow_cards', 0)}Y/{user_input.get('away_red_cards', 0)}R

        ### Writing Instructions
        1. **Structure**:
           - Always include:
             - **Match Overview** (introduction/context + final result)
             - **Match Analysis** (using statistics to describe the performance)
           - Include **Key Moments** ONLY IF there are specific notable events (e.g., goals, cards, missed penalties) mentioned in 'Key Events' or 'Supporting Data'.

        2. **Content Rules**:
           - Use the match statistics in the "Match Analysis" section to support your observations.
           - Reference any notable events (like a missed penalty or key goals) ONLY if they are explicitly provided.
           - Do NOT invent or assume new events beyond the data.

        3. **Style**:
           - Write in concise, professional UK English.
           - Avoid repetitive statements and speculative phrases.
           - Keep the narrative strictly to the facts provided.

        Now, write the match report based on this data and structure.
        """

    return prompt





def run_gpt4(prompt, template_name, model="gpt-4o", max_tokens=8000, temperature=0.7):
    """Send prompt to GPT-4 and get structured response."""
    print("Using model:", model)

    try:

        if template_name == 'match_report_template.html' or template_name == 'ss_match_report_template.html':
            system_prompt = """You are an expert sports journalist. 
            Return your response in valid JSON format with match report elements:
            {
                "template_data": {
                    "headline": string,  // Engaging match headline
                    "match_summary": string,  // Brief overview of the match
                    "featured_image_alt": string
                },
                "meta_data": {
                    "meta_description": string,
                    "keywords": array of strings,
                    "og_title": string,
                    "og_description": string,
                    "twitter_title": string,
                    "twitter_description": string
                },
                "match_report": [
                    {
                        "type": string,  
                        "heading": string,
                        "content": array of strings (paragraphs)
                    }
                ],
                "match_stats": {
                    "possession": object,  // e.g., {"home": 60, "away": 40}
                    "shots_on_target": object,
                    "corners": object,
                    "key_events": array of objects  // e.g., [{"time": "23'", "event": "Goal", "team": "home"}]
                }
            }

            Ensure the report:
            - Has an engaging headline
            - Maintains journalistic style
            - Uses appropriate sports terminology
            """
        elif template_name == 'ss_player_scout_report_template.html':
            system_prompt = """You are a professional sports analyst specialising in writing cohesive and detailed player scout reports.
            Write a flowing narrative for the scout report, avoiding excessive section breaks and maintaining engaging content. 
            Return your response in valid JSON format:
            {
                "template_data": {
                    "headline": string,  // Engaging report title
                    "summary": string,  // Brief summary of the report
                    "featured_image_alt": string
                },
                "meta_data": {
                    "meta_description": string,
                    "keywords": array of strings,
                    "og_title": string,
                    "og_description": string,
                    "twitter_title": string,
                    "twitter_description": string
                },
                "scout_report": [
                    {
                        "type": "section",
                        "heading": string,  // Section heading
                        "content": array of strings (single paragraph or cohesive blocks)
                    }
                ]
            }

            Ensure the scout report:
            - Combines related points into cohesive paragraphs for better readability.
            - Incorporates stats naturally into the narrative.
            - Avoids rigid sectioning unless there's a clear topic shift.
            - Follows a professional and analytical tone throughout.
            """

        else:
            system_prompt = """You are an expert SEO content writer. 
            Return your response in valid JSON format with enhanced SEO elements:
            {
                "template_data": {
                    "headline": string,  // SEO-optimized title
                    "short_title": string,  // Shorter version for meta title
                    "featured_image_alt": string,  // SEO-optimized alt text for the featured image
                    "article_category": string,
                    "slug": string  // URL-friendly version of title
                },
                "meta_data": {
                    "meta_description": string (150-160 characters, compelling and keyword-rich),
                    "keywords": array of strings (primary and secondary keywords),
                    "publish_date": string (YYYY-MM-DD),
                    "author": string,
                    "og_title": string,  // Optimized for social sharing
                    "og_description": string,  // Optimized for social sharing
                    "twitter_title": string,  // Optimized for Twitter
                    "twitter_description": string,  // Optimized for Twitter
                    "schema_type": string,  // e.g., "Article", "NewsArticle", "BlogPosting"
                    "focus_keyword": string  // Primary keyword for the article
                    "publisher": {
                        "name": string,  // From user input
                        "url": string,   // From user input
                    }
                },
                "article_content": [
                    {
                        "type": "section",
                        "heading": string,
                        "content": array of strings (paragraphs)
                    }
                ]
            }

            Ensure content follows SEO best practices:
            - Use semantic HTML structure
            - Include primary keyword in first paragraph
            - Use LSI keywords throughout
            - Create engaging meta descriptions
            - Optimize headings hierarchy
            - Write SEO-optimized alt text for the featured image
            """

        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": str(prompt)}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"}
        )


        return completion.choices[0].message.content.strip()

    except Exception as e:
        print(f"Error details: {str(e)}")
        return None


def format_article_content(gpt_response, template_type):
    """
    Convert GPT JSON response into template-ready HTML content based on template type
    """
    try:
        response_data = json.loads(gpt_response)
        current_date = datetime.now().strftime("%Y-%m-%d")
        # Default template_vars
        template_vars = {
            'headline': 'Default Headline',
            'article_content': '<p>No content available.</p>',
            'meta_description': 'Default meta description.',
            'keywords': ['default', 'keywords'],
            'publish_date': current_date,
            'featured_image_url': '/static/images/default-match-image.jpg',
            'featured_image_alt': 'Default image alt text.',
            'article_category': 'Default Category',
        }
        # Default image values
        default_image_url = '/static/images/default-match-image.jpg'
        default_image_alt = 'Football match report'

        if template_type == 'match_report_template.html':
            match_content = []
            for section in response_data['match_report']:
                match_content.append(f'\n<section class="match-section">\n')
                if 'heading' in section:
                    match_content.append(f'<h2>{section["heading"]}</h2>\n')
                for paragraph in section['content']:
                    match_content.append(f'<p>{paragraph}</p>\n')
                match_content.append('</section>\n')

            # Get image URL from request or use default
            image_url = request.json.get('image_url')
            if not image_url or image_url.strip() == '':
                image_url = default_image_url

            # Get image alt from GPT response or use default
            image_alt = response_data['template_data'].get('featured_image_alt')
            if not image_alt or image_alt.strip() == '':
                image_alt = f"{request.json.get('home_team', '')} vs {request.json.get('away_team', '')} match report"

            template_vars.update({
                'headline': response_data['template_data']['headline'],
                'match_summary': response_data['template_data'].get('match_summary', ''),
                'article_content': '\n'.join(match_content),
                'meta_description': response_data['meta_data']['meta_description'],
                'keywords': response_data['meta_data'].get('keywords', []),
                'publish_date': current_date,
                # Image fields with defaults
                'featured_image_url': image_url,
                'featured_image_alt': image_alt,

                'article_category': 'Sports',
                # Match-specific data
                'home_team': request.json.get('home_team', ''),
                'away_team': request.json.get('away_team', ''),
                'home_score': request.json.get('home_score', ''),
                'away_score': request.json.get('away_score', ''),
                'competition': request.json.get('competition', ''),
                'match_date': request.json.get('match_date', ''),
                'venue': request.json.get('venue', ''),

                # Additional meta data
                'schema_type': 'SportsEvent',
                'og_title': response_data['meta_data'].get('og_title', ''),
                'og_description': response_data['meta_data'].get('og_description', ''),
                'twitter_title': response_data['meta_data'].get('twitter_title', ''),
                'twitter_description': response_data['meta_data'].get('twitter_description', ''),
                'author': response_data['meta_data'].get('author', 'Sports Reporter'),
                'publisher_name': request.json.get('publisher_name', ''),
                'publisher_url': request.json.get('publisher_url', ''),
                # Add lineup data
                'home_lineup': request.json.get('home_lineup', ''),
                'away_lineup': request.json.get('away_lineup', ''),
                # Match stats
                'match_stats': {
                    'possession': {
                        'home': request.json.get('home_possession', 50),
                        'away': request.json.get('away_possession', 50)
                    },
                    'shots': {
                        'home': request.json.get('home_shots', 0),
                        'away': request.json.get('away_shots', 0)
                    },
                    'shots_on_target': {
                        'home': request.json.get('home_shots_on_target', 0),
                        'away': request.json.get('away_shots_on_target', 0)
                    },
                    'corners': {
                        'home': request.json.get('home_corners', 0),
                        'away': request.json.get('away_corners', 0)
                    },
                    'fouls': {
                        'home': request.json.get('home_fouls', 0),
                        'away': request.json.get('away_fouls', 0)
                    },
                    'yellow_cards': {
                        'home': request.json.get('home_yellow_cards', 0),
                        'away': request.json.get('away_yellow_cards', 0)
                    },
                    'red_cards': {
                        'home': request.json.get('home_red_cards', 0),
                        'away': request.json.get('away_red_cards', 0)
                    },
                    'offsides': {
                        'home': request.json.get('home_offsides', 0),
                        'away': request.json.get('away_offsides', 0)
                    },
                    'xg': {
                        'home': float(request.json.get('home_xg', 0.0)),
                        'away': float(request.json.get('away_xg', 0.0))
                    }
                }
            })

        elif template_type == 'ss_match_report_template.html':
            # Similar structure but with your site's specific needs
            match_content = []
            for section in response_data['match_report']:
                match_content.append(f'\n<div class="ss-match-section">\n')  # Your site's class names
                if 'heading' in section:
                    match_content.append(f'<h2 class="ss-section-heading">{section["heading"]}</h2>\n')
                for paragraph in section['content']:
                    match_content.append(f'<p class="ss-content-paragraph">{paragraph}</p>\n')
                match_content.append('</div>\n')

            template_vars.update({
                'headline': response_data['template_data']['headline'],
                'match_summary': response_data['template_data'].get('match_summary', ''),
                'article_content': '\n'.join(match_content),
                'meta_description': response_data['meta_data']['meta_description'],
                'keywords': response_data['meta_data'].get('keywords', []),
                'publish_date': current_date,
                'featured_image_url': request.json.get('image_url', default_image_url),
                'featured_image_alt': response_data['template_data'].get('featured_image_alt', default_image_alt),
                'article_category': 'Sports',
                # Match-specific data
                'home_team': request.json.get('home_team', ''),
                'away_team': request.json.get('away_team', ''),
                'home_score': request.json.get('home_score', ''),
                'away_score': request.json.get('away_score', ''),
                'competition': request.json.get('competition', ''),
                'match_date': request.json.get('match_date', ''),
                'venue': request.json.get('venue', ''),
                # Additional meta data
                'schema_type': 'SportsEvent',
                'og_title': response_data['meta_data'].get('og_title', ''),
                'og_description': response_data['meta_data'].get('og_description', ''),
                'twitter_title': response_data['meta_data'].get('twitter_title', ''),
                'twitter_description': response_data['meta_data'].get('twitter_description', ''),
                'author': response_data['meta_data'].get('author', 'Sports Reporter'),
                'publisher_name': request.json.get('publisher_name', ''),
                'publisher_url': request.json.get('publisher_url', ''),
                # Match stats
                'match_stats': {
                    'possession': {
                        'home': request.json.get('home_possession', 50),
                        'away': request.json.get('away_possession', 50)
                    },
                    'shots': {
                        'home': request.json.get('home_shots', 0),
                        'away': request.json.get('away_shots', 0)
                    },
                    'shots_on_target': {
                        'home': request.json.get('home_shots_on_target', 0),
                        'away': request.json.get('away_shots_on_target', 0)
                    },
                    'corners': {
                        'home': request.json.get('home_corners', 0),
                        'away': request.json.get('away_corners', 0)
                    },
                    'fouls': {
                        'home': request.json.get('home_fouls', 0),
                        'away': request.json.get('away_fouls', 0)
                    },
                    'yellow_cards': {
                        'home': request.json.get('home_yellow_cards', 0),
                        'away': request.json.get('away_yellow_cards', 0)
                    },
                    'red_cards': {
                        'home': request.json.get('home_red_cards', 0),
                        'away': request.json.get('away_red_cards', 0)
                    },
                    'offsides': {
                        'home': request.json.get('home_offsides', 0),
                        'away': request.json.get('away_offsides', 0)
                    },
                    'xg': {
                        'home': float(request.json.get('home_xg', 0.0)),
                        'away': float(request.json.get('away_xg', 0.0))
                    }
                }
            })
        elif template_type == 'ss_player_scout_report_template.html':
            # == New Player Scout Report ==
            scout_content = []

            # Process the correct key: 'scout_report'
            for section in response_data.get('scout_report', []):
                # Open a new section with the appropriate class
                scout_content.append('<section class="scout-report-section">\n')

                # Add the heading if it exists
                if 'heading' in section:
                    scout_content.append(f'<h2>{section["heading"]}</h2>\n')

                # Add each paragraph separately to preserve structure
                if 'content' in section:
                    for paragraph in section['content']:
                        scout_content.append(f'<p>{paragraph}</p>\n')

                # Close the section
                scout_content.append('</section>\n')

            # Ensure the image fields are handled properly
            image_url = request.json.get('image_url', default_image_url)
            image_alt = response_data.get('template_data', {}).get('featured_image_alt', default_image_alt)

            # Parse the recent form data
            recent_form_text = request.json.get('scout_stats', {}).get('Recent Form', '')
            form_summary, recent_matches = parse_recent_form(recent_form_text)
            
            # Build template_vars specifically for the "Player Scout Report"
            template_vars.update({
                'headline': response_data['template_data'].get('headline', 'Default Headline'),
                'summary': response_data['template_data'].get('summary', 'Default Summary'),
                'article_content': '\n'.join(scout_content),
                'meta_description': response_data['meta_data'].get('meta_description', 'Default meta description.'),
                'featured_image_url': image_url,
                'featured_image_alt': image_alt,
                'player_name': request.json.get('player_name', 'Unknown Player'),
                'player_position': request.json.get('player_position', 'Unknown Position'),
                'player_age': request.json.get('player_age', 'Unknown Age'),
                'player_nationality': request.json.get('player_nationality', 'Unknown Nationality'),
                'favored_foot': request.json.get('favored_foot', 'Unknown'),
                'og_title': response_data['template_data'].get('headline', 'Default Headline'),
                'og_description': response_data['meta_data'].get('meta_description', 'Default meta description.'),
                'keywords': ', '.join(response_data['meta_data'].get('keywords', [])),  # Convert list to string
                'scout_stats': request.json.get('scout_stats', 'No stats available.'),
                'form_summary': form_summary,
                'recent_matches': recent_matches  # Add the parsed matches data
            })


        elif template_type == 'article_template.html':
            html_content = []
            for section in response_data['article_content']:
                if section.get('heading'):
                    html_content.append(f'<h2>{section["heading"]}</h2>')
                for paragraph in section['content']:
                    # Remove any existing <p> tags and rewrap content
                    clean_paragraph = paragraph.replace('<p>', '').replace('</p>', '').strip()
                    html_content.append(f'<p>{clean_paragraph}</p>')

            # Create template_vars exactly like in download_article_api (no match stats)
            template_vars.update({
                "headline": response_data['template_data'].get('headline', ''),
                "article_content": '\n'.join(html_content),  # Join as single HTML string
                "featured_image_url": request.json.get("image_url", default_image_url),
                "featured_image_alt": response_data['template_data'].get('featured_image_alt', default_image_alt),
                "meta_description": response_data['meta_data'].get('meta_description', ''),
                "keywords": response_data['meta_data'].get('keywords', ''),
                "publish_date": current_date,
                "author": response_data['meta_data'].get('author', ''),
                "publisher_name": request.json.get("publisher_name", ''),
                "publisher_url": request.json.get("publisher_url", '')
            })

            return template_vars

        else:
            # Original format for standard article template
            html_content = []
            for section in response_data['article_content']:
                html_content.append(f'\n<section itemscope itemtype="https://schema.org/Article">\n')
                html_content.append(f'<h2 itemprop="headline">{section["heading"]}</h2>\n')
                for paragraph in section['content']:
                    html_content.append(f'<p itemprop="text">{paragraph}</p>\n')
                html_content.append('</section>\n')

            template_vars.update({
                'article_title': response_data['template_data']['headline'],
                'short_title': response_data['template_data']['short_title'],
                'headline': response_data['template_data']['headline'],
                'featured_image_alt': response_data['template_data']['featured_image_alt'],
                'article_category': response_data['template_data']['article_category'],
                'slug': response_data['template_data']['slug'],
                'article_content': '\n'.join(html_content),
                'meta_description': response_data['meta_data']['meta_description'],
                'keywords': ', '.join(response_data['meta_data']['keywords']),
                'publish_date': current_date,
                'author': response_data['meta_data']['author'],
                'og_title': response_data['meta_data']['og_title'],
                'og_description': response_data['meta_data']['og_description'],
                'twitter_title': response_data['meta_data']['twitter_title'],
                'twitter_description': response_data['meta_data']['twitter_description'],
                'schema_type': response_data['meta_data']['schema_type'],
                'focus_keyword': response_data['meta_data']['focus_keyword'],
                'publisher_name': request.json.get('publisher_name', ''),
                'publisher_url': request.json.get('publisher_url', '')
            })

        return template_vars

    except Exception as e:
        print(f"Error formatting article content: {str(e)}")
        return None


@app.route('/api/generate_article', methods=['POST'])
def generate_article_api():
    try:
        # Receive the prompt and image URL from React
        data = request.get_json()
        prompt = data.get('prompt', '')
        image_url = data.get('image_url', '')

        template_name = data.get('template_name', 'article_template.html')

        # Get GPT response
        gpt_response = run_gpt4(prompt, template_name)

        # Format for template
        template_vars = format_article_content(gpt_response, format_article_content)
        template_vars['featured_image_url'] = image_url

        if template_vars is None:
            raise ValueError("Failed to format article content")

        # Return the rendered HTML content
        return jsonify({
            'headline': template_vars['headline'],
            'article_content': template_vars['article_content'],
            'featured_image_url': image_url
        })

    except Exception as e:
        return jsonify({'error': f"Failed to generate article: {str(e)}"}), 500



@app.route('/api/download_article', methods=['POST'])
def download_article_api():
    try:
        data = request.get_json()
        template_name = data.get('template_name', 'article_template.html')

        # Create template variables based on the template type
        template_vars = {
            'headline': data.get('headline', ''),
            'article_content': data.get('article_content', ''),
            'meta_description': data.get('meta_description', ''),
            'keywords': data.get('keywords', ''),
            'featured_image_url': data.get('featured_image_url', ''),
            'featured_image_alt': data.get('featured_image_alt', ''),
            'publish_date': datetime.now().strftime("%Y-%m-%d"),
            'author': data.get('author', ''),
            'publisher_name': data.get('publisher_name', ''),
            'publisher_url': data.get('publisher_url', '')
        }

        # Add template-specific variables
        if template_name == 'article_template.html':
            template_vars.update({
                'article_title': data.get('headline', ''),
                'short_title': data.get('short_title', ''),
                'article_category': data.get('article_category', ''),
                'slug': data.get('slug', ''),
                'og_title': data.get('og_title', ''),
                'og_description': data.get('og_description', ''),
                'twitter_title': data.get('twitter_title', ''),
                'twitter_description': data.get('twitter_description', ''),
                'schema_type': data.get('schema_type', 'Article'),
                'focus_keyword': data.get('focus_keyword', '')
            })
        elif template_name in ['match_report_template.html', 'ss_match_report_template.html']:
            template_vars.update({
                'home_team': data.get('home_team', ''),
                'away_team': data.get('away_team', ''),
                'home_score': data.get('home_score', ''),
                'away_score': data.get('away_score', ''),
                'competition': data.get('competition', ''),
                'match_date': data.get('match_date', ''),
                'venue': data.get('venue', ''),
                'home_lineup': data.get('home_lineup', ''),
                'away_lineup': data.get('away_lineup', ''),
                'key_events': data.get('key_events', ''),
                'match_stats': {
                    'possession': {
                        'home': data.get('home_possession', 50),
                        'away': data.get('away_possession', 50)
                    },
                    'shots': {
                        'home': data.get('home_shots', 0),
                        'away': data.get('away_shots', 0)
                    },
                    'shots_on_target': {
                        'home': data.get('home_shots_on_target', 0),
                        'away': data.get('away_shots_on_target', 0)
                    },
                    'corners': {
                        'home': data.get('home_corners', 0),
                        'away': data.get('away_corners', 0)
                    },
                    'fouls': {
                        'home': data.get('home_fouls', 0),
                        'away': data.get('away_fouls', 0)
                    },
                    'yellow_cards': {
                        'home': data.get('home_yellow_cards', 0),
                        'away': data.get('away_yellow_cards', 0)
                    },
                    'red_cards': {
                        'home': data.get('home_red_cards', 0),
                        'away': data.get('away_red_cards', 0)
                    },
                    'offsides': {
                        'home': data.get('home_offsides', 0),
                        'away': data.get('away_offsides', 0)
                    },
                    'xg': {
                        'home': float(data.get('home_xg', 0.0)),
                        'away': float(data.get('away_xg', 0.0))
                    }
                }
            })
        elif template_name == 'ss_player_scout_report_template.html':
            template_vars.update({
                'player_name': data.get('player_name', ''),
                'player_position': data.get('player_position', ''),
                'player_age': data.get('player_age', ''),
                'player_nationality': data.get('player_nationality', ''),
                'favored_foot': data.get('favored_foot', ''),
                'scout_stats': data.get('scout_stats', ''),
                'summary': data.get('summary', ''),
                'form_summary': data.get('form_summary', {}),
                'recent_matches': data.get('recent_matches', [])
            })

        rendered_html = render_template(template_name, **template_vars)

        buffer = io.BytesIO()
        buffer.write(rendered_html.encode('utf-8'))
        buffer.seek(0)

        filename = f"{data.get('headline', 'article').replace(' ', '-')}.html"

        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='text/html'
        )

    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({'error': str(e)}), 500


def parse_recent_form(form_text):
    lines = form_text.split('\n')
    
    # Parse summary line: "Total: 3 goals from 10 shots (8 on target, 1.11 xG)"
    summary = {}
    if lines and lines[1].startswith('Total:'):
        summary_line = lines[1]
        summary['goals'] = int(summary_line.split(' goals')[0].split(': ')[1])
        summary['shots'] = int(summary_line.split('from ')[1].split(' shots')[0])
        summary['on_target'] = int(summary_line.split('(')[1].split(' on')[0])
        summary['xg'] = float(summary_line.split(', ')[1].split(' xG')[0])
    
    # Parse matches (your existing parse_recent_matches logic)
    matches = []
    for line in lines[3:]:  # Skip header and summary lines
        if line.startswith('- vs'):
            # Parse: "- vs Nottm Forest (H): 0 goals from 1 shots (1 on target, 0.03 xG)"
            match_data = {}
            
            # Get opponent and venue
            team_venue = line.split('- vs ')[1].split(':')[0]
            match_data['opponent'] = team_venue.split(' (')[0]
            match_data['venue'] = 'Home' if '(H)' in team_venue else 'Away'
            
            # Get stats
            stats = line.split(': ')[1]
            match_data['goals'] = int(stats.split(' goals')[0])
            match_data['shots'] = int(stats.split('from ')[1].split(' shots')[0])
            match_data['on_target'] = int(stats.split('(')[1].split(' on')[0])
            match_data['xg'] = float(stats.split(', ')[1].split(' xG')[0])
            
            matches.append(match_data)
    
    return summary, matches


if __name__ == '__main__':
    app.run(debug=True)