let currentAnalysisData = null;

async function analyzeVideo() {
    const videoUrl = document.getElementById('video-url').value;
    const response = await fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: videoUrl }),
    });

    if (response.ok) {
        const data = await response.json();
        currentAnalysisData = data;
        displayVideoDetails(data.video_details);
        displaySentimentCharts(data.sentiment_analysis);
        displayTopWords(data.top_words);
        displayWordCloud(data.top_words);
        
        // Show additional sections
        document.getElementById('timeline-section').style.display = 'block';
        document.getElementById('export-section').style.display = 'block';
    } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
    }
}

function displayVideoDetails(details) {
    document.getElementById('thumbnail').src = details.thumbnail_url;
    document.getElementById('video-title').innerText = details.video_title;
    document.getElementById('channel-name').innerText = `Channel: ${details.channel_name}`;
    document.getElementById('published-at').innerText = `Published at: ${formatDate(details.published_at)}`;
    document.getElementById('likes').innerText = `Likes: ${details.like_count}`;
    document.getElementById('dislikes').innerText = `Dislikes: ${details.dislike_count}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const daySuffix = getDaySuffix(day);
    return `${day}${daySuffix} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
}

function getDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

function displaySentimentCharts(sentiments) {
    const ctxPie = document.getElementById('sentimentPieChart').getContext('2d');
    new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                data: [sentiments.positive, sentiments.negative, sentiments.neutral],
                backgroundColor: ['#4caf50', '#f44336', '#ffeb3b'],
            }],
        },
    });

    const ctxBar = document.getElementById('sentimentBarChart').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                label: 'Sentiment Analysis',
                data: [sentiments.positive, sentiments.negative, sentiments.neutral],
                backgroundColor: ['#4caf50', '#f44336', '#ffeb3b'],
            }],
        },
    });
}

function displayTopWords(words) {
    const ctxTopWords = document.getElementById('topWordsBarChart').getContext('2d');
    const labels = words.map(word => word[0]);
    const data = words.map(word => word[1]);

    // Generate random colors for each bar
    const colors = labels.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`);

    new Chart(ctxTopWords, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Top 5 Adjectives',
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function displayWordCloud(words) {
    const wordCloudContainer = document.getElementById('wordCloud');
    wordCloudContainer.innerHTML = '';
    
    if (!words || words.length === 0) {
        wordCloudContainer.innerHTML = '<p>No words to display</p>';
        return;
    }
    
    // Create word cloud elements
    words.forEach((wordData, index) => {
        const word = wordData[0];
        const count = wordData[1];
        
        // Calculate font size based on frequency (min 12px, max 32px)
        const fontSize = Math.max(12, Math.min(32, 12 + (count * 2)));
        
        // Generate random color
        const colors = ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0', '#00bcd4', '#ff5722', '#795548'];
        const color = colors[index % colors.length];
        
        const wordElement = document.createElement('span');
        wordElement.textContent = word;
        wordElement.style.cssText = `
            display: inline-block;
            margin: 4px;
            padding: 4px 8px;
            font-size: ${fontSize}px;
            color: ${color};
            font-weight: bold;
            background-color: rgba(255, 255, 255, 0.8);
            border-radius: 15px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        `;
        
        // Add hover effect
        wordElement.addEventListener('mouseenter', () => {
            wordElement.style.transform = 'scale(1.1)';
            wordElement.style.zIndex = '10';
        });
        
        wordElement.addEventListener('mouseleave', () => {
            wordElement.style.transform = 'scale(1)';
            wordElement.style.zIndex = '1';
        });
        
        // Add tooltip
        wordElement.title = `${word}: ${count} occurrences`;
        
        wordCloudContainer.appendChild(wordElement);
    });
}

async function loadTimeline() {
    const videoUrl = document.getElementById('video-url').value;
    const granularity = document.getElementById('timeline-granularity').value;
    
    try {
        const response = await fetch('/timeline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                video_url: videoUrl,
                granularity: granularity 
            }),
        });

        if (response.ok) {
            const data = await response.json();
            displayTimelineChart(data.timeline);
        } else {
            const errorData = await response.json();
            alert(`Error loading timeline: ${errorData.error}`);
        }
    } catch (error) {
        alert('Error loading timeline data');
    }
}

function displayTimelineChart(timelineData) {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.timelineChart) {
        window.timelineChart.destroy();
    }
    
    const labels = timelineData.map(item => item.time);
    const positiveData = timelineData.map(item => item.positive);
    const negativeData = timelineData.map(item => item.negative);
    const neutralData = timelineData.map(item => item.neutral);
    
    window.timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Positive',
                    data: positiveData,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Negative',
                    data: negativeData,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Neutral',
                    data: neutralData,
                    borderColor: '#ffeb3b',
                    backgroundColor: 'rgba(255, 235, 59, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Comments'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Sentiment Timeline'
                }
            }
        }
    });
}

async function exportData(format) {
    if (!currentAnalysisData) {
        alert('Please analyze a video first');
        return;
    }
    
    try {
        const response = await fetch('/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                format: format,
                analysis_data: currentAnalysisData
            }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `youtube_sentiment_analysis.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert(`${format.toUpperCase()} export completed successfully!`);
        } else {
            const errorData = await response.json();
            alert(`Export failed: ${errorData.error}`);
        }
    } catch (error) {
        alert('Export failed. Please try again.');
    }
}



