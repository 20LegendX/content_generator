from flask import Flask, render_template, request, jsonify, send_file, send_from_directory
from openai import OpenAI
import json
import io
import requests
from datetime import datetime
from functools import wraps
import logging
import os
import socket
from supabase import create_client
from supabase.client import Client
import stripe
from flask import url_for
import traceback

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Changed to match your .env file


# Access your API key
api_key = os.getenv("OPENAI_API_KEY")

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)



# Suppress excessive debug logs from specific libraries
logging.getLogger('hpack').setLevel(logging.WARNING)
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)


def find_free_port(start_port=5001, max_port=5010):
    """Find a free port to use"""
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))
                return port
            except OSError:
                continue
    raise RuntimeError('No free ports found')

app = Flask(__name__, 
    static_folder="../frontend/build/static",  # Point to the static files directory
    static_url_path='/static',  # Keep the static URL path
    template_folder='templates'
)
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5001",
            "http://localhost:5001",
            "http://13.61.190.211",
            "https://pagecrafter.ai",  # Add your new domain
            "https://www.pagecrafter.ai"  # Add www version
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept", "user-id"],  # Add user-id
        "supports_credentials": True,
        "expose_headers": ["Content-Range", "X-Content-Range"]
    }
})

def check_auth():
    """Check if request has valid auth"""
    # Check for token in headers
    auth_header = request.headers.get('Authorization')
    # Check for token in URL parameters or hash
    token = request.args.get('access_token')
    hash_token = '#access_token=' in request.url

    return auth_header or token or hash_token

@app.before_request
def log_request_info():
    app.logger.debug('Headers: %s', request.headers)
    app.logger.debug('Body: %s', request.get_data())
    app.logger.debug('Path: %s', request.path)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if path.startswith('api/'):
        return {'error': 'Not Found'}, 404
    return send_from_directory('../frontend/build', 'index.html')

# Add explicit handlers for your routes to ensure they serve index.html
@app.route('/generate')
def generate_page():
    return send_from_directory('../frontend/build', 'index.html')

@app.route('/login')
def login_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/subscription')
def subscription_page():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/privacy-policy')
def privacy_policy_page():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/history')
def history_page():
    return send_from_directory('../frontend/build', 'index.html')

# Add any other routes your app uses

# Protected API routes
@app.route('/api/*')
def protected_routes():
    if not check_auth():
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'status': 'ok'})

# Initialize OpenAI client
client = OpenAI(api_key=api_key)

# Initialize Supabase client
supabase_client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return jsonify({'message': 'No authorization header'}), 401

        try:
            token = auth_header.split(' ')[1]
            # The user data is in the 'user' property of the response
            user_response = supabase_client.auth.get_user(token)
            user = user_response.user  # Get the actual user object

            # Add user to request context for use in the route
            request.user = user
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Error verifying token: {str(e)}")
            return jsonify({'message': 'Invalid token'}), 401

    return decorated

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


def get_user_id_from_token(token):
    try:
        # Verify the JWT token
        user = supabase_client.auth.get_user(token)
        return user.id
    except Exception as e:
        logger.error(f"Error verifying token: {str(e)}")
        return None

