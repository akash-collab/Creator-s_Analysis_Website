#!/usr/bin/env python3
"""
YouTube Sentiment Analysis - Startup Script
This script helps you start the backend server with proper setup.
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 11):
        print("❌ Error: Python 3.11 or higher is required")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def check_env_file():
    """Check if .env file exists and has API key"""
    env_path = Path("backend/.env")
    if not env_path.exists():
        print("❌ Error: .env file not found in backend directory")
        print("Please create backend/.env file with your YouTube API key:")
        print("YOUTUBE_API_KEY=your_api_key_here")
        sys.exit(1)
    
    # Check if API key is set
    with open(env_path) as f:
        content = f.read()
        if "your_api_key_here" in content or "YOUTUBE_API_KEY=" not in content:
            print("❌ Error: Please set your YouTube API key in backend/.env file")
            print("YOUTUBE_API_KEY=your_actual_api_key_here")
            sys.exit(1)
    
    print("✅ Environment file configured")

def setup_virtual_environment():
    """Setup virtual environment if not exists"""
    venv_path = Path("backend/venv")
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "backend/venv"], check=True)
        print("✅ Virtual environment created")
    else:
        print("✅ Virtual environment exists")

def install_dependencies():
    """Install Python dependencies"""
    print("📦 Installing dependencies...")
    
    # Determine the correct pip path
    if os.name == 'nt':  # Windows
        pip_path = "backend/venv/Scripts/pip"
    else:  # Unix/Linux/macOS
        pip_path = "backend/venv/bin/pip"
    
    try:
        subprocess.run([pip_path, "install", "-r", "backend/requirements.txt"], check=True)
        print("✅ Dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        sys.exit(1)

def start_server():
    """Start the Flask server"""
    print("🚀 Starting YouTube Sentiment Analysis server...")
    print("📱 Web interface will be available at: http://localhost:5001")
    print("🔧 API endpoints:")
    print("   - POST /analyze - Analyze video sentiment")
    print("   - POST /download_report - Download PDF report")
    print("\nPress Ctrl+C to stop the server")
    
    # Determine the correct python path
    if os.name == 'nt':  # Windows
        python_path = "backend/venv/Scripts/python"
    else:  # Unix/Linux/macOS
        python_path = "backend/venv/bin/python"
    
    try:
        subprocess.run([python_path, "backend/app.py"])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

def main():
    """Main function"""
    print("🎬 YouTube Sentiment Analysis")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path("backend").exists():
        print("❌ Error: Please run this script from the project root directory")
        sys.exit(1)
    
    check_python_version()
    check_env_file()
    setup_virtual_environment()
    install_dependencies()
    start_server()

if __name__ == "__main__":
    main() 