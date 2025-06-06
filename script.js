
// Global Variables
let currentTrack = null;
let isPlaying = false;
let currentPlaylist = [];
let currentTrackIndex = 0;
let isShuffled = false;
let repeatMode = 0; // 0: no repeat, 1: repeat all, 2: repeat one
let audioDelay = 0;

// Audio elements
const audioPlayer = document.getElementById('audioPlayer');
const syncVideo = document.getElementById('syncVideo');

// Sample music data
const sampleTracks = [
    {
        id: 1,
        title: "Blinding Lights",
        artist: "The Weeknd",
        album: "After Hours",
        duration: 200,
        cover: "binding lights.jpeg",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
    },
    {
        id: 2,
        title: "Watermelon Sugar",
        artist: "Harry Styles",
        album: "Fine Line",
        duration: 174,
        cover: "watermelon.jpg",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
    },
    {
        id: 3,
        title: "Levitating",
        artist: "Dua Lipa",
        album: "Future Nostalgia",
        duration: 203,
        cover: "levitating.jpg",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
    },
    {
        id: 4,
        title: "Good 4 U",
        artist: "Olivia Rodrigo",
        album: "SOUR",
        duration: 178,
        cover: "good for you.jpg",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
    },
    {
        id: 5,
        title: "Stay",
        artist: "The Kid LAROI & Justin Bieber",
        album: "F*CK LOVE 3: OVER YOU",
        duration: 141,
        cover: "stay.jpeg",
        url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"
    }
];

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadHomeContent();
});

function initializeApp() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    // Set up audio player events
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    audioPlayer.addEventListener('ended', nextTrack);

    // Set up video sync events
    syncVideo.addEventListener('timeupdate', syncVideoWithAudio);
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        if (e.target.value.length > 2) {
            performSearch(e.target.value);
        }
    });

    // Progress bar interaction
    const progressBg = document.querySelector('.progress-bg');
    progressBg.addEventListener('click', seekTrack);

    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', (e) => {
        setVolume(e.target.value);
    });

    // AI Chat
    const aiChatInput = document.getElementById('aiChatInput');
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendAIMessage();
        }
    });
}

function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));

    // Show selected section
    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load section-specific content
    switch(sectionName) {
        case 'home':
            loadHomeContent();
            break;
        case 'search':
            loadSearchContent();
            break;
        case 'library':
            loadLibraryContent();
            break;
        case 'ai-room':
            loadAIRoomContent();
            break;
        case 'video-sync':
            loadVideoSyncContent();
            break;
    }
}

function loadHomeContent() {
    const recentlyPlayedGrid = document.getElementById('recentlyPlayed');
    const madeForYouGrid = document.getElementById('madeForYou');

    // Load recently played tracks
    const recentlyPlayedHTML = sampleTracks.slice(0, 6).map(track => 
        createMusicCard(track)
    ).join('');
    recentlyPlayedGrid.innerHTML = recentlyPlayedHTML;

    // Load made for you content
    const madeForYouHTML = sampleTracks.map(track => 
        createMusicCard(track)
    ).join('');
    madeForYouGrid.innerHTML = madeForYouHTML;
}

function createMusicCard(track) {
    return `
        <div class="music-card" onclick="playTrack(${track.id})">
            <img src="${track.cover}" alt="${track.title}">
            <h3>${track.title}</h3>
            <p>${track.artist}</p>
        </div>
    `;
}

function playTrack(trackId) {
    const track = sampleTracks.find(t => t.id === trackId);
    if (!track) return;

    currentTrack = track;
    currentPlaylist = sampleTracks;
    currentTrackIndex = sampleTracks.findIndex(t => t.id === trackId);

    // Update player UI
    document.getElementById('playerAlbumCover').src = track.cover;
    document.getElementById('playerSongTitle').textContent = track.title;
    document.getElementById('playerSongArtist').textContent = track.artist;

    // Load and play audio
    audioPlayer.src = track.url;
    audioPlayer.load();
    togglePlay();

    console.log(`Playing: ${track.title} by ${track.artist}`);
}

function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        syncVideo.pause();
        isPlaying = false;
        document.getElementById('playIcon').className = 'fas fa-play';
    } else {
        audioPlayer.play();
        if (document.getElementById('video-sync').classList.contains('active')) {
            syncVideo.play();
        }
        isPlaying = true;
        document.getElementById('playIcon').className = 'fas fa-pause';
    }
}