@app.route('/api/generate', methods=['POST', 'OPTIONS'])
@require_auth
def generate_api():
    try:
        print("Received request data:", request.get_json())  # Log the incoming data
        user_id = request.user.id
        print(f"Generating content for user: {user_id}")  # Add debug logging

        # Add more detailed logging for subscription check
        try:
            subscription_response = supabase_client.table('subscriptions')\
                .select('*')\
                .eq('user_id', user_id)\
                .eq('status', 'active')\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            print(f"Subscription response: {subscription_response}")  # Debug log
            
            user_subscription = {
                'plan_type': 'free',
                'articles_remaining': 3,
                'articles_generated': 0,
                'status': 'active'
            }

            if subscription_response.data:
                user_subscription = subscription_response.data[0]
                print(f"Found subscription: {user_subscription}")  # Debug log
            else:
                print("No subscription found, using default free tier")  # Debug log

            if user_subscription['articles_remaining'] <= 0 and user_subscription['plan_type'] != 'pro':
                return jsonify({
                    'error': 'No articles remaining. Please upgrade to continue generating content.'
                }), 403

        except Exception as e:
            print(f"Subscription error details: {str(e)}")  # Add detailed error logging
            logger.error(f"Supabase error: {str(e)}")
            return jsonify({'error': 'Error accessing subscription data'}), 500

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided in the request.'}), 400

        # Validate template name
        template_name = data.get('template_name', 'article_template.html')
        if template_name not in [
            'match_report_template.html',
            'ss_match_report_template.html',
            'download_template.html',
            'article_template.html',
            'ss_player_scout_report_template.html'
        ]:
            template_name = 'article_template.html'

        # Check if this is an edit request
        if 'edited_content' in data:
            formatted_content = data['edited_content']
        else:
            # Validate required fields for new content
            required_fields = ['topic', 'keywords', 'context', 'supporting_data']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

            # Generate content
            prompt = create_prompt(data)
            print(f"Created prompt: {prompt[:200]}...")

            response = run_gpt4(prompt, template_name)
            print(f"GPT response: {response[:200] if response else 'None'}")

            if not response:
                return jsonify({'error': 'Failed to generate content'}), 500

            formatted_content = format_article_content(response, template_name)
            if not formatted_content:
                return jsonify({'error': 'Failed to format article content'}), 500

        # Template-specific validation and defaults
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
            is_valid, error_message = validate_template_vars(formatted_content, template_name)
            if not is_valid:
                return jsonify({'error': error_message}), 400

        # Add match stats if needed
        if template_name == 'match_report_template.html' and 'match_stats' not in formatted_content:
            formatted_content['match_stats'] = {
                'possession': {'home': data.get('home_possession', 50), 'away': data.get('away_possession', 50)},
                'shots': {'home': data.get('home_shots', 0), 'away': data.get('away_shots', 0)},
                'shots_on_target': {'home': data.get('home_shots_on_target', 0), 'away': data.get('away_shots_on_target', 0)},
                'corners': {'home': data.get('home_corners', 0), 'away': data.get('away_corners', 0)},
                'fouls': {'home': data.get('home_fouls', 0), 'away': data.get('away_fouls', 0)},
                'yellow_cards': {'home': data.get('home_yellow_cards', 0), 'away': data.get('away_yellow_cards', 0)},
                'red_cards': {'home': data.get('home_red_cards', 0), 'away': data.get('away_red_cards', 0)},
                'offsides': {'home': data.get('home_offsides', 0), 'away': data.get('away_offsides', 0)}
            }

        try:
            # Render template
            preview_html = render_template(
                template_name,
                preview_mode=True,
                **formatted_content
            )
        except Exception as template_error:
            print(f"Template rendering error: {str(template_error)}")
            return jsonify({'error': f'Template rendering failed: {str(template_error)}'}), 500

        # Update subscription for all users
        supabase_client.table('subscriptions')\
            .update({
                'articles_remaining': user_subscription['articles_remaining'] - 1,
                'articles_generated': user_subscription['articles_generated'] + 1
            })\
            .eq('user_id', user_id)\
            .execute()

        return jsonify({
            'preview_html': preview_html,
            'raw_content': {
                'template_name': template_name,
                'theme': formatted_content.get('theme', {}),
                **formatted_content
            }
        })

    except Exception as e:
        print(f"Error in generate_api: {str(e)}")  # Log any errors
        traceback.print_exc()  # Print the full stack trace
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/session', methods=['GET'])
def get_session():
    try:
        # This will be used to check if user is authenticated
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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


import json


