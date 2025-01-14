document.getElementById('analyze-button').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: "getVideoId" }, (response) => {
            if (response.videoId) {
                fetch('http://localhost:5000/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ video_url: `https://www.youtube.com/watch?v=${response.videoId}` }),
                })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('result').innerText = JSON.stringify(data);
                })
                .catch(error => console.error('Error:', error));
            }
        });
    });
});