function nextTrack() {
    if (repeatMode === 2) {
        // Repeat current track
        audioPlayer.currentTime = 0;
        audioPlayer.play();
        return;
    }

    let nextIndex;
    if (isShuffled) {
        nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
        nextIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    }

    if (nextIndex === 0 && repeatMode === 0) {
        // End of playlist, stop playing
        isPlaying = false;
        document.getElementById('playIcon').className = 'fas fa-play';
        return;
    }

    currentTrackIndex = nextIndex;
    playTrack(currentPlaylist[currentTrackIndex].id);
}

function previousTrack() {
    if (audioPlayer.currentTime > 3) {
        // If more than 3 seconds played, restart current track
        audioPlayer.currentTime = 0;
        return;
    }

    let prevIndex;
    if (isShuffled) {
        prevIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
        prevIndex = currentTrackIndex === 0 ? currentPlaylist.length - 1 : currentTrackIndex - 1;
    }

    currentTrackIndex = prevIndex;
    playTrack(currentPlaylist[currentTrackIndex].id);
}

function toggleShuffle() {
    isShuffled = !isShuffled;
    const shuffleBtn = document.getElementById('shuffleBtn');
    shuffleBtn.style.color = isShuffled ? '#1db954' : '#b3b3b3';
    console.log('Shuffle:', isShuffled ? 'ON' : 'OFF');
}

function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    const repeatBtn = document.getElementById('repeatBtn');
    const icon = repeatBtn.querySelector('i');
    
    switch(repeatMode) {
        case 0:
            repeatBtn.style.color = '#b3b3b3';
            icon.className = 'fas fa-redo';
            break;
        case 1:
            repeatBtn.style.color = '#1db954';
            icon.className = 'fas fa-redo';
            break;
        case 2:
            repeatBtn.style.color = '#1db954';
            icon.className = 'fas fa-redo-alt';
            break;
    }
    
    console.log('Repeat mode:', ['OFF', 'ALL', 'ONE'][repeatMode]);
}

function toggleLike() {
    const likeIcon = document.getElementById('likeIcon');
    const isLiked = likeIcon.className.includes('fas');
    
    if (isLiked) {
        likeIcon.className = 'far fa-heart';
        likeIcon.style.color = '#b3b3b3';
    } else {
        likeIcon.className = 'fas fa-heart';
        likeIcon.style.color = '#1db954';
    }
    
    console.log('Track', isLiked ? 'unliked' : 'liked');
}

function toggleMute() {
    const volumeIcon = document.getElementById('volumeIcon');
    const volumeSlider = document.getElementById('volumeSlider');
    
    if (audioPlayer.muted) {
        audioPlayer.muted = false;
        volumeIcon.className = 'fas fa-volume-up';
        volumeSlider.value = audioPlayer.volume * 100;
    } else {
        audioPlayer.muted = true;
        volumeIcon.className = 'fas fa-volume-mute';
    }
}