def create_prompt(user_input):
    """Generate a refined dynamic prompt for the article while preventing invented content."""
    template_name = user_input.get('template_name', 'article_template.html')
    article_type = user_input.get('article_type', 'general')

    # Define natural writing style personas
    style_guides = {
        'tech': """Write this article like an experienced tech journalist. 
                   Make complex concepts effortless to understand, 
                   like explaining to a smart but non-expert friend. 
                   Keep the tone confident yet engaging, avoiding dry or robotic phrasing.""",

        'travel': """Write this article like a seasoned travel writer, 
                     painting vivid pictures of places, smells, and sounds. 
                     Blend practical insights with immersive storytelling, 
                     making the reader feel like they're right there with you.""",

        'sports': """Write this article like a professional football journalist 
                     with deep knowledge of tactics, player development, and match analysis.  
                     Avoid over-the-top enthusiasm—focus on expert insight and factual precision.""",

        'business': """Write this article like a respected business analyst, 
                       breaking down complex ideas into clear, actionable insights.  
                       Keep the tone authoritative yet engaging, avoiding corporate jargon.""",

        'general': """Write this article like an experienced feature writer, 
                      crafting engaging, informative content with a natural, 
                      flowing rhythm that keeps the reader engaged."""
    }

    style_guide = style_guides.get(article_type, style_guides['general'])

    # **Strictly prevent fabricated events**
    factual_constraint = """
    IMPORTANT: You must NOT invent or fabricate real-world events. 
    - Stick to verifiable facts.  
    - If details are missing, **do NOT assume or create additional information**.  
    - Always prioritize journalistic integrity—accuracy over speculation.
    """

    # **Natural tone guidelines**
    natural_tone_guidelines = """
    To ensure a **clear, factual, and professional tone**, follow these principles:

    ✅ **Stick to the facts.**  
       - Avoid words like **"unprecedented,"** **"transformational,"** **"game-changing,"** or **"remarkable success."**  
       - Instead, describe the **actual impact in neutral terms.**  

    ✅ **Avoid dramatic or sweeping statements.**  
       - ❌ "This marks a turning point in history."  
       - ✅ "This change may influence how teams prepare for next season."  

    ✅ **Use precise descriptions.**  
       - ❌ "This mind-blowing innovation is set to revolutionize everything."  
       - ✅ "This update introduces new capabilities for users, improving efficiency."  

    ✅ **Avoid promotional language.**  
       - ❌ "This incredible player is the best in the world right now!"  
       - ✅ "This player has delivered consistently high performances this season."  

    ✅ **Stay focused on the provided topic and data.**  
       - **Do NOT introduce unrelated details, assumptions, or personal opinions.**  

    **REMEMBER:**  
    - **Journalism is about clarity and accuracy, not hype.**  
    - Keep descriptions factual and let the **data tell the story.**
    - Write in a natural, engaging way—let ideas flow rather than rigidly structuring sections.

    """

    # **Universal Writing Guidelines** applied to all templates
    universal_prompt = f"""
    {style_guide}

    {factual_constraint}

    {natural_tone_guidelines}

    ### Key Writing Guidelines:
    - **Write a detailed article that fully explores the subject.**
    - **Stay strictly focused on the topic '{user_input['topic']}'.**
    - **Avoid dramatic language, sweeping statements, or exaggerated claims.**
    - **Ensure a well-structured article with at least 3-4 paragraphs per major section.**
    - **Use real-world examples and data to support arguments.**
    """

    # **Template-Specific Prompts**
    if template_name == 'article_template.html':
        prompt = f"""Write a structured article about {user_input['topic']}.

        {universal_prompt}

        ### Required Structure:
        1. **Title**: Create an engaging, attention-grabbing title.
        2. **Headline**: Write a compelling one-sentence summary.
        3. **Meta Information**:
           - Meta Description: A natural, SEO-friendly description (max 150 characters).
           - Keywords: Naturally incorporate these terms: {user_input.get('keywords', '')}.
           - Article Category: {article_type.capitalize()}.
           - Featured Image Alt Text: A descriptive text for the featured image.

        4. **Article Content:**  
           - **Each major section must have at least 3-4 paragraphs.**
           - **Expand on each point using supporting data and context.**
           - **Use real-world examples where relevant.**
           - **Ensure the article fully explores the subject.**

        Use this context and data to inform your writing:
        Context:
        {user_input.get('context', 'No context provided.')}

        Supporting Data:
        {user_input.get('supporting_data', 'No supporting data provided.')}

        ### **Final Reminder:**
        - **Stay strictly focused on '{user_input['topic']}'.**
        - **Do NOT assume or fabricate missing details.**
        """

    elif template_name in ['ss_match_report_template.html', 'match_report_template.html']:
        prompt = f"""
        Write a professional match report for {user_input['home_team']} vs {user_input['away_team']} using ONLY the provided information.
        {universal_prompt}

        ### Data Provided
        **Score**: {user_input['home_team']} {user_input['home_score']} - {user_input['away_score']} {user_input['away_team']}
        **Competition**: {user_input['competition']}
        **Venue**: {user_input['venue']}
        **Date**: {user_input['match_date']}

        **Goals**:
        - {user_input['home_team']}: {user_input.get('home_scorers', 'None')}
        - {user_input['away_team']}: {user_input.get('away_scorers', 'None')}

        **Match Statistics**:
        - xG: {user_input['home_team']} {user_input.get('home_xg', 0)} vs {user_input.get('away_xg', 0)} {user_input['away_team']}
        - Possession: {user_input.get('home_possession')}% vs {user_input.get('away_possession')}%
        - Shots: {user_input.get('home_shots')} ({user_input.get('home_shots_on_target')} on target) vs {user_input.get('away_shots')} ({user_input.get('away_shots_on_target')} on target)

        ### Writing Instructions:
        - **Match Overview** (introduction + final result).
        - **Match Analysis** (statistics-driven breakdown).
        - **Key Moments** (ONLY if explicit key events exist).

        **Final Reminder:**
        - **Stick to the provided data.**
        - **Do NOT assume or fabricate missing details.**
        """

    elif template_name == 'ss_player_scout_report_template.html':
        prompt = f"""
        Write a professional scout report about {user_input.get('player_name', 'Unknown Player')}.
        {universal_prompt}

        ### Provided Data:
        - Position: {user_input.get('player_position', '')}
        - Age: {user_input.get('player_age', '')}
        - Nationality: {user_input.get('player_nationality', '')}
        - Favoured Foot: {user_input.get('favored_foot', '')}
        - Stats: {json.dumps(user_input.get('scout_stats', {}), indent=2)}

        ### Writing Requirements:
        - Expand on each attribute in full detail.
        - Avoid brief, summary-like descriptions.
        - Ensure stats and context are naturally woven into the narrative.

        **Final Reminder:**
        - **Stay strictly focused on '{user_input['topic']}'.**
        - **Do NOT assume or fabricate missing details.**
        """

    return prompt

