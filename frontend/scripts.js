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
        displayVideoDetails(data.video_details);
        displaySentimentCharts(data.sentiment_analysis);
        displayTopWords(data.top_words);
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


async function downloadReport() {
    const videoUrl = document.getElementById('video-url').value;
    const analyzeResponse = await fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: videoUrl }),
    });

    if (analyzeResponse.ok) {
        const analyzeData = await analyzeResponse.json();
        const reportResponse = await fetch('/download_report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(analyzeData),
        });

        if (reportResponse.ok) {
            const reportBlob = await reportResponse.blob();
            const reportUrl = window.URL.createObjectURL(reportBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = reportUrl;
            a.download = 'report.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(reportUrl);

            alert('Report downloaded successfully');
        } else {
            const errorData = await reportResponse.json();
            alert(`Error: ${errorData.error}`);
        }
    } else {
        const errorData = await analyzeResponse.json();
        alert(`Error: ${errorData.error}`);
    }
}
