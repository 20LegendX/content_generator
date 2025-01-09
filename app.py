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
            "http://localhost:3000",
            "http://127.0.0.1:5000",
            "http://13.60.61.227",  # Your EC2 IP
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"],
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

        # Validate required fields
        required_fields = ['topic', 'keywords', 'context', 'supporting_data']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Generate the GPT prompt
        prompt = create_prompt(data)

        # Run GPT to generate the article content
        gpt_response = run_gpt4(prompt)

        # Format the GPT response into HTML-ready content
        formatted_content = format_article_content(gpt_response)

        if not formatted_content:
            return jsonify({'error': 'Failed to generate article content'}), 500

        # Return the formatted content to React
        return jsonify({
            'prompt': prompt,
            'article_content': formatted_content['article_content'],
            'headline': formatted_content['headline'],
            'featured_image_alt': formatted_content['featured_image_alt'],
            'meta_description': formatted_content['meta_description']
        })

    except Exception as e:
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
    """
    Generate a dynamic prompt that combines fixed structural elements with user-provided content.

    Parameters:
    - user_input (dict): Contains:
        - topic: Main subject of the article
        - context: Additional context/angle for the article
        - supporting_data: Any statistics, quotes, or data to include
        - keywords: SEO keywords to incorporate

    Returns:
    - str: A tailored prompt for GPT.
    """
    prompt = f"""
    Write a structured article about {user_input['topic']}.

    ### Required Structure:
    1. **Title**: A concise, engaging title for the article.
    2. **Headline**: A one-sentence summary of the article.
    3. **Meta Information**:
       - Meta Description: A brief SEO-friendly description (up to 150 characters)
       - Keywords: Use these terms: {user_input['keywords']}
       - Article Category: The primary category for this content
       - Featured Image Alt Text: A descriptive text for the featured image

    4. **Article Content**: Create a well-structured article with appropriate sections.

    Use the following context and data for reference:
    Context:
    {user_input['context']}

    Supporting Data:
    {user_input['supporting_data']}

    ### Writing Style:
    - Use professional UK English
    - Maintain a sophisticated, analytical tone
    - Balance narrative flow with data insights
    - Incorporate the provided supporting data naturally within the content
    """

    return prompt.strip()


def run_gpt4(prompt, model="gpt-4-turbo-preview", max_tokens=4000, temperature=0.8):
    """
    Send prompt to GPT-4 and get structured response.
    Returns JSON-formatted content ready for template.
    """
    try:
        current_date = datetime.now().strftime("%Y-%m-%d")
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


def format_article_content(gpt_response):
    """
    Convert GPT JSON response into template-ready HTML content
    """
    try:
        # Parse JSON response
        response_data = json.loads(gpt_response)

        # Format article content with semantic HTML
        html_content = []
        for section in response_data['article_content']:
            html_content.append(f'\n<section itemscope itemtype="https://schema.org/Article">\n')
            html_content.append(f'<h2 itemprop="headline">{section["heading"]}</h2>\n')

            for paragraph in section['content']:
                html_content.append(f'<p itemprop="text">{paragraph}</p>\n')

            html_content.append('</section>\n')

        # Use current date instead of GPT-provided date
        current_date = datetime.now().strftime("%Y-%m-%d")

        template_vars = {
            'article_title': response_data['template_data']['headline'],
            'short_title': response_data['template_data']['short_title'],
            'headline': response_data['template_data']['headline'],
            'featured_image_alt': response_data['template_data']['featured_image_alt'],
            'article_category': response_data['template_data']['article_category'],
            'slug': response_data['template_data']['slug'],
            'article_content': '\n'.join(html_content),

            # Meta Data
            'meta_description': response_data['meta_data']['meta_description'],
            'keywords': ', '.join(response_data['meta_data']['keywords']),
            'publish_date': current_date,  # Use current date here
            'author': response_data['meta_data']['author'],
            'og_title': response_data['meta_data']['og_title'],
            'og_description': response_data['meta_data']['og_description'],
            'twitter_title': response_data['meta_data']['twitter_title'],
            'twitter_description': response_data['meta_data']['twitter_description'],
            'schema_type': response_data['meta_data']['schema_type'],
            'focus_keyword': response_data['meta_data']['focus_keyword'],

            # Add publisher info to template variables
            'publisher_name': request.form.get('publisher_name', ''),
            'publisher_url': request.form.get('publisher_url', ''),
        }

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

        # Get GPT response
        gpt_response = run_gpt4(prompt)

        # Format for template
        template_vars = format_article_content(gpt_response)
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
        # Receive article data from React
        data = request.get_json()

        # Extract content and metadata
        headline = data.get('headline', 'article')
        article_content = data.get('article_content', '')
        featured_image_url = data.get('featured_image_url', '')

        # Render the HTML template
        rendered_html = render_template(
            'download_template.html',
            headline=headline,
            article_content=article_content,
            featured_image_url=featured_image_url,
            featured_image_alt=data.get('featured_image_alt', ''),
            article_category=data.get('article_category', ''),
            meta_description=data.get('meta_description', ''),
            keywords=data.get('keywords', ''),
            author=data.get('author', ''),
            publish_date=data.get('publish_date', '')
        )

        # Create the downloadable file
        buffer = io.BytesIO()
        buffer.write(rendered_html.encode('utf-8'))
        buffer.seek(0)

        filename = f"{headline.lower().replace(' ', '-')}.html"

        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='text/html'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)