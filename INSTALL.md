# Quick Installation Guide

## 🚀 Quick Start (Recommended)

1. **Get YouTube API Key**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project and enable YouTube Data API v3
   - Create an API key

2. **Setup Environment**
   ```bash
   # Copy the example environment file
   cp backend/env.example backend/.env
   
   # Edit backend/.env and add your API key
   # YOUTUBE_API_KEY=your_actual_api_key_here
   ```

3. **Run the Project**
   ```bash
   # Use the automated startup script
   python run.py
   ```

4. **Access the Web Interface**
   - Open your browser to `http://localhost:5001`
   - Enter a YouTube video URL and click "Analyze"

## 🔧 Manual Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## 📋 Requirements

- Python 3.11+
- YouTube Data API v3 Key

## 🆘 Troubleshooting

### Common Issues

1. **"YOUTUBE_API_KEY environment variable is required"**
   - Make sure you've created `backend/.env` file
   - Ensure your API key is correctly set

2. **"Invalid YouTube URL"**
   - Use full YouTube URLs like: `https://www.youtube.com/watch?v=VIDEO_ID`

3. **"No comments found"**
   - Some videos have comments disabled
   - Try a different video with enabled comments

4. **Server not starting**
   - Make sure you're in the backend directory
   - Ensure virtual environment is activated
   - Check that all dependencies are installed

### API Quota
- YouTube API has daily quotas (10,000 units free)
- Each analysis uses 1-5 units depending on comment count
- Monitor usage in Google Cloud Console

## 🎯 Usage Examples

### Web Interface
1. Go to `http://localhost:5000`
2. Enter: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Analyze"
4. View sentiment charts and download PDF report

## 📞 Support

- Check the main README.md for detailed documentation
- Review troubleshooting section above
- Open an issue on GitHub for bugs 