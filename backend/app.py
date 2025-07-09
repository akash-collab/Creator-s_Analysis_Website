from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
import os
import re
import json
from datetime import datetime
from textblob import TextBlob
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

import io
from dotenv import load_dotenv
from collections import Counter, defaultdict
import math
from io import BytesIO

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static')
CORS(app)

# YouTube API configuration
YOUTUBE_API_KEY = os.environ.get('YOUTUBE_API_KEY', 'YOUR_API_KEY_HERE')
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_video_details(video_id):
    """Get video details from YouTube API"""
    try:
        # Get video details
        video_response = youtube.videos().list(
            part='snippet,statistics,contentDetails',
            id=video_id
        ).execute()
        
        if not video_response['items']:
            return None
            
        video_info = video_response['items'][0]
        snippet = video_info['snippet']
        statistics = video_info['statistics']
        content_details = video_info['contentDetails']
        
        # Format duration (convert ISO 8601 to readable format)
        duration = content_details.get('duration', 'PT0S')
        duration_seconds = parse_duration(duration)
        duration_formatted = format_duration(duration_seconds)
        
        # Format view count with commas
        view_count = int(statistics.get('viewCount', 0))
        view_count_formatted = f"{view_count:,}"
        
        # Format comment count with commas
        comment_count = int(statistics.get('commentCount', 0))
        comment_count_formatted = f"{comment_count:,}"
        
        # Format like count with commas
        like_count = int(statistics.get('likeCount', 0))
        like_count_formatted = f"{like_count:,}"
        
        return {
            'title': snippet['title'],
            'channel_name': snippet['channelTitle'],
            'published_at': format_date(snippet['publishedAt']),
            'thumbnail': snippet['thumbnails']['high']['url'],
            'likes': like_count_formatted,
            'dislikes': statistics.get('dislikeCount', '0'),
            'view_count': view_count_formatted,
            'comment_count': comment_count_formatted,
            'duration': duration_formatted,
            'description': snippet.get('description', '')[:200] + '...' if len(snippet.get('description', '')) > 200 else snippet.get('description', ''),
            'tags': snippet.get('tags', [])[:5]  # Top 5 tags
        }
    except HttpError as e:
        print(f"Error fetching video details: {e}")
        return None

def parse_duration(duration):
    """Parse ISO 8601 duration to seconds"""
    import re
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)
    if not match:
        return 0
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    
    return hours * 3600 + minutes * 60 + seconds

