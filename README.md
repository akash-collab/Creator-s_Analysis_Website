# YouTube Sentiment Analysis

A web application for analyzing sentiment of YouTube video comments using natural language processing. This project provides a modern web interface for video analysis with interactive charts and downloadable reports.

## Features

- **Web Interface**: Modern, responsive web application for video analysis
- **Sentiment Analysis**: Uses TextBlob for accurate sentiment classification
- **Comment Analysis**: Analyzes up to 100 comments per video
- **Top Words**: Extracts and displays most common adjectives
- **PDF Reports**: Generate downloadable PDF reports with analysis results
- **Real-time Charts**: Interactive charts showing sentiment distribution

## Project Structure

```
youtube_sentiment_analysis/
├── backend/                 # Flask backend server
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── static/            # Frontend files served by Flask
│   └── templates/         # HTML templates
├── frontend/              # Original frontend files
│   ├── index.html         # Main web interface
│   ├── scripts.js         # Frontend JavaScript
│   └── styles.css         # CSS styling
└── README.md             # This file
```

## Prerequisites

- **Python 3.11+**
- **Google YouTube Data API v3 Key**

## Setup Instructions

### 1. Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Copy your API key

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Edit .env file and add your YouTube API key
# YOUTUBE_API_KEY=your_actual_api_key_here
```

### 3. Run the Backend Server

```bash
# Make sure you're in the backend directory with venv activated
python app.py
```

The server will start on `http://localhost:5001`

## Usage

### Web Interface

1. Open your browser and go to `http://localhost:5001`
2. Enter a YouTube video URL
3. Click "Analyze" to start the analysis
4. View the results:
   - Video details (title, channel, likes/dislikes)
   - Sentiment analysis charts
   - Top adjectives used in comments
5. Click "Download Report" to get a PDF report

## API Endpoints

### POST /analyze
Analyzes a YouTube video's comments for sentiment.

**Request:**
```json
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "video_details": {
    "video_title": "Video Title",
    "channel_name": "Channel Name",
    "published_at": "2023-01-01T00:00:00Z",
    "thumbnail_url": "https://...",
    "like_count": 1000,
    "dislike_count": 50
  },
  "sentiment_analysis": {
    "positive": 60,
    "negative": 20,
    "neutral": 20
  },
  "top_words": [
    ["amazing", 15],
    ["great", 12],
    ["awesome", 10]
  ],
  "total_comments": 100
}
```

### POST /download_report
Generates a PDF report of the analysis.

**Request:** Same as analyze endpoint
**Response:** PDF file download

## Technical Details

### Sentiment Analysis
- Uses **TextBlob** library for natural language processing
- Classifies comments as Positive, Negative, or Neutral
- Threshold: >0.1 (positive), <-0.1 (negative), otherwise neutral

### Comment Analysis
- Fetches up to 100 most relevant comments
- Extracts adjectives for word frequency analysis
- Handles YouTube API rate limits gracefully

### Frontend
- Modern glass morphism design
- Interactive charts using Chart.js
- Responsive layout for all devices
- Real-time API communication

## Troubleshooting

### Common Issues

1. **"YOUTUBE_API_KEY environment variable is required"**
   - Make sure you've created a `.env` file in the backend directory
   - Ensure your API key is correctly set

2. **"Invalid YouTube URL"**
   - Supported formats:
     - `https://www.youtube.com/watch?v=VIDEO_ID`
     - `https://youtu.be/VIDEO_ID`
     - `https://www.youtube.com/embed/VIDEO_ID`

3. **"No comments found"**
   - Some videos have comments disabled
   - Try a different video with enabled comments

4. **API Quota Exceeded**
   - YouTube API has daily quotas
   - Consider upgrading your API plan for more requests

### Rate Limits
- YouTube Data API v3 has quotas
- Free tier: 10,000 units per day
- Each request costs 1-5 units depending on endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the YouTube Data API documentation
3. Open an issue on GitHub
