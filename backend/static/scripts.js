let currentAnalysisData = null;
let chartTheme = 'light';

function analyzeVideo() {
    const videoUrl = document.getElementById('video-url').value;
    if (!videoUrl) {
        alert('Please enter a YouTube video URL');
        return;
    }

    // Hide analysis section initially
    document.getElementById('analysis-section').style.display = 'none';

    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: videoUrl })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        // Store current analysis data for theme switching
        currentAnalysisData = data;

        // Display video information
        displayVideoInfo(data.video_details);

        // Display sentiment charts
        displaySentimentCharts(data.sentiment_analysis);

        // Display top words
        displayTopWords(data.top_words);

        // Display word cloud
        displayWordCloud(data.top_words);

        // Show results
        document.getElementById('analysis-section').style.display = 'flex';
        document.getElementById('timeline-section').style.display = 'block';
        document.getElementById('export-section').style.display = 'block';

        // Load timeline data
        loadTimeline();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while analyzing the video');
    });
}



function displayVideoInfo(videoInfo) {
    document.getElementById('thumbnail').src = videoInfo.thumbnail;
    document.getElementById('video-title').textContent = videoInfo.title;
    document.getElementById('channel-name').textContent = `Channel: ${videoInfo.channel_name}`;
    document.getElementById('published-at').textContent = `Published: ${videoInfo.published_at}`;
    document.getElementById('likes').textContent = `Likes: ${videoInfo.likes}`;
    document.getElementById('dislikes').textContent = `Dislikes: ${videoInfo.dislikes}`;
    document.getElementById('view-count').textContent = `Views: ${videoInfo.view_count}`;
    document.getElementById('video-duration').textContent = `Duration: ${videoInfo.duration}`;
    document.getElementById('comment-count').textContent = `Comments: ${videoInfo.comment_count}`;
    document.getElementById('video-description').textContent = videoInfo.description;
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

function getChartColors() {
    if (document.body.classList.contains('dark-mode')) {
        return {
            positive: '#4caf50',
            negative: '#f44336',
            neutral: '#ffd600',
            background: '#232a36',
            grid: '#374151',
            text: '#f3f4f6',
            bar: [
                '#6366f1', '#60a5fa', '#4caf50', '#f44336', '#ffd600', '#00bcd4', '#ff9800', '#9c27b0'
            ]
        };
    } else {
        return {
            positive: '#4caf50',
            negative: '#f44336',
            neutral: '#ffeb3b',
            background: '#fff',
            grid: '#e5e7eb',
            text: '#222',
            bar: [
                '#6366f1', '#60a5fa', '#4caf50', '#f44336', '#ffeb3b', '#00bcd4', '#ff9800', '#9c27b0'
            ]
        };
    }
}

function updateChartsForTheme() {
    // Redraw all charts with new theme colors
    if (window.sentimentPieChart && typeof window.sentimentPieChart.destroy === 'function') window.sentimentPieChart.destroy();
    if (window.sentimentBarChart && typeof window.sentimentBarChart.destroy === 'function') window.sentimentBarChart.destroy();
    if (window.topWordsBarChart && typeof window.topWordsBarChart.destroy === 'function') window.topWordsBarChart.destroy();
    if (window.timelineChart && typeof window.timelineChart.destroy === 'function') window.timelineChart.destroy();
    if (currentAnalysisData) {
        displaySentimentCharts(currentAnalysisData.sentiment_analysis);
        displayTopWords(currentAnalysisData.top_words);
        displayWordCloud(currentAnalysisData.top_words);
        loadTimeline();
    }
}
window.updateChartsForTheme = updateChartsForTheme;

function displaySentimentCharts(sentiments) {
    const colors = getChartColors();
    const ctxPie = document.getElementById('sentimentPieChart').getContext('2d');
    if (window.sentimentPieChart && typeof window.sentimentPieChart.destroy === 'function') window.sentimentPieChart.destroy();
    window.sentimentPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                data: [sentiments.positive, sentiments.negative, sentiments.neutral],
                backgroundColor: [colors.positive, colors.negative, colors.neutral],
            }],
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: colors.text }
                }
            }
        }
    });

    const ctxBar = document.getElementById('sentimentBarChart').getContext('2d');
    if (window.sentimentBarChart && typeof window.sentimentBarChart.destroy === 'function') window.sentimentBarChart.destroy();
    window.sentimentBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Positive', 'Negative', 'Neutral'],
            datasets: [{
                label: 'Sentiment Analysis',
                data: [sentiments.positive, sentiments.negative, sentiments.neutral],
                backgroundColor: [colors.positive, colors.negative, colors.neutral],
            }],
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: colors.text }
                }
            },
            scales: {
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                }
            }
        }
    });
}

function displayTopWords(words) {
    const colors = getChartColors();
    const ctxTopWords = document.getElementById('topWordsBarChart').getContext('2d');
    const labels = words.map(word => word[0]);
    const data = words.map(word => word[1]);
    if (window.topWordsBarChart && typeof window.topWordsBarChart.destroy === 'function') window.topWordsBarChart.destroy();
    window.topWordsBarChart = new Chart(ctxTopWords, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Top 5 Adjectives',
                data: data,
                backgroundColor: colors.bar.slice(0, labels.length)
            }]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: colors.text }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
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
    
    // Show loading state
    const timelineContainer = document.getElementById('timelineChart');
    if (timelineContainer) {
        timelineContainer.style.opacity = '0.5';
    }
    
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
            console.error('Timeline error:', errorData.error);
            // Don't show alert for automatic loading
            if (!currentAnalysisData) {
                alert(`Error loading timeline: ${errorData.error}`);
            }
        }
    } catch (error) {
        console.error('Timeline error:', error);
        // Don't show alert for automatic loading
        if (!currentAnalysisData) {
            alert('Error loading timeline data');
        }
    } finally {
        // Restore opacity
        if (timelineContainer) {
            timelineContainer.style.opacity = '1';
        }
    }
}

function displayTimelineChart(timelineData) {
    const canvas = document.getElementById('timelineChart');
    if (!canvas) {
        console.error('Timeline chart canvas not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!timelineData || !Array.isArray(timelineData) || timelineData.length === 0) {
        console.error('Invalid timeline data');
        return;
    }
    if (window.timelineChart && typeof window.timelineChart.destroy === 'function') {
        window.timelineChart.destroy();
    }
    const colors = getChartColors();
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
                    borderColor: colors.positive,
                    backgroundColor: colors.positive + '22',
                    tension: 0.4
                },
                {
                    label: 'Negative',
                    data: negativeData,
                    borderColor: colors.negative,
                    backgroundColor: colors.negative + '22',
                    tension: 0.4
                },
                {
                    label: 'Neutral',
                    data: neutralData,
                    borderColor: colors.neutral,
                    backgroundColor: colors.neutral + '22',
                    tension: 0.4
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    labels: { color: colors.text }
                },
                title: {
                    display: true,
                    text: 'Sentiment Timeline',
                    color: colors.text
                }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Comments',
                        color: colors.text
                    },
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: colors.text
                    },
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
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