import json

def run_gpt4(prompt, template_name, model="gpt-4o", max_tokens=16000, temperature=0.7, top_p=0.9):
    """Send prompt to GPT-4 and get structured response."""
    print("Using model:", model)  # Debug log
    print("Sending prompt:", prompt[:500] + "...")  # Debug first 500 chars of prompt

    try:
        # **Universal System Prompt** ensuring consistency across all templates
        universal_system_prompt = """
        You are a professional journalist and analyst. Your task is to generate a structured, well-written, and engaging response based on the provided input.

        ### Writing Guidelines:
        - **Keep responses detailed and informative**—each major section should contain **at least 3-4 paragraphs**.
        - **Maintain strict focus on the provided topic**—avoid unrelated tangents.
        - **Avoid dramatic language, exaggeration, or sweeping statements**.
        - **Stick to real-world data**—do **not** assume or fabricate missing details.
        - **Ensure responses are formatted as structured JSON**.
        - **Write in a natural, engaging tone**—avoid robotic phrasing.
        - **Vary sentence structure**—mix short, punchy lines with longer, flowing sentences.
        - **Use contractions** (e.g., "he’s" instead of "he is") for a more conversational feel.
        - **Avoid overly formal or passive phrases**—write like a human, not a report.
        - **Use real-world examples, context, and subtle emotion to enhance storytelling.**
        - **Ensure smooth transitions between ideas**—avoid abrupt sectioning.
        - **Strictly follow the provided topic and data**—do NOT introduce unrelated details.
        

        Your response **must be well-structured and follow the format outlined below**.
        """

        # **Template-Specific Prompts**
        if template_name in ['match_report_template.html', 'ss_match_report_template.html']:
            system_prompt = f"""{universal_system_prompt}

            You are an expert sports journalist specializing in match reports. Your job is to **write a structured, professional match report** using only the provided data.

            Return your response in the following JSON format:
            {{
                "template_data": {{
                    "headline": string,  // Engaging match headline
                    "match_summary": string,  // Brief overview of the match
                    "featured_image_alt": string
                }},
                "meta_data": {{
                    "meta_description": string,
                    "keywords": array of strings,
                    "og_title": string,
                    "og_description": string,
                    "twitter_title": string,
                    "twitter_description": string
                }},
                "match_report": [
                    {{
                        "type": string,  
                        "heading": string,
                        "content": array of strings (paragraphs)
                    }}
                ],
                "match_stats": {{
                    "possession": object,  // e.g., {{"home": 60, "away": 40}}
                    "shots_on_target": object,
                    "corners": object,
                    "key_events": array of objects  // e.g., [{{"time": "23'", "event": "Goal", "team": "home"}}]
                }}
            }}

            ### Report Guidelines:
            - **Ensure that all analysis is backed by provided statistics**.
            - **Avoid subjective opinions or speculative statements**.
            - **Write in a natural, journalistic tone**—concise, informative, and engaging.
            - **Use appropriate football terminology** (e.g., "high press," "deep block," "clinical finishing").
            """

        elif template_name == 'ss_player_scout_report_template.html':
            system_prompt = f"""{universal_system_prompt}

            You are a professional football analyst specializing in writing scout reports. Your task is to provide an **in-depth, structured scouting analysis** of a player based on the provided data.

            Return your response in the following JSON format:
            {{
                "template_data": {{
                    "headline": string,  // Engaging report title
                    "summary": string,  // Brief summary of the report
                    "featured_image_alt": string
                }},
                "meta_data": {{
                    "meta_description": string,
                    "keywords": array of strings,
                    "og_title": string,
                    "og_description": string,
                    "twitter_title": string,
                    "twitter_description": string
                }},
                "scout_report": [
                    {{
                        "type": "section",
                        "heading": string,  // Section heading
                        "content": array of strings (single paragraph or cohesive blocks)
                    }}
                ]
            }}

            ### Scouting Report Guidelines:
            - **Ensure each section contains detailed analysis** (minimum **3-4 paragraphs per section**).
            - **Avoid over-reliance on statistics**—explain how the numbers translate into performance.
            - **Discuss technical ability, tactical understanding, physical attributes, and mentality**.
            - **Maintain an objective, data-driven perspective**—do not overhype or make speculative claims.
            """

        else:  # General articles
            system_prompt = f"""{universal_system_prompt}

            You are an experienced journalist with expertise in writing structured, well-researched articles. Your task is to produce a **cohesive, insightful article** on the given topic.

            Return your response in the following JSON format:
            {{
                "template_data": {{
                    "headline": string,  // Engaging article title
                    "short_title": string,  // One-sentence summary
                    "featured_image_alt": string,  // SEO-optimized alt text for the featured image
                    "article_category": string,
                    "slug": string  // URL-friendly version of title
                }},
                "meta_data": {{
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
                }},
                "article_content": [
                    {{
                        "type": "section",
                        "heading": string,
                        "content": array of strings 
                    }}
                ]
            }}

            ### Article Writing Guidelines:
            - **Each major section must have at least 3-4 paragraphs**.
            - **Use real-world examples, data, and analysis to support claims**.
            - **Maintain an engaging, yet neutral tone**—no hyperbole or exaggerated statements.
            - **Ensure a smooth narrative flow between sections**—avoid robotic, list-based structures.
            - **Write as if you're recounting a memorable story to a friend—let your language flow naturally.
            - **Add subtle personal touches and natural expressions, but keep it factual and precise.
            """

        # **Call OpenAI API with structured input**
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": str(prompt)}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            response_format={"type": "json_object"}
        )

        # **Retrieve and return the response**
        response = completion.choices[0].message.content.strip()
        print("Got OpenAI response:", response[:200] + "...")  # Debug first 200 chars of response
        return response

    except Exception as e:
        print(f"OpenAI error details: {str(e)}")  # Debug log
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
            'hero_image_position': 'center center',
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
                },
                'theme': request.json.get('theme', {}),
                'hero_image_position': request.json.get('hero_image_position', 'center center')
            })

        elif template_type in ['match_report_template.html', 'ss_match_report_template.html']:
            # For updates, the content might come directly rather than in sections
            if isinstance(gpt_response, dict) and 'article_content' in gpt_response:
                # Direct content update
                template_vars.update({
                    'headline': gpt_response.get('headline', ''),
                    'match_summary': gpt_response.get('match_summary', ''),
                    'article_content': gpt_response.get('article_content', ''),
                    'meta_description': gpt_response.get('meta_description', ''),
                    # ... preserve other fields ...
                })
            else:
                # Original content generation path
                match_content = []
                for section in response_data['match_report']:
                    match_content.append(f'\n<div class="ss-match-section">\n')
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
                    },
                    'theme': request.json.get('theme', {}),
                    'hero_image_position': request.json.get('hero_image_position', 'center center')
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
                'meta_title': response_data['template_data'].get('headline', 'Default Headline'),
                'title': response_data['template_data'].get('headline', 'Default Headline'),
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
                'recent_matches': recent_matches,  # Add the parsed matches data
                'hero_image_position': request.json.get('hero_image_position', 'center center'),
                'theme': request.json.get('theme', {}),
                'hero_image_position': request.json.get('hero_image_position', 'center center')
            })


        elif template_type == 'article_template.html':

            html_content = []
            main_headline = response_data['template_data'].get('headline', '')

            for section in response_data['article_content']:
                # If section heading is the same as main_headline, skip it.
                # Or skip if you just don't want any repeated top-level headings.
                if section.get('heading') and section["heading"] == main_headline:
                    continue

                if 'heading' in section:
                    html_content.append(f'<h2>{section["heading"]}</h2>')

                for paragraph in section['content']:
                    clean_paragraph = paragraph.replace('<p>', '').replace('</p>', '').strip()
                    html_content.append(f'<p>{clean_paragraph}</p>')

            # Create template_vars exactly like in download_article_api (no match stats)
            template_vars.update({
                "headline": response_data['template_data'].get('headline', ''),
                "article_title": response_data['template_data'].get('headline', ''),
                "article_content": '\n'.join(html_content),  # Join as single HTML string
                "featured_image_url": request.json.get("image_url", default_image_url),
                "featured_image_alt": response_data['template_data'].get('featured_image_alt', default_image_alt),
                "meta_description": response_data['meta_data'].get('meta_description', ''),
                "meta_title": response_data['template_data'].get('headline', ''),
                "title": response_data['template_data'].get('headline', ''),
                "keywords": response_data['meta_data'].get('keywords', ''),
                "publish_date": current_date,
                "author": response_data['meta_data'].get('author', ''),
                "publisher_name": request.json.get("publisher_name", ''),
                "og_title": response_data['meta_data'].get('og_title', ''),
                "og_description": response_data['meta_data'].get('og_description', ''),
                "twitter_title": response_data['meta_data'].get('twitter_title', ''),
                "twitter_description": response_data['meta_data'].get('twitter_description', ''),
                'hero_image_position': request.json.get('hero_image_position', 'center center'),
                'theme': request.json.get('theme', {}),
                'hero_image_position': request.json.get('hero_image_position', 'center center')
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
                'hero_image_position': request.json.get('hero_image_position', 'center center'),
                'theme': request.json.get('theme', {}),
                'hero_image_position': request.json.get('hero_image_position', 'center center')
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
        template_vars = format_article_content(gpt_response, template_name)
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
def download_article():
    try:
        content = request.json
        template_name = content.get('template_name', 'article_template.html')

        # Create template variables based on the template type
        template_vars = {
            'headline': content.get('headline', ''),
            'article_content': content.get('article_content', ''),
            'meta_description': content.get('meta_description', ''),
            'keywords': content.get('keywords', ''),
            'featured_image_url': content.get('featured_image_url', ''),
            'featured_image_alt': content.get('featured_image_alt', ''),
            'publish_date': datetime.now().strftime("%Y-%m-%d"),
            'author': content.get('author', ''),
            'publisher_name': content.get('publisher_name', ''),
            'hero_image_position': content.get('hero_image_position', 'center 50%'),
            'theme': content.get('theme', {})
        }

        # Add template-specific variables
        if template_name == 'article_template.html':
            template_vars.update({
                'article_title': content.get('headline', ''),
                'short_title': content.get('short_title', ''),
                'article_category': content.get('article_category', ''),
                'slug': content.get('slug', ''),
                'og_title': content.get('og_title', ''),
                'og_description': content.get('og_description', ''),
                'twitter_title': content.get('twitter_title', ''),
                'twitter_description': content.get('twitter_description', ''),
                'schema_type': content.get('schema_type', 'Article'),
                'focus_keyword': content.get('focus_keyword', '')
            })
        elif template_name in ['match_report_template.html', 'ss_match_report_template.html']:
            template_vars.update({
                'home_team': content.get('home_team', ''),
                'away_team': content.get('away_team', ''),
                'home_score': content.get('home_score', ''),
                'away_score': content.get('away_score', ''),
                'competition': content.get('competition', ''),
                'match_date': content.get('match_date', ''),
                'venue': content.get('venue', ''),
                'home_lineup': content.get('home_lineup', ''),
                'away_lineup': content.get('away_lineup', ''),
                'key_events': content.get('key_events', ''),
                'match_stats': content.get('match_stats', {})  # Just pass through the match_stats object directly
            })
        elif template_name == 'ss_player_scout_report_template.html':
            template_vars.update({
                'player_name': content.get('player_name', ''),
                'player_position': content.get('player_position', ''),
                'player_age': content.get('player_age', ''),
                'player_nationality': content.get('player_nationality', ''),
                'favored_foot': content.get('favored_foot', ''),
                'scout_stats': content.get('scout_stats', ''),
                'summary': content.get('summary', ''),
                'form_summary': content.get('form_summary', {}),
                'recent_matches': content.get('recent_matches', [])
            })

        rendered_html = render_template(template_name, **template_vars)

        buffer = io.BytesIO()
        buffer.write(rendered_html.encode('utf-8'))
        buffer.seek(0)

        filename = f"{content.get('headline', 'article').replace(' ', '-')}.html"

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


# Add this route handler
@app.route('/auth/callback')
def auth_callback():
    return send_from_directory('../frontend/build', 'index.html')

# Add this route handler (similar to auth_callback)
@app.route('/subscription/success')
def subscription_success():
    return send_from_directory('../frontend/build', 'index.html')

@app.route('/subscription/cancel')
def subscription_cancel():
    return send_from_directory('../frontend/build', 'index.html')


# Initialize Stripe with your secret key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


def handle_preflight():
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', request.origin or 'http://127.0.0.1:5001')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


@app.route('/api/create-checkout-session', methods=['POST', 'OPTIONS'])
def create_checkout_session():
    if request.method == "OPTIONS":
        return handle_preflight()

    try:
        # Get origin from request headers
        frontend_url = request.origin or 'http://127.0.0.1:5001'

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'message': 'No authorization header'}), 401

        token = auth_header.split(' ')[1]
        user_response = supabase_client.auth.get_user(token)
        user = user_response.user

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': os.getenv('STRIPE_PRICE_ID'),
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f'{frontend_url}/subscription/success',  # Uses request origin
            cancel_url=f'{frontend_url}/subscription/cancel',    # Uses request origin
            client_reference_id=user.id,
            customer_email=user.email,
            metadata={
                'user_id': user.id,
            }
        )

        return jsonify({'url': checkout_session.url})

    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/webhook', methods=['POST'])