def format_duration(seconds):
    """Format seconds to HH:MM:SS or MM:SS"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes:02d}:{seconds:02d}"

def format_date(date_string):
    """Format date string to readable format"""
    from datetime import datetime
    date = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    return date.strftime('%B %d, %Y')

def get_video_comments(video_id, max_comments=100):
    """Get comments from YouTube video"""
    try:
        comments = []
        next_page_token = None
        
        while len(comments) < max_comments:
            request = youtube.commentThreads().list(
                part='snippet',
                videoId=video_id,
                maxResults=min(100, max_comments - len(comments)),
                pageToken=next_page_token,
                order='relevance'
            )
            
            response = request.execute()
            
            for item in response['items']:
                comment = item['snippet']['topLevelComment']['snippet']
                comments.append({
                    'text': comment['textDisplay'],
                    'author': comment['authorDisplayName'],
                    'likes': comment.get('likeCount', 0),
                    'published_at': comment['publishedAt'],
                    'author_channel': comment.get('authorChannelId', {}).get('value', ''),
                    'is_verified': comment.get('authorChannelId', {}).get('value') == 'UC_x5XG1OV2P6uZZ5FSM9Ttw'  # YouTube's channel
                })
            
            next_page_token = response.get('nextPageToken')
            if not next_page_token:
                break
                
        return comments
    except HttpError as e:
        print(f"Error fetching comments: {e}")
        return []

def analyze_sentiment(text):
    """Analyze sentiment of text using TextBlob"""
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    
    if polarity > 0.1:
        return 'positive'
    elif polarity < -0.1:
        return 'negative'
    else:
        return 'neutral'

def analyze_comments_sentiment(comments):
    """Analyze sentiment of all comments with enhanced analytics"""
    sentiments = {'positive': 0, 'negative': 0, 'neutral': 0}
    all_text = []
    sentiment_scores = []
    word_frequency = Counter()
    author_activity = defaultdict(int)
    verified_comments = {'positive': 0, 'negative': 0, 'neutral': 0}
    
    for comment in comments:
        sentiment = analyze_sentiment(comment['text'])
        sentiments[sentiment] += 1
        all_text.append(comment['text'])
        
        # Track sentiment scores for detailed analysis
        blob = TextBlob(comment['text'])
        sentiment_scores.append(blob.sentiment.polarity)
        
        # Track author activity
        author_activity[comment['author']] += 1
        
        # Track verified user sentiments
        if comment.get('is_verified', False):
            verified_comments[sentiment] += 1
        
        # Extract words for frequency analysis
        words = re.findall(r'\b\w+\b', comment['text'].lower())
        word_frequency.update(words)
    
    # Get top words (excluding common stop words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'his', 'hers', 'ours', 'theirs'}
    filtered_words = {word: count for word, count in word_frequency.items() 
                     if word not in stop_words and len(word) > 2}
    top_words = sorted(filtered_words.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Calculate advanced metrics
    avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
    sentiment_variance = sum((score - avg_sentiment) ** 2 for score in sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
    
    # Find most active authors
    top_authors = sorted(author_activity.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        'sentiments': sentiments,
        'top_words': top_words,
        'avg_sentiment': round(avg_sentiment, 3),
        'sentiment_variance': round(sentiment_variance, 3),
        'top_authors': top_authors,
        'verified_sentiments': verified_comments,
        'total_comments': len(comments),
        'unique_authors': len(author_activity)
    }

def generate_timeline_analysis(comments):
    """Generate timeline analysis of comments"""
    timeline = defaultdict(lambda: {'positive': 0, 'negative': 0, 'neutral': 0})
    
    for comment in comments:
        # Parse date and group by hour
        date = datetime.fromisoformat(comment['published_at'].replace('Z', '+00:00'))
        hour_key = date.strftime('%Y-%m-%d %H:00')
        
        sentiment = analyze_sentiment(comment['text'])
        timeline[hour_key][sentiment] += 1
    
    return dict(timeline)

@app.route('/')
def index():
    """Serve the main page"""
    return app.send_static_file('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_video():
    """Analyze YouTube video sentiment with enhanced features"""
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        
        if not video_url:
            return jsonify({'error': 'Video URL is required'}), 400
        
        # Extract video ID
        video_id = extract_video_id(video_url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # Get video details
        video_details = get_video_details(video_id)
        if not video_details:
            return jsonify({'error': 'Could not fetch video details'}), 400
        
        # Get comments
        comments = get_video_comments(video_id, max_comments=100)
        if not comments:
            return jsonify({'error': 'No comments found or comments disabled'}), 400
        
        # Analyze sentiment with enhanced features
        analysis_results = analyze_comments_sentiment(comments)
        
        # Generate timeline analysis
        timeline = generate_timeline_analysis(comments)
        
        return jsonify({
            'video_details': video_details,
            'sentiment_analysis': analysis_results['sentiments'],
            'top_words': analysis_results['top_words'],
            'advanced_metrics': {
                'avg_sentiment': analysis_results['avg_sentiment'],
                'sentiment_variance': analysis_results['sentiment_variance'],
                'total_comments': analysis_results['total_comments'],
                'unique_authors': analysis_results['unique_authors'],
                'engagement_rate': round(analysis_results['total_comments'] / int(video_details.get('view_count', '1').replace(',', '')) * 100, 4)
            },
            'top_authors': analysis_results['top_authors'],
            'verified_sentiments': analysis_results['verified_sentiments'],
            'timeline': timeline
        })
        
    except Exception as e:
        print(f"Error in analyze_video: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/export', methods=['POST'])
def export_data():
    """Export analysis data in CSV or JSON format"""
    try:
        data = request.get_json()
        export_format = data.get('format', 'json')
        analysis_data = data.get('analysis_data')
        
        if not analysis_data:
            return jsonify({'error': 'No analysis data provided'}), 400
        
        if export_format == 'csv':
            import csv
            from io import StringIO
            
            output = StringIO()
            writer = csv.writer(output)
            
            # Write headers
            writer.writerow(['Metric', 'Value'])
            
            # Write sentiment data
            sentiments = analysis_data.get('sentiment_analysis', {})
            for sentiment, count in sentiments.items():
                writer.writerow([f'{sentiment.title()} Comments', count])
            
            # Write advanced metrics
            advanced_metrics = analysis_data.get('advanced_metrics', {})
            for metric, value in advanced_metrics.items():
                writer.writerow([metric.replace('_', ' ').title(), value])
            
            # Write top words
            top_words = analysis_data.get('top_words', [])
            writer.writerow([])
            writer.writerow(['Word', 'Frequency'])
            for word, count in top_words:
                writer.writerow([word, count])
            
            csv_content = output.getvalue()
            output.close()
            
            response = app.response_class(
                csv_content,
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=youtube_sentiment_analysis.csv'}
            )
            return response
            
        else:  # JSON format
            response = app.response_class(
                json.dumps(analysis_data, indent=2),
                mimetype='application/json',
                headers={'Content-Disposition': 'attachment; filename=youtube_sentiment_analysis.json'}
            )
            return response
            
    except Exception as e:
        print(f"Error in export_data: {e}")
        return jsonify({'error': 'Export failed'}), 500

@app.route('/timeline', methods=['POST'])
def get_timeline_data():
    """Get detailed timeline data for visualization"""
    try:
        data = request.get_json()
        video_url = data.get('video_url')
        granularity = data.get('granularity', 'hour')  # Default to hour
        
        if not video_url:
            return jsonify({'error': 'Video URL is required'}), 400
        
        # Extract video ID
        video_id = extract_video_id(video_url)
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        # Get comments
        comments = get_video_comments(video_id, max_comments=200)  # More comments for timeline
        if not comments:
            return jsonify({'error': 'No comments found'}), 400
        
        # Generate detailed timeline with specified granularity
        timeline_data = generate_detailed_timeline(comments, granularity)
        
        return jsonify({
            'timeline': timeline_data,
            'total_comments': len(comments)
        })
        
    except Exception as e:
        print(f"Error in get_timeline_data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def generate_detailed_timeline(comments, granularity='hour'):
    """Generate detailed timeline analysis with specified granularity"""
    timeline = defaultdict(lambda: {'positive': 0, 'negative': 0, 'neutral': 0, 'total': 0})
    
    for comment in comments:
        # Parse date
        date = datetime.fromisoformat(comment['published_at'].replace('Z', '+00:00'))
        
        # Group by specified granularity
        if granularity == 'day':
            time_key = date.strftime('%Y-%m-%d')
        else:  # Default to hour
            time_key = date.strftime('%Y-%m-%d %H:00')
        
        sentiment = analyze_sentiment(comment['text'])
        
        # Update timeline data
        timeline[time_key][sentiment] += 1
        timeline[time_key]['total'] += 1
    
    # Convert to sorted list for frontend
    timeline_list = []
    for time_key, data in sorted(timeline.items()):
        timeline_list.append({
            'time': time_key,
            'positive': data['positive'],
            'negative': data['negative'],
            'neutral': data['neutral'],
            'total': data['total'],
            'sentiment_score': (data['positive'] - data['negative']) / data['total'] if data['total'] > 0 else 0
        })
    
    return timeline_list


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=False) 