function setVolume(value) {
    audioPlayer.volume = value / 100;
    const volumeIcon = document.getElementById('volumeIcon');
    
    if (value == 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (value < 50) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function updateProgress() {
    if (!audioPlayer.duration) return;
    
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressHandle').style.left = progress + '%';
    
    document.getElementById('currentTime').textContent = formatTime(audioPlayer.currentTime);
}

function updateDuration() {
    document.getElementById('totalTime').textContent = formatTime(audioPlayer.duration);
}

function seekTrack(e) {
    const progressBg = e.currentTarget;
    const rect = progressBg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    
    audioPlayer.currentTime = percentage * audioPlayer.duration;
    
    // Sync video if active
    if (document.getElementById('video-sync').classList.contains('active')) {
        syncVideo.currentTime = audioPlayer.currentTime + (audioDelay / 1000);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Search functionality
function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    const filteredTracks = sampleTracks.filter(track => 
        track.title.toLowerCase().includes(query.toLowerCase()) ||
        track.artist.toLowerCase().includes(query.toLowerCase()) ||
        track.album.toLowerCase().includes(query.toLowerCase())
    );
    
    const resultsHTML = filteredTracks.map(track => createMusicCard(track)).join('');
    searchResults.innerHTML = `
        <h2>Search Results for "${query}"</h2>
        <div class="music-grid">${resultsHTML}</div>
    `;
}

function loadSearchContent() {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<p>Start typing to search for music...</p>';
}

function loadLibraryContent() {
    const libraryContent = document.getElementById('libraryContent');
    const libraryHTML = sampleTracks.map(track => createMusicCard(track)).join('');
    libraryContent.innerHTML = `<div class="music-grid">${libraryHTML}</div>`;
}

// AI Room functionality
function loadAIRoomContent() {
    console.log('AI Room loaded');
}

function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        addChatMessage(aiResponse, 'ai');
    }, 1000);
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('aiChatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = sender === 'ai' ? 'ai-message' : 'user-message';
    
    if (sender === 'ai') {
        messageDiv.innerHTML = `
            <i class="fas fa-robot"></i>
            <p>${message}</p>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${message}</div>
        `;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateAIResponse(userMessage) {
    const responses = [
        "I'd recommend checking out some jazz fusion tracks that blend smooth rhythms with modern beats!",
        "Based on your listening history, you might enjoy some indie pop with electronic influences.",
        "How about I create a playlist with songs that have similar energy to what you're currently playing?",
        "I can suggest some chill lo-fi tracks perfect for studying or relaxing.",
        "Would you like me to find songs with similar vocals or instrumental arrangements?",
        "I found some great tracks that match your current mood. Shall I add them to your queue?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function generateMoodPlaylist(mood) {
    const moodPlaylists = {
        happy: ["Upbeat Pop Hits", "Feel Good Classics", "Happy Vibes"],
        sad: ["Melancholic Ballads", "Emotional Indie", "Rainy Day Blues"],
        energetic: ["Workout Bangers", "Electronic Energy", "Rock Anthems"],
        chill: ["Lo-Fi Study", "Ambient Relaxation", "Peaceful Acoustics"]
    };
    
    const playlist = moodPlaylists[mood];
    const aiGeneratedPlaylist = document.getElementById('aiGeneratedPlaylist');
    
    aiGeneratedPlaylist.innerHTML = `
        <h4>${mood.charAt(0).toUpperCase() + mood.slice(1)} Playlist Generated</h4>
        <div class="generated-tracks">
            ${playlist.map(track => `
                <div class="generated-track" onclick="playGeneratedTrack('${track}')">
                    <i class="fas fa-play"></i>
                    <span>${track}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    addChatMessage(`I've generated a ${mood} playlist for you! Check out the recommendations on the right.`, 'ai');
}

function playGeneratedTrack(trackName) {
    console.log(`Playing generated track: ${trackName}`);
    addChatMessage(`Playing "${trackName}" from your AI-generated playlist!`, 'ai');
}

// Video Sync functionality
function loadVideoSyncContent() {
    updateSyncStatus('Ready to sync');
}

function syncVideoWithAudio() {
    if (!isPlaying || !currentTrack) return;
    
    const audioTime = audioPlayer.currentTime;
    const videoTime = syncVideo.currentTime;
    const timeDifference = Math.abs(audioTime - videoTime + (audioDelay / 1000));
    
    if (timeDifference > 0.1) { // 100ms tolerance
        syncVideo.currentTime = audioTime + (audioDelay / 1000);
        updateSyncStatus('Syncing...');
    } else {
        updateSyncStatus('In sync');
    }
}

function adjustAudioDelay(value) {
    audioDelay = parseInt(value);
    document.getElementById('delayValue').textContent = `${audioDelay}ms`;
    
    if (isPlaying) {
        syncVideoWithAudio();
    }
}

function updateSyncStatus(status) {
    document.getElementById('syncStatus').textContent = status;
    const syncDot = document.getElementById('syncDot');
    
    if (status === 'In sync') {
        syncDot.style.background = '#1db954';
    } else if (status === 'Syncing...') {
        syncDot.style.background = '#ff6b35';
    } else {
        syncDot.style.background = '#b3b3b3';
    }
}

function loadVideoFile() {
    document.getElementById('videoFileInput').click();
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        syncVideo.src = url;
        updateSyncStatus('Video loaded');
        console.log('Video file loaded:', file.name);
    }
}

// Playlist functionality
function loadPlaylist(type) {
    console.log(`Loading playlist: ${type}`);
    currentPlaylist = sampleTracks;
    
    switch(type) {
        case 'liked':
            addChatMessage('Loaded your liked songs playlist!', 'ai');
            break;
        case 'recently':
            addChatMessage('Loaded your recently played tracks!', 'ai');
            break;
        case 'discover':
            addChatMessage('Loaded your Discover Weekly playlist!', 'ai');
            break;
    }
}

function createPlaylist() {
    const playlistName = prompt('Enter playlist name:');
    if (playlistName) {
        console.log(`Created playlist: ${playlistName}`);
        addChatMessage(`Created new playlist "${playlistName}"!`, 'ai');
    }
}

// Navigation functions
function goBack() {
    console.log('Going back');
}

function goForward() {
    console.log('Going forward');
}

// Initialize volume
document.addEventListener('DOMContentLoaded', function() {
    setVolume(50);
});