def webhook():
    event = None
    payload = request.data
    sig_header = request.headers['STRIPE_SIGNATURE']

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {str(e)}")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {str(e)}")
        return jsonify({'error': 'Invalid signature'}), 400

    # Handle the checkout.session.completed event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        # Add debug logging
        logger.debug(f"Received checkout.session.completed event: {session}")

        # Safely get user_id from metadata, with fallback for testing
        user_id = session.get('metadata', {}).get('user_id')
        if not user_id:
            logger.warning("No user_id in metadata, this might be a test event")
            return jsonify({'status': 'success', 'note': 'Test event ignored'}), 200

        try:
            # Get subscription ID safely
            subscription_id = session.get('subscription')
            customer_id = session.get('customer')

            if not subscription_id or not customer_id:
                logger.warning("Missing subscription or customer ID")
                return jsonify({'status': 'success', 'note': 'Missing required IDs'}), 200

            supabase_client.table('subscriptions')\
                .update({
                    'plan_type': 'pro',
                    'status': 'active',
                    'articles_remaining': 50,
                    'monthly_limit': 50,
                    'billing_cycle_start': datetime.now().date().isoformat(),
                    'stripe_subscription_id': subscription_id,
                    'stripe_customer_id': customer_id
                })\
                .eq('user_id', user_id)\
                .execute()

            logger.info(f"Successfully updated subscription for user {user_id}")

        except Exception as e:
            logger.error(f"Error updating subscription: {str(e)}")
            return jsonify({'error': str(e)}), 500

    return jsonify({'status': 'success'})

