chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getVideoId") {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get("v");
        sendResponse({ videoId: videoId });
    }
});

function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
}

function analyzeVideo(videoId) {
    fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_url: `https://www.youtube.com/watch?v=${videoId}` }),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // Handle the response data
    })
    .catch(error => console.error('Error:', error));
}

if (window.location.hostname === "www.youtube.com" && window.location.search.includes("v=")) {
    const videoId = getVideoId();
    if (videoId) {
        analyzeVideo(videoId);
    }
}