@app.route('/api/render-template', methods=['POST'])
@require_auth
def render_template_preview():
    try:
        content = request.json.get('content', {})
        template_name = request.json.get('template_name', 'article_template.html')
        theme = request.json.get('theme', {})

        template_vars = {
            'headline': content.get('headline', ''),
            'article_title': content.get('headline', ''),
            'article_content': content.get('article_content', ''),
            'meta_description': content.get('meta_description', ''),
            'keywords': content.get('keywords', ''),
            'featured_image_url': content.get('featured_image_url', ''),
            'featured_image_alt': content.get('featured_image_alt', ''),
            'publish_date': datetime.now().strftime("%Y-%m-%d"),
            'author': content.get('author', ''),
            'publisher_name': content.get('publisher_name', ''),
            'hero_image_position': content.get('hero_image_position', 'center 50%'),
            'theme': theme,
        }

        # Add match-specific data for match report template
        if template_name in ['match_report_template.html', 'ss_match_report_template.html']:
            template_vars.update({
                'home_team': content.get('home_team', ''),
                'away_team': content.get('away_team', ''),
                'home_score': content.get('home_score', ''),
                'away_score': content.get('away_score', ''),
                'competition': content.get('competition', ''),
                'match_date': content.get('match_date', ''),
                'venue': content.get('venue', ''),
                'home_lineup': content.get('home_lineup', ''),
                'away_lineup': content.get('away_lineup', ''),
                'match_stats': content.get('match_stats', {
                    'possession': {'home': 50, 'away': 50},
                    'shots': {'home': 0, 'away': 0},
                    'shots_on_target': {'home': 0, 'away': 0},
                    'corners': {'home': 0, 'away': 0},
                    'fouls': {'home': 0, 'away': 0},
                    'yellow_cards': {'home': 0, 'away': 0},
                    'red_cards': {'home': 0, 'away': 0},
                    'offsides': {'home': 0, 'away': 0},
                    'xg': {'home': 0.0, 'away': 0.0}
                })
            })

        # For preview, we only want to render the article content without nav and footer
        preview_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                html, body {{
                    background-color: {theme.get('colors', {}).get('background', '#0b0c1f')};
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                }}
                .preview-wrapper {{
                    background-color: {theme.get('colors', {}).get('background', '#0b0c1f')};
                    min-height: 100vh;
                    padding: 0;
                    margin: 0;
                }}
            </style>
        </head>
        <body>
            <div class="preview-wrapper">
                {render_template(template_name, preview_mode=True, **template_vars)}
            </div>
        </body>
        </html>
        """
        
        return jsonify({'preview_html': preview_html})

    except Exception as e:
        print(f"Template rendering error: {str(e)}")
        return jsonify({'error': f'Template rendering failed: {str(e)}'}), 500

@app.route('/api/debug/env', methods=['GET'])
def debug_env():
    return jsonify({
        'has_supabase_url': bool(os.getenv('SUPABASE_URL')),
        'has_supabase_key': bool(os.getenv('SUPABASE_SERVICE_KEY')),
        'env': os.getenv('FLASK_ENV'),
        'api_url': os.getenv('API_URL')
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